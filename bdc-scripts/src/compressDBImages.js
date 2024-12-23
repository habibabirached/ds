"use strict";

const { compressInspectionImages, getInspectionList } = require('./bdc_api');
const Bottleneck = require("bottleneck");

// Depending on how fast the server is, one may want to increase or decrease this number.
const NUMBER_PARALLEL_TASKS = 2;
const compressInspectionFilesLimiter = new Bottleneck({
    maxConcurrent: NUMBER_PARALLEL_TASKS,
});

async function callCompressInspectionImages(BASE_URL, inspectionId, doneCB) {
    let resp = await compressInspectionImages(BASE_URL, inspectionId);
    doneCB(inspectionId, resp);
}

async function compressAllInspections() {
    let inspectionList = await getInspectionList(BASE_URL);
    console.log(`Will compress images in ${inspectionList.length} inspections...`);
    let total = inspectionList.length;
    let idx = 0;

    let percent = 0;
    let processed = 0;
    const doneUploadCB = (inspectionId, resp) => {
        processed ++;
        console.log(`inspection id# ${inspectionId} response:`,resp);
        percent =  Math.round( (processed / total) * 100);
        console.log(`progress: ${percent}%` );
    }; 

    let callList = [];
    for (let inspection of inspectionList) {
        callList.push(compressInspectionFilesLimiter.schedule(() => 
            callCompressInspectionImages(BASE_URL, inspection.id, doneUploadCB))
            .then((resp) => {})
            .catch((err) => {console.log('err:',err)})
            .finally(() => {})
        );
    }
    // wait until all is done
    await Promise.all(callList);
}


// ================================== Main =======================================

console.log('Compress DB Images Script');

const nodeCmd = process.argv[0]
const appName = process.argv[1]
const hostname = process.argv[2]


const BASE_URL = `http://${hostname}:8090/api`;
const ANNOTATION_FILE_PATTERN = /\w+-\w+-\w+_mid\d+.json/g;

if (process.argv.length < 3) {
    console.error('Expecting at least 1 parameter.');
    console.log.apply('Usage: node ./src/app.js hostname');
    process.exit(1);
}

if (hostname == null) {
    console.log('missing hostname');
    process.exit(1);
}

compressAllInspections()
