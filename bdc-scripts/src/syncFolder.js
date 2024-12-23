"use strict";

const { jsonrepair } = require('jsonrepair');
const path = require("path");
const fs = require("fs");
const { createInspection, uploadImageFileAndMetadata, uploadMeasurementImageAndAnnotation, searchInspection: searchInspections, getListOfImagesWithMissingFiles, updateImageFile } = require('./bdc_api');

/**
 * The sync script will first locate an existing inspection matching the
 * metadata.json file props.
 * If the report existing, it will query for the list of missing images for missing images, including the imageId and z_distance
 * The missing images will be matched by z distance, and uploaded using existing imageId.  
 */

// ----------------------------- Utility functions -----------------------------
function parseDirectory(dirHandle, out) {

    for (const entry of fs.readdirSync(dirHandle)) {
        const absPath = path.join(dirHandle, entry);
        if (fs.statSync(absPath).isDirectory()) {
            const newHandle = absPath
            const newOut = (out[entry] = {});
            parseDirectory(newHandle, newOut);

        } else {
            out[entry] = absPath;
        }

    }
};
//------------------------------------------------------------------------------

async function syncDir(dirPath) {
    const out = {};

    try {
        parseDirectory(dirPath, out);
        console.log("Directory structure:", out);
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
        console.log("Sync aborted. Could not find inspection folder metadata.yml or metadata.json file!");
        return;
    }

    console.log("Sync inspection using metadata...");
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
        console.log("Progress:", progress);

    };



    //TODO: Search for reports like this
    let existingInspectionList = await searchInspections(BASE_URL, 
        inspectionBody.esn,
        inspectionBody.sect, 
        inspectionBody.date, 
        inspectionBody.manufacture_stage);


    if (existingInspectionList != null && existingInspectionList.length === 0) {
        console.log('Importing folder as a NEW inspection...')

        if (inspectionBody.date == null || inspectionBody.date === '') {
            inspectionBody.date = new Date().toISOString();
        }

        let newInspection = await createInspection(BASE_URL, inspectionBody);
        console.log("createInspection resp:", newInspection);
        inspectionId = newInspection.id;

        // ------------------------ parse images/ folder --------------------------

        let callList = [];
        for (let filename of Object.keys(imagesFolder)) {
            callList.push(
                processInspectionFile(filename, imagesFolder, inspectionId, bladeId, doneUploadCB)
            );
        }
        // upload all files in parallel
        await Promise.all(callList);
        console.log('New Inspection:', newInspection);
        console.log(`New Inspection Url: http://localhost:3000/imageinspection/${newInspection.id}`);

    } else { // sync existing folder

        if (existingInspectionList.length > 1) {
            console.log('Error: Found more than one inspection with same esn, sect, date and manufacture_stage');
            console.log('List of duplicate inspections:')
            for (let inspection of existingInspectionList) {
                console.log(inspection);
            }
            console.log('please modify your metadata.yml (or metadata.json) file to uniquely identify your inspection by: esn, datetime, sect, and manufacture_stage')
            process.exit(1);
        }

        // found exactly one inspection record
        let inspection = existingInspectionList[0];
        console.log(`Syncing folder with existing inspection id# ${inspection.id}`);

        let imagesWithMissingFiles = await getListOfImagesWithMissingFiles(BASE_URL, inspection.id);
        console.log(`Found ${imagesWithMissingFiles.length} missing files.`);
        if (imagesWithMissingFiles.length == 0) {
            console.log('Nothing to sync.');
        } else {
            let distanceImageMap = {};

            for (let image of imagesWithMissingFiles) {
                let distance_key  = image.distance.toFixed(1); // in the DB, distance is a float
                console.log(`image id: ${image.id}, distance: ${distance_key} has no image_file`);
                distanceImageMap[distance_key] = image
            }

            // ---------------------- Process images folder looking for those in the imagesWithMissingFiles list
            let callList = [];
            for (let filename of Object.keys(imagesFolder)) {
                callList.push(
                    syncInspectionFile(filename, imagesFolder, inspectionId, bladeId, distanceImageMap, doneUploadCB)
                );
            }
            // upload all files in parallel
            await Promise.all(callList);
        }

    }
};


async function syncInspectionFile(
    filename,
    imagesFolder,
    inspectionId,
    bladeId,
    distanceImageMap,
    doneCallback
) {
    console.log(`Sync File: ${filename}, value: ${imagesFolder[filename]}`);
    if (filename.endsWith(".png") || filename.endsWith(".jpg")) {
        // 360 image
        const imageFile = imagesFolder[filename];
        const imagePrefix = filename.split(".")[0];
        const metaFileName = imagePrefix + ".json";
        // search for corresponding meta-data .json file for the 360 image
        const imageMetaFile = imagesFolder[metaFileName];

        const metatadaJson = JSON.parse(fs.readFileSync(imageMetaFile, 'utf8'));
        const distance_key = parseFloat(metatadaJson.image_distance).toFixed(1); // iin the meta-data, image_distance is a string
        if (distanceImageMap[distance_key] != null) {
            console.log(`Uploading missing file for distance: ${distance_key}...`);
            let imageRec = distanceImageMap[distance_key];
            let imageId = imageRec.id;
            let resp = await updateImageFile(BASE_URL,imageId,imageFile);
            //console.log("resp:", resp);
            
        } else {

            console.log(`Skip. Nothing to sync.`);

            // let resp = {};
            // // found both .png and .json files...
            // if (imageMetaFile != null && imageFile != null) {
            //     resp = await uploadImageFileAndMetadata(BASE_URL,
            //         inspectionId,
            //         bladeId,
            //         imageFile,
            //         imageMetaFile
            //     );
            //     console.log("resp:", resp);
            // } else {
            //     console.log("skip upload of: ", filename);
            // }

            // let imageId = resp["image_id"];

            // // --------------------------- process measurement folder (if any) -------------------------
            // const measurementsFolderName = imagePrefix + "_measurements";
            // if (imageId != null && imagesFolder[measurementsFolderName] != null) {
            //     let measurementFolder = imagesFolder[measurementsFolderName];
            //     console.log(
            //         "Processing measurements folder:",
            //         measurementsFolderName,
            //         " for imageId:",
            //         imageId,
            //         "filename:",
            //         filename
            //     );
            //     for (let entryName of Object.keys(measurementFolder)) {
            //         if (entryName.endsWith(".png") || entryName.endsWith(".png")) {
            //             const measurementImageFile = measurementFolder[entryName];
            //             const measurementImageFilePrefix = entryName.split(".")[0];

            //             const measurementAnnotationFilename =
            //                 measurementImageFilePrefix + ".json";
            //             const measurementAnnotationFile =
            //                 measurementFolder[measurementAnnotationFilename];

            //             let annotationUploadResp =
            //                 await uploadMeasurementImageAndAnnotation(BASE_URL,
            //                     imageId,
            //                     measurementImageFile,
            //                     measurementAnnotationFile
            //                 );
            //             console.log(
            //                 "uploadMeasurementImageAndAnnotation resp:",
            //                 annotationUploadResp
            //             );
            //         }
            //     }
            // } else {
            //     console.log("No _measurements folder for: ", filename);
            // }
        }
    }
    doneCallback(filename);

};



// This method uploads an image.png file plus its required associated image.json meta-data file (which contains distance) and other info
// It also looks for and processes the optional /imageName_measuremnets folder.
// within the /imageName_measurements folder, annotations i.e. imageMeasurement.json files are optional.
async function processInspectionFile(
    filename,
    imagesFolder,
    inspectionId,
    bladeId,
    doneCallback
) {
    console.log(`Name: ${filename}, value: ${imagesFolder[filename]}`);
    if (filename.endsWith(".png") || filename.endsWith(".jpg")) {
        // 360 image
        const imageFile = imagesFolder[filename];
        const imagePrefix = filename.split(".")[0];
        const metaFileName = imagePrefix + ".json";
        // search for corresponding meta-data .json file for the 360 image
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
            console.log("resp:", resp);
        } else {
            console.log("skip upload of: ", filename);
        }

        let imageId = resp["image_id"];

        // --------------------------- process measurement folder (if any) -------------------------
        const measurementsFolderName = imagePrefix + "_measurements";
        if (imageId != null && imagesFolder[measurementsFolderName] != null) {
            let measurementFolder = imagesFolder[measurementsFolderName];
            console.log(
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
                    const measurementImageFilePrefix = entryName.split(".")[0];

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
                    console.log(
                        "uploadMeasurementImageAndAnnotation resp:",
                        annotationUploadResp
                    );
                }
            }
        } else {
            console.log("No _measurements folder for: ", filename);
        }
    }
    doneCallback(filename);

};


// ================================== Main =======================================

console.log('Sync Inspection Data Script');

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


syncDir(dirPath);

