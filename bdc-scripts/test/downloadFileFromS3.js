"use strict";

let fs = require('fs');
let path = require('path');


async function getAccessToken() {
    let access_token = null;

    const url_auth = "https://apis-dev.rendigital.apps.ge.com/auth/realms/RENDS/protocol/openid-connect/token";
    
    let json_payload_auth = {
        client_id: "digital-blade-cert-client",
        client_secret: "1d01683d-d71a-4e7e-b027-6fb9634db3c3",
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

async function downloadFile(url, path) {
    const res = await fetch(url);
    const fileStream = fs.createWriteStream(path);
    await new Promise((resolve, reject) => {
        if (res != null && res.body != null) {
            res.body.pipe(fileStream);
            res.body.on("error", reject);
            fileStream.on("finish", resolve);
        } else {
            console.log('Error. Could not read response.')
        }
      });
  }

async function saveResponseToFile(res, path) {
  const fileStream = fs.createWriteStream(path);
  await new Promise((resolve, reject) => {
      if (res != null && res.body != null) {
          res.body.pipe(fileStream);
          res.body.on("error", reject);
          fileStream.on("finish", resolve);
      } else {
          console.log('Error. Could not read response.')
      }
    });


async function downloadFile(url_presigned, filePath) {
    let presigned_url = null;

    const headers_presigned = {
        "x-amz-server-side-encryption": "aws:kms",
        "x-amz-server-side-encryption-aws-kms-key-id": "9b480dc5-573b-43cc-bc74-18f63f1fda60",
        //"Content-Type": "image/png"
    };

    const requestOptions = {
        method: "GET",
        headers: headers_presigned,
    };
    
    try {
        const response_download = await fetch(url_presigned, requestOptions);
        console.log('status:',response_download.status);
        await saveResponseToFile(response_download, filePath)
        return response_download;
       
    } catch (err) {
        console.log("Error downloading file using presigned url:", err);
    }
    return null;
}


async function main(s3key, destinationPath) {
    console.log(`s3key: ${s3key}`);
    console.log(`destinationPath: ${destinationPath}`);
    
    let token = await getAccessToken();
    console.log("Got access token:", token);

    let ticket = await getTicket(token);
    console.log("Got access ticket:", ticket);

    // the name to be shown within s3 bucket they set up for us. May include path
    let filename = s3key.split('/').pop()
    
    if (destinationPath == null) {
        destinationPath = filename;
    }
    console.log('using destination file path:',destinationPath);

    let presignedUrl = await getPresignedUrl(ticket, s3key);
    console.log("Got presigned url:", presignedUrl);
    
    console.log('Downloading file to:',destinationPath);
    let resp = await downloadFile(presignedUrl, destinationPath);
    console.log('resp.status:', resp.status);
    if (resp.status == 200) {
        console.log('file: ',s3key,'Successfully uploaded.')
    }
    
}

// -------------------------------- main ----------------------------------------------

console.log('Download File From S3 Script');

const nodeCmd = process.argv[0]
const appName = process.argv[1]
const s3key = process.argv[2]
let destinationPath = process.argv[3] || null

// the first argument is 'node', the second is the command. total length should be 3
if (process.argv.length < 3) {
    console.error('Expecting at least the  path as parameter.');
    console.log.apply('Usage: node ./src/downloadFileFromS3.js s3key [destinationPath]');
    console.log.apply('Example:');
    console.log.apply('node ./src/downloadFileFromS3.js /a/b/c/sourceFile.png ./destinationFile.png');
    process.exit(1);
}


if (s3key == null) {
    console.log('missing filePath');
    process.exit(1);
}

if (destinationPath == null) {
    destinationPath = './'+s3key.split('/').pop();
}


main(s3key, destinationPath);
