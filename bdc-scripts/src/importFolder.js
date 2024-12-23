"use strict";

const { jsonrepair } = require('jsonrepair');
const path = require("path");
const fs = require("fs");
const { createInspection, 
        uploadImageFileAndMetadata, 
        uploadMeasurementImageAndAnnotation, 
        createVTShot, 
        uploadImageVTShotFile, 
        getListOfImagesWithMissingFiles, 
        getListOfImages, 
        getInspectionLogBodyObj, 
        createInspectionLogEntry, 
        getInspectionStats } = require('./bdc_api');
const Bottleneck = require("bottleneck");

const printLogs = false;
const printProgress = true;

function handleDirectoryEntry(dirHandle, out) {

    for (const entry of fs.readdirSync(dirHandle)) {
        const absPath = path.join(dirHandle, entry);
        if (fs.statSync(absPath).isDirectory()) {
            const newHandle = absPath
            const newOut = (out[entry] = {});
            handleDirectoryEntry(newHandle, newOut);

        } else {
            out[entry] = absPath;
        }

    }
};


const NUMBER_PARALLEL_TASKS = 5;
const uploadDirLimiter = new Bottleneck({
    maxConcurrent: NUMBER_PARALLEL_TASKS,
});

async function uploadDir(dirPath) {
    const out = {};

    try {
        handleDirectoryEntry(dirPath, out);
        printLogs && console.log("Directory structure:", out);
    } catch (e) {
        console.log('Error:', e);
    }


    // Process the output list of files and directories....

    // --------------------- parse metadata.yml file --------------------------
    let inspectionId = -1;
    let metadataFile = out["metadata.yml"];

    // try .json extension instead
    if (metadataFile == null) {
        metadataFile = out["metadata.json"];
    }

    if (metadataFile == null) {
        console.log("Import aborted. Could not find inspection folder metadata.yml or metadata.json file!");
        return;
    }
    console.log("Create inspection using metadata");
    let textContent = await fs.readFileSync(metadataFile, "utf8");
    let repairedJsonText = jsonrepair(textContent); // the format within .yml is not standard json
    let jsonContent = JSON.parse(repairedJsonText);
    console.log("metadata.yml json content:", jsonContent);

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
      manufacture_stage: jsonContent["inspection_stage"] || jsonContent["manufacture_stage"],
      factory_name: jsonContent['factory'] || jsonContent['factory_name'],
      supplier: jsonContent["supplier"]
    };

    if (inspectionBody.date == null || inspectionBody.date === '') {
        inspectionBody.date = new Date().toISOString();
    }

    let newInspection = await createInspection(BASE_URL, inspectionBody);
    //console.log("createInspection resp:", newInspection);
    inspectionId = newInspection.id;

    // ------------------------ parse images/ folder --------------------------
    let imagesFolder = out["images"];
    if (imagesFolder == null) {
        alert("Could not find /images folder!");
        return;
    }
    let bladeId = 1; //TODO: obtain the blade id from the user

    let totalFiles = Object.keys(imagesFolder).length;
    let doneFilesSet = new Set();

    // Callback function used to track the completed uploads...
    const doneUploadCB = (filename) => {
        doneFilesSet.add(filename);
        let progress = Math.round(100 * (doneFilesSet.size / totalFiles));
        printProgress && console.log("Progress:", progress);
    };

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
            () => processInspectionFile(filename, imagesFolder, inspectionId, bladeId, stats, doneUploadCB)
            )
            .then((resp) => {/* console.log(`processing: ${filename}...`); */ })
            .catch((err) => {console.log('err:',err)})
            .finally(() => {/* console.log(`done processing: ${filename}...`); */ })
        )
    }

    // wait for completion of parallel upload
    await Promise.all(callList);

    
    console.log('Verifying import...');

    let inspectionRecordStats = await getInspectionStats(BASE_URL, inspectionId);
    
    if (inspectionRecordStats['measurement_count'] !== stats['measurement_count'] ||
        inspectionRecordStats['vtshot_count'] !== stats['vtshot_count'] ||
        inspectionRecordStats['image_count'] !== stats['image_count']
    ) {

        console.log('Import ERROR')
        let errorMessage =`Number of images in DB:  ${inspectionRecordStats}} do not match folder count: ${stats}}`
        console.log(errorMessage);

        let logBody = getInspectionLogBodyObj(inspectionId, 
            dirPath.toString(), 
            errorMessage,
            'UPLOAD',
            'FAILURE',
            'SCRIPT' );
        let createLogResp = await createInspectionLogEntry(BASE_URL, logBody);
    }


    let imagesWithMissingFiles = await getListOfImagesWithMissingFiles(BASE_URL, inspectionId);
    let listOfImages = await getListOfImages(BASE_URL, inspectionId);
    
    if (imagesWithMissingFiles.length > 0 || listOfImages.length == 0) {
        console.log('Import ERROR')
        let errorMessage =`Found ${imagesWithMissingFiles.length} missing image files in DB.`
        console.log(errorMessage);

        let logBody = getInspectionLogBodyObj(inspectionId, 
            dirPath.toString(), 
            errorMessage,
            'UPLOAD',
            'FAILURE',
            'SCRIPT' );
        let createLogResp = await createInspectionLogEntry(BASE_URL, logBody);

    } else {
        console.log('Import SUCCESS');

        let logBody = getInspectionLogBodyObj(inspectionId, 
            dirPath.toString(), 
            `Created new inspection record: ${inspectionId} with ${totalFiles} 360 images.`,
            'UPLOAD',
            'SUCCESS',
            'SCRIPT' );
        let createLogResp = await createInspectionLogEntry(BASE_URL, logBody);

        console.log('New Inspection:', newInspection);
        console.log(`New Inspection Url: http://localhost:3000/imageinspection/${newInspection.id}`);        

    }
    console.log(`Inspection has ${listOfImages.length} panoramic image records.`);

};

const emptyVTShot = {
    "image_id": -1,

    "date": null,
    "image_hfov": 0.0,
    "image_pitch": 0.0,
    "image_yaw": 0.0,
    
    "root_face_distance": 0.0,
};

// This method uploads an image.png file plus its required associated image.json meta-data file (which contains distance) and other info
// It also looks for and processes the optional /imageName_measuremnets folder.
// within the /imageName_measurements folder, annotations i.e. imageMeasurement.json files are optional.
async function processInspectionFile(
    filename,
    imagesFolder,
    inspectionId,
    bladeId,
    stats,
    doneCallback
) {
    printLogs && console.log(`Name: ${filename}, value: ${imagesFolder[filename]}`);
    if (filename.endsWith(".png") || filename.endsWith(".jpg")) {
        // 360 image
        const imageFile = imagesFolder[filename];
        const imagePrefix = filename.split(/\.(jpg|png)/)[0];
        // contention name of companion image meta-data file 
        const metaFileName = imagePrefix + ".json";
        // search for corresponding metadata.json (or metadata.yml) file for the 360 image
        const imageMetaFile = imagesFolder[metaFileName];

        let resp = {};
        // found both .png and .json files...
        if (imageMetaFile != null && imageFile != null) {
            resp = await uploadImageFileAndMetadata(BASE_URL,
                inspectionId,
                bladeId,
                imageFile,
                imageMetaFile
            );
            printLogs && console.log("resp:", resp);
            stats['image_count'] += 1;
        } else {
            // ignore other types of files other than .png, .jpg and .json
            printLogs && console.log("skip upload of: ", filename);
        }

        let imageId = resp["image_id"];

        // --------------------------- process _measurement folder (if any) -------------------------
        const measurementsFolderName = imagePrefix + "_measurements";
        if (imageId != null && imagesFolder[measurementsFolderName] != null) {
            let measurementFolder = imagesFolder[measurementsFolderName];
            printLogs && console.log(
                "Processing measurements folder:",
                measurementsFolderName,
                " for imageId:",
                imageId,
                "filename:",
                filename
            );
            for (let entryName of Object.keys(measurementFolder)) {
                if (entryName.endsWith(".png") || entryName.endsWith(".jpg")) {
                    const measurementImageFile = measurementFolder[entryName];
                    const measurementImageFilePrefix = entryName.split(/\.(jpg|png)/)[0];

                    const measurementAnnotationFilename =
                        measurementImageFilePrefix + ".json";
                    const measurementAnnotationFile =
                        measurementFolder[measurementAnnotationFilename];

                    let annotationUploadResp =
                        await uploadMeasurementImageAndAnnotation(BASE_URL,
                            imageId,
                            measurementImageFile,
                            measurementAnnotationFile
                        );
                    printLogs && console.log(
                        "uploadMeasurementImageAndAnnotation resp:",
                        annotationUploadResp
                    );
                    stats['measurement_count'] += 1;
                }
            }
        } else {
            printLogs && console.log("No _measurements folder for: ", filename);
        }

        // --------------------------- process _virtualtour folder (if any) -------------------------
        const virtualTourFolderName = imagePrefix + "_virtualtour";
        if (imageId != null && imagesFolder[virtualTourFolderName] != null) {
        let virtualTourFolder = imagesFolder[virtualTourFolderName];
        printLogs && console.log(
            "Processing virtualtour folder:",
            virtualTourFolderName,
            " for imageId:",
            imageId,
            "filename:",
            filename
        );
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
                    let textContent = await fs.readFileSync(virtualTourMetadataFile, "utf8");
                    let repairedJsonText = jsonrepair(textContent); // the format within .yml is not standard json
                    metadataContent = JSON.parse(repairedJsonText);
                } 

                let createVTShotBody = Object.assign({}, emptyVTShot);
                createVTShotBody["date"] = new Date().toISOString();
                createVTShotBody["image_hfov"] = metadataContent['imageHfov'] || null;
                createVTShotBody["image_id"] = imageId;
                createVTShotBody["image_pitch"] = metadataContent['imagePitch'] || null;
                createVTShotBody["image_yaw"] = metadataContent['imageYaw'] || null;
                
                let createRecordResp = await createVTShot(BASE_URL, createVTShotBody);
                let vtshotId = createRecordResp.id;
                printLogs && console.log('Created vtshot record id: ',vtshotId);

                let uploadVtshotFileResp = await uploadImageVTShotFile(BASE_URL, vtshotId, virtualTourImageFile);
                printLogs && console.log('uploaded VTShot file resp:',uploadVtshotFileResp);

                stats['vtshot_count'] += 1;
            }
        }
        } else {
            printLogs && console.log("No _virtualtour folder for: ", filename);
        }


    }
    doneCallback(filename);

};


// ================================== Main =======================================

console.log('Import data Script');

const nodeCmd = process.argv[0]
const appName = process.argv[1]
const hostname = process.argv[2]
const dirPath = process.argv[3]


const BASE_URL = `http://${hostname}:8090/api`;
const ANNOTATION_FILE_PATTERN = /\w+-\w+-\w+_mid\d+.json/g;

if (process.argv.length === 2) {
    console.error('Expecting at least 2 parameters.');
    console.log.apply('Usage: node ./src/app.js hostname dirPath');
    process.exit(1);
}

if (hostname == null) {
    console.log('missing hostname');
    process.exit(1);
}
if (dirPath == null) {
    console.log('missing dirPath');
    process.exit(1);
}


uploadDir(dirPath);


