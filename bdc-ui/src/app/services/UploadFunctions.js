// UploadFunctions.js
import Bottleneck from "bottleneck";
import { showDirectoryPicker } from "https://cdn.jsdelivr.net/npm/file-system-access/lib/es2018.js";
import { jsonrepair } from "jsonrepair";
import { createInspection, deleteInspection, getInspectionStats, uploadImageFileAndMetadata } from "./inspection_api";
import { uploadAnnotationMeasurementFile } from "./measurement_api";
import {
  uploadMeasurementImageAndAnnotation,
  getVTShotListForImage,
  getMeasurementListForImage,
  getImage,
  updateImage
} from "./image_api";
import {  getListOfImagesWithMissingFiles } from "./maintenance_api";
import { createVTShot, emptyVTShot, uploadImageVTShotFile } from "./vtshot_api";

import { createInspectionLogEntry, getInspectionLogBodyObj } from "./inspection_logs_api";

const ANNOTATION_FILE_PATTERN = /\w+-\w+-\w+_mid\d+.json/g;

export const handleDirectoryEntry = async (dirHandle, out) => {
  for await (const entry of dirHandle.values()) {
    if (entry.kind === "file") {
      const file = await entry.getFile();
      if (!file.name.startsWith(".")) out[file.name] = file;
    }
    if (entry.kind === "directory") {
      const newHandle = await dirHandle.getDirectoryHandle(entry.name, {
        create: false,
      });
      if (!entry.name.startsWith(".")) {
        const newOut = (out[entry.name] = {});
        await handleDirectoryEntry(newHandle, newOut);
      }
    }
  }
};


const NUMBER_PARALLEL_TASKS = 5;
const uploadDirLimiter = new Bottleneck({
    maxConcurrent: NUMBER_PARALLEL_TASKS,
});

// Upload inspection directory containing images, measurements, virtual tour
// That's what gets called when one uploads an inspection a new.
export const uploadDir = async (
  setUploadProgress,
  setInspectionList,
  inspectionList,
  setGroupedInspectionList,
  groupDataByEsn,
  sso
) => {
  const out = {};

  let dirHandle = null;
  try {
    dirHandle = await showDirectoryPicker();
    await handleDirectoryEntry(dirHandle, out);
  } catch (e) {
    console.error(e);
    return;
  }
  let importDirName = dirHandle.name;

  // look for inspection metadata file in root folder
  let inspectionId = -1;
  let metadataFile = out["metadata.yml"];

  if (metadataFile == null) {
    metadataFile = out["metadata.json"];
  }

  if (metadataFile == null) {
    alert(
      "Import aborted. Could not find inspection folder metadata.yml or metadata.json file!"
    );
    return;
  }

  let imagesFolder = out["images"];
  if (imagesFolder == null) {
    alert("Import Aborted: Could not find /images folder!");
    return;
  }

  let missingMetadataFiles = validate360ImagesFolder(imagesFolder);
  if (missingMetadataFiles.length > 0) {
    alert(
      `Import Aborted: 360 images/ folder must include a .json meta-data file for each image. Missing meta-data files: ${missingMetadataFiles}`
    );
    return;
  }

  let textContent = await metadataFile.text();
  let repairedJsonText = jsonrepair(textContent);
  let jsonContent = JSON.parse(repairedJsonText);

  if (
    (jsonContent["loc"] == null && jsonContent["location"] == null) ||
    (jsonContent["datetime"] == null && jsonContent["date"] == null)
  ) {
    alert(
      "Wrong metadata file format. \nMake sure the folder includes a valid inspection. \nFolder cannot not be imported. "
    );
    return;
  }

  const inspectionBody = {
    app_type: jsonContent["app_type"],
    customer_name: jsonContent["cust"],
    date: jsonContent["datetime"] || jsonContent["date"],
    disp: jsonContent["disp"],
    engine_type: jsonContent["engine_type"],
    blade_type: jsonContent["blade_type"],
    esn: jsonContent["esn"],
    location: jsonContent["loc"] || jsonContent["location"],
    misc: jsonContent["misc"],
    sect: jsonContent["sect"],
    manufacture_stage:
      jsonContent["inspection_stage"] || jsonContent["manufacture_stage"],
    factory_name: jsonContent["factory"] || jsonContent["factory_name"],
    supplier: jsonContent["supplier"],
  };

  if (inspectionBody.date == null || inspectionBody.date === "") {
    inspectionBody.date = new Date().toISOString().split("T")[0];
  }

  let newInspection = await createInspection(inspectionBody);
  if (newInspection == null || newInspection.id == null) {
    alert(
      "Could not create new inspection. Import process aborted. Make sure the server is up and running and there is network connectivity to the server."
    );
    return;
  }

  inspectionId = newInspection.id;

  let bladeId = 1;

  let totalFiles = Object.keys(imagesFolder).length;
  let doneFilesSet = new Set();

  const doneUploadCB = (filename) => {
    doneFilesSet.add(filename);
    let progress = Math.round(100 * (doneFilesSet.size / totalFiles));
    setUploadProgress(progress);
  };

  setUploadProgress(1); // show progress bar and start counting...
  const callList = [];

  const stats = {
    "inspection_id": inspectionId,
    "image_count": 0,
    "vtshot_count": 0,
    "measurement_count": 0
}

  for (let filename of Object.keys(imagesFolder)) {
    callList.push(
      uploadDirLimiter.schedule(
      () => processInspection360ImageFile(
        filename,
        imagesFolder,
        inspectionId,
        bladeId,
        stats,
        doneUploadCB
      ))
      .then((resp) => {/* console.log(`processing: ${filename}...`); */ })
      .catch((err) => {console.log('err:',err)})
      .finally(() => {/* console.log(`done processing: ${filename}...`); */ })
    ); // push
  }
  // wait until all files are done uploading
  await Promise.all(callList);

  // ----------------------------- Validate inspection after upload -------------------
  
  let inspectionRecordStats = await getInspectionStats( inspectionId);
    
  if (inspectionRecordStats['measurement_count'] !== stats['measurement_count'] ||
      inspectionRecordStats['vtshot_count'] !== stats['vtshot_count'] ||
      inspectionRecordStats['image_count'] !== stats['image_count']
  ) {
    const errorMessage =  `Number of images in DB does not match input folder. 
    DB stats: ${inspectionRecordStats}, input folder stats: ${stats} 
    \nThe newly created Inspection id: ${inspectionId} will be deleted.`;
    alert(errorMessage);
    let resp = await deleteInspection(inspectionId);

    let logBody = getInspectionLogBodyObj(inspectionId, 
                                        importDirName.toString(), 
                                        errorMessage,
                                        'UPLOAD',
                                        'FAILURE',
                                        sso );
    let createLogResp = await createInspectionLogEntry(logBody);
    console.log('logged:',createLogResp);
    return;
  }

  
  let missingImagesList = await getListOfImagesWithMissingFiles(inspectionId);
  if (missingImagesList.length > 0) {
    let idList = '';
    for (let imageFile of missingImagesList) {
      //console.log('missing image file:',imageFile)
      if (idList.length > 0) idList += ', ';
      idList += imageFile["id"];
    }
    alert(
      `Error importing image files. 
      These image record ids did not import correctly: ${idList}.
      \n Their image DB records have no corresponding image files. 
      \n The newly created Inspection id: ${inspectionId} will be deleted.`
    );
    let resp = await deleteInspection(inspectionId);

    let logBody = getInspectionLogBodyObj(inspectionId, 
                                        importDirName.toString(), 
                                        `Error importing image files. ${idList.length} images did not import correctly`,
                                        'UPLOAD',
                                        'FAILURE',
                                        sso );
    let createLogResp = await createInspectionLogEntry(logBody);
    console.log('logged:',createLogResp);
    return;
  }

  // ---------------------------- Refresh UI ------------------------------------
  setInspectionList([...inspectionList, newInspection]);
  setGroupedInspectionList(groupDataByEsn([...inspectionList, newInspection]));
  setUploadProgress(0); // turn off progress bar
  
  let logBody = getInspectionLogBodyObj(inspectionId, 
    importDirName.toString(), 
    `Created new inspection record: ${inspectionId} with ${totalFiles} 360 images.`,
    'UPLOAD',
    'SUCCESS',
    sso );

  let createLogResp = await createInspectionLogEntry(logBody);
  console.log('logged:',createLogResp);
};


/**
 * Used by Arpit to upload label-me annotations associated to measurement files.
 * The annotations are linked to the original annotations based on the measurement id or mid which is part of the .json annotation file name.
 * @param {*} setUploadProgress 
 * @param {*} handleFetchInspectionList
 */
export const uploadAnnotationsDir = async (
  setUploadProgress, 
  handleFetchInspectionList
) => {
  const annotationsFolder = {};

  try {
    const dirHandle = await showDirectoryPicker();
    await handleDirectoryEntry(dirHandle, annotationsFolder);
  } catch (e) {
    console.error(e);
    return;
  }
  
  let skippedFilesList = [];
  let filesToImportList = [];
  setUploadProgress(1);
  for (let filename of Object.keys(annotationsFolder)) {
    if (filename.endsWith(".json") && filename.match(ANNOTATION_FILE_PATTERN)) {
      filesToImportList.push(filename);
    } else {
      skippedFilesList.push(filename);
    }
  }

  let totalFiles = filesToImportList.length;
  let doneFilesSet = new Set();

  const doneUploadCB = (filename) => {
    doneFilesSet.add(filename);
    let progress = Math.round(100 * (doneFilesSet.size / totalFiles));
    setUploadProgress(progress);
  };

  const NUMBER_PARALLEL_UPLOADS = 3;
  let uploadFilesLimiter = new Bottleneck({
    maxConcurrent: NUMBER_PARALLEL_UPLOADS,
  });
  const callList = [];
  setUploadProgress(1);

  for (let filename of filesToImportList) {
    let annotationFile = annotationsFolder[filename];
    let suffix = filename.split("_mid")[1];
    let measurementId = suffix.split(".")[0];
    callList.push(uploadFilesLimiter
      .schedule(() =>
        uploadAnnotationFile(
          filename,
          measurementId,
          annotationFile,
          doneUploadCB
        )
      )
      .then((resp) => {})
      .catch((err) => {})
      .finally(() => {})
    ); //push
  }

  // Wait until all files are uploaded.
  await Promise.all(callList);
  setUploadProgress(0); // reset progress bar

  if (skippedFilesList.length > 0) {
    alert(
      "Files skipped due to missing _mid[number] suffix:\n" +
        skippedFilesList.join("\n") +
        "\n\nFiles imported:\n" +
        filesToImportList.join("\n")
    );
  } else {
    //refresh inspection list from UI
    handleFetchInspectionList();
  }
};

export const uploadAnnotationFile = async (
  filename,
  measurementId,
  file,
  doneUploadCB
) => {
  try {
    let data = await uploadAnnotationMeasurementFile(measurementId, file);
  } catch (err) {
    console.error(err);
  }
  doneUploadCB(filename);
};

/**
 * Uploads individual 360 file and its corresponding annotation and virtualtour files
 * 
 * @param {*} filename is the 360 image name
 * @param {*} imagesFolder is a map of all files and folders in current path
 * @param {*} inspectionId is the newly created inspection id
 * @param {*} bladeId is the blade record id used for this inspection (will remove in the future) 
 * @param {*} doneCallback indicates this 360 file and sub-folder processing is done.
 */
export const processInspection360ImageFile = async (
  filename,
  imagesFolder,
  inspectionId,
  bladeId,
  stats,
  doneCallback
) => {
  if (filename.endsWith(".png") || filename.endsWith(".jpg")) {
    const imageFile = imagesFolder[filename];
    const imagePrefix = filename.split(/\.(jpg|png)/)[0];
    const metaFileName = imagePrefix + ".json";
    const imageMetaFile = imagesFolder[metaFileName];

    let resp = {};
    if (imageMetaFile != null && imageFile != null) {
      resp = await uploadImageFileAndMetadata(
        inspectionId,
        bladeId,
        imageFile,
        imageMetaFile
      );
    }
    stats['image_count'] += 1;
    let imageId = resp["image_id"];
    
    // Process the measurements (snapshots and annotations) folder associated to this 360 image file
    const measurementsFolderName = imagePrefix + "_measurements";
    if (imageId != null && imagesFolder[measurementsFolderName] != null) {
      let measurementFolder = imagesFolder[measurementsFolderName];
      for (let entryName of Object.keys(measurementFolder)) {
        if (entryName.endsWith(".png") || entryName.endsWith(".jpg")) {
          const measurementImageFile = measurementFolder[entryName];
          const measurementImageFilePrefix = entryName.split(/\.(jpg|png)/)[0];

          const measurementAnnotationFilename =
            measurementImageFilePrefix + ".json";
          const measurementAnnotationFile =
            measurementFolder[measurementAnnotationFilename];

          let annotationUploadResp = await uploadMeasurementImageAndAnnotation(
            imageId,
            measurementImageFile,
            measurementAnnotationFile
          );
          stats['measurement_count'] += 1;
        }
      }
    }

    // Process any virtual tour files (typically 8 files) associated to this 360 image
    const virtualTourFolderName = imagePrefix + "_virtualtour";
    if (imageId != null && imagesFolder[virtualTourFolderName] != null) {
      let virtualTourFolder = imagesFolder[virtualTourFolderName];
      for (let entryName of Object.keys(virtualTourFolder)) {
        if (entryName.endsWith(".png") || entryName.endsWith(".jpg")) {
          const virtualTourImageFile = virtualTourFolder[entryName];
          const virtualTourImageFilePrefix = entryName.split(/\.(jpg|png)/)[0];

          const virtualTourMetadataFilename =
            virtualTourImageFilePrefix + ".json";
          const virtualTourMetadataFile =
            virtualTourFolder[virtualTourMetadataFilename];

          let metadataContent = {};
          if (virtualTourMetadataFile != null) {
            let textContent = await virtualTourMetadataFile.text();
            let repairedJsonText = jsonrepair(textContent);
            metadataContent = JSON.parse(repairedJsonText);
          }

          let createVTShotBody = Object.assign({}, emptyVTShot);
          createVTShotBody["date"] = new Date().toISOString();
          createVTShotBody["image_hfov"] = metadataContent["imageHfov"] || null;
          createVTShotBody["image_id"] = imageId;
          createVTShotBody["image_pitch"] =
            metadataContent["imagePitch"] || null;
          createVTShotBody["image_yaw"] = metadataContent["imageYaw"] || null;

          let createRecordResp = await createVTShot(createVTShotBody);
          let vtshotId = createRecordResp.id;

          let uploadVtshotFileResp = await uploadImageVTShotFile(
            vtshotId,
            virtualTourImageFile
          );
          stats['vtshot_count'] += 1;
        }
      }
    }
  }
  // finish uploading the 360 file, measurements and virtual tour files.
  doneCallback(filename);
};

export const validate360ImagesFolder = (imagesFolder) => {
  let missingFiles = [];
  for (let filename of Object.keys(imagesFolder)) {
    if (filename.endsWith(".png") || filename.endsWith(".jpg")) {
      const imagePrefix = filename.split(/\.(jpg|png)/)[0];
      const metaFileName = imagePrefix + ".json";
      const imageMetaFile = imagesFolder[metaFileName];
      if (imageMetaFile == null) {
        missingFiles.push(metaFileName);
      }
    }
  }
  return missingFiles;
};


