"use strict";

const fs = require('fs');
const path = require('path');

const CREDENTIALS_TPI = require('../credentials_tpi.json');
const CREDENTIALS_LM = require('../credentials_tpi.json');


// shared by both lm and tpi
const KMS_KEY_ID = "9b480dc5-573b-43cc-bc74-18f63f1fda60";

async function getAccessToken(credentials) {
    let access_token = null;

    const url_auth = "https://apis-dev.rendigital.apps.ge.com/auth/realms/RENDS/protocol/openid-connect/token";
    
    let json_payload_auth = {
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
        grant_type: "client_credentials",
        scope: "profile"  
    };

    const headers_auth = {
        "Content-Type": "application/x-www-form-urlencoded",
    };

    const requestOptions = {
        method: "POST",
        headers: headers_auth,
        body: new URLSearchParams(json_payload_auth)
    };

    try {
        const response_auth = await fetch(url_auth, requestOptions);
        const data = await response_auth.json();
        console.log("resp:",data);
        access_token = data["access_token"];
    } catch (err) {
        console.log("Error when getting access token:", err);
    }
    return access_token;
}

async function getTicket(access_token) {
    let ticket = null;

    const url_ticket = "https://apis-dev.rendigital.apps.ge.com/auth/realms/RENDS/protocol/openid-connect/token"
    const payload_ticket = {
        grant_type: "urn:ietf:params:oauth:grant-type:uma-ticket",
        audience: "digital-blade-cert-client"
    }
    const headers_ticket = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Bearer " + access_token
    }

    const requestOptions = {
        method: "POST",
        headers: headers_ticket,
        body: new URLSearchParams(payload_ticket)
    };

    try {
        const response_auth = await fetch(url_ticket, requestOptions);
        const data = await response_auth.json();
        console.log("resp:",data);
        ticket = data["access_token"];
    } catch (err) {
        console.log("Error when getting ticket:", err);
    }
    return ticket;
}

async function getPresignedUrl(ticket, file_name) {
    let presigned_url = null;

    const url_presigned = "https://apis-dev.rendigital.apps.ge.com/bdc/v1/presignedurl"
    const headers_presigned = {
        "Authorization": ticket,
        "fileName": file_name
    }
    const requestOptions = {
        method: "GET",
        headers: headers_presigned
    };

    try {
        const response_auth = await fetch(url_presigned, requestOptions);
        const data = await response_auth.text();
        console.log("resp:",data);
        presigned_url = data.split('"').join('');
    } catch (err) {
        console.log("Error when getting presigned url:", err);
    }
    return presigned_url;
}

async function uploadFile(url_presigned, filePath) {
    let presigned_url = null;

    const headers_presigned = {
        "x-amz-server-side-encryption": "aws:kms",
        "x-amz-server-side-encryption-aws-kms-key-id": KMS_KEY_ID,
        "Content-Type": "image/png"
    };

    let fileContent = fs.readFileSync(filePath,{ encoding: 'utf8' });
    let fileName = filePath.split('/').pop();
    const requestOptions = {
        method: "PUT",
        headers: headers_presigned,
        body: new File([fileContent], fileName)
    };

    
    try {
        const response_upload = await fetch(url_presigned, requestOptions);
        console.log('status:',response_upload.status);
        return response_upload;
       
    } catch (err) {
        console.log("Error uploading file using presigned url:", err);
    }
    return null;
}

// main workflow - use credentials to get a token; use token go generate presigned url and upload file
async function main(sourceFilePath, destinationPath, credentials) {
    console.log('using credentials: ',credentials);
    let token = await getAccessToken(credentials);
    if (token == null) {
        error('Could not retrieve access token.');
    }
    console.log("Got access token:", token);

    let ticket = await getTicket(token);
    if (ticket == null) {
        error('Could not retrieve ticket.');
    }
    console.log("Got access ticket:", ticket);

    // default name to be shown within s3 bucket they set up for us. May include path
    let filePathS3 = sourceFilePath.split('/').pop()
    if (destinationPath != null) {
        filePathS3 = destinationPath;
    }
    console.log('Destination file path:',filePathS3);

    let presignedUrl = await getPresignedUrl(ticket, filePathS3);
    if (presignedUrl == null) {
        error('Could not retrieve presigned url.');
    }
    console.log("Got presigned url:", presignedUrl);
    
    console.log('Uploading file...')
    let resp = await uploadFile(presignedUrl, sourceFilePath);
    if (resp != null) {
        console.log('resp.status:', resp.status);
        if (resp.status == 200) {
            console.log('file: ',sourceFilePath,'Successfully uploaded.')
        }
    } else {
        error('Error uploading file. Null response.');
    }
    
}

function error(message) {
    console.log(`Error: ${message}`);
    process.exit(1)
}

// -------------------------------- main ----------------------------------------------

console.log('Upload File to S3 Script');

const nodeCmd = process.argv[0];
const appName = process.argv[1];
const business = process.argv[2] || 'TPI';
const filePath = process.argv[3];
const destinationPath = process.argv[4] || null;

// the first argument is 'node', the second is the command. total length should be 3
if (process.argv.length < 4) {
    console.error('Expecting at least a business name and file path as parameter.');
    console.log.apply('Usage: node ./src/uploadFileToS3.js [TPI|LM] filePath [destinationPath]');
    console.log.apply('Example:');
    console.log.apply('node ./src/uploadFileToS3.js TPI ./sourceFile.png /a/b/c/sourceFile_copy.png');
    process.exit(1);
}


if (filePath == null) {
    error('missing filePath');
}

if (business.toLocaleLowerCase() !== 'tpi' && business.toLocaleLowerCase() !== 'lm') {
    error('business name should be either TPI or LM');
} 
console.log('business:',business);
let credentials = CREDENTIALS_TPI; // default
if (business.toLocaleLowerCase() === 'tpi') {
    credentials = CREDENTIALS_TPI;
} else if (business.toLocaleLowerCase() === 'lm') {
    credentials = CREDENTIALS_LM;
}

main(filePath, destinationPath, credentials);
//process.exit(0);
