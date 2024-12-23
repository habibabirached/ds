"use strict";

const { searchInspection } = require('./bdc_api');
const fs = require("fs");
const { mkdir } = require("fs/promises");
const { Readable } = require('stream');
const { finished } = require('stream/promises');
const path = require("path");

async function downloadInspectionFiles(BASE_URL, esn, snapshotsOnly=false, snapshotsAnd360Only=true) {
    let inspectionList = await searchInspection(BASE_URL, esn);
    console.log('Found',inspectionList.length,'inspections for:',esn);
    console.log(`download options: snapshotsOnly=${snapshotsOnly} snapshotsAnd360Only=${snapshotsAnd360Only}`);
    
    for (let inspection of inspectionList) {
        let fileName = inspection.esn+'_'+inspection.sect+'_'+inspection.id+'.zip';
        let url = new URL(`${BASE_URL}/inspection/${inspection.id}/zip?snapshotsOnly=${snapshotsOnly}&snapshotsAnd360Only=${snapshotsAnd360Only}`)

        const res = await fetch(url);
        if (!fs.existsSync(esn)) await mkdir(esn); //Optional if you already have downloads directory
        const destination = path.resolve(`./${esn}`, fileName);
        const fileStream = fs.createWriteStream(destination, { flags: 'wx' });
        console.log('downloading inspection id#',inspection.id,'to:',destination);
        await finished(Readable.fromWeb(res.body).pipe(fileStream));
    }
}

// ================================== Main =======================================

console.log('Download Inspection Data Script');

const nodeCmd = process.argv[0] // node
const appName = process.argv[1] // this app
const hostname = process.argv[2]
const esn = process.argv[3]

const BASE_URL = `http://${hostname}:8090/api`;
const ANNOTATION_FILE_PATTERN = /\w+-\w+-\w+_mid\d+.json/g;

if (process.argv.length < 4) {
    console.error('Expecting at least 2 parameters.');
    console.log.apply('Usage: node ./src/donwloadInspectionData.js hostname esn [snapshotsOnly | snapshotsAnd360Only]');
    process.exit(1);
}

if (hostname == null) {
    console.log('missing hostname');
    process.exit(1);
}

if (esn == null) {
    console.log('missing esn');
    process.exit(1);
}

let snapshotsOnly = false;
let snapshotsAnd360Only = false;

let argumentString = process.argv.join(' ');
if (argumentString.includes('snapshotsOnly')) snapshotsOnly = true;
if (argumentString.includes('snapshotsAnd360Only')) snapshotsAnd360Only = true;

downloadInspectionFiles(BASE_URL, esn, snapshotsOnly, snapshotsAnd360Only);