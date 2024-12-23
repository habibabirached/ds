"use strict";

const { moveInspectionImagesToS3, getInspectionList, getInspectionMeasurementList, parseMeasurementAnnotationFile } = require('./bdc_api');
const Bottleneck = require("bottleneck");

// Depending on how fast the server is, one may want to increase or decrease this number.
const NUMBER_PARALLEL_TASKS = 2;
const moveInspectionFilesLimiter = new Bottleneck({
    maxConcurrent: NUMBER_PARALLEL_TASKS,
});

async function callParseInspectionMeasurements(BASE_URL, inspectionId, doneCB) {
    let measurement_list = await getInspectionMeasurementList(BASE_URL, inspectionId);
    let idList = []
    if (Array.isArray(measurement_list)) {
        for (let measurement of measurement_list) {
            let defectList = await parseMeasurementAnnotationFile(BASE_URL, measurement.id);
            //console.log('parse measurement resp:',defectList);
            
            if (Array.isArray(defectList)) {
                console.log(`parsed ${defectList.length} defects`);
                for (let defect of defectList) {
                    if (defect.id != null) idList.push(defect.id);
                }
            }   
        }
    }
    let resp = {'parsedMeasurementDefectIdList': idList}
    doneCB(inspectionId, resp);
}

async function parseAllInspections() {
    let inspectionList = await getInspectionList(BASE_URL);
    console.log(`Will parse measurements from ${inspectionList.length} inspections...`);
    let total = inspectionList.length;
    let idx = 0;

    let percent = 0;
    let processed = 0;
    const doneUploadCB = (inspectionId, resp) => {
        processed += 1;
        console.log(`parsed measurements for inspection id# ${inspectionId} response:`,resp);
        percent =  Math.round( (processed / total) * 100);
        console.log(`progress: ${percent}%` );
    }; 

    let callList = [];
    for (let inspection of inspectionList) {
        callList.push(moveInspectionFilesLimiter.schedule(() => 
            callParseInspectionMeasurements(BASE_URL, inspection.id, doneUploadCB))
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
    console.log.apply('Usage: node ./src/parseDBMeasurements.js hostname');
    process.exit(1);
}

if (hostname == null) {
    console.log('missing hostname');
    process.exit(1);
}

parseAllInspections()
