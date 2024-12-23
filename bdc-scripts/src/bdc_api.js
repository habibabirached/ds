"use strict";

const path = require("path");
const fs = require("fs");

// =================================== REST API =============================

async function uploadAnnotationMeasurementFile(BASE_URL, measurementId, annotationFile) {
    console.log(`uploadAnnotationMeasurementFile() called for measurementId: ${measurementId}, annotationFile: ${annotationFile}`);

    let data = {};
    if (annotationFile != null) {
        const formData = new FormData();
        if (annotationFile)
            formData.append('annotation_file', annotationFile);

        const requestOptions = {
            method: 'POST',
            body: formData
        }

        try {
            let res = await fetch(`${BASE_URL}/measurement/${measurementId}/annotation_file`, requestOptions);
            data = await res.json();
            console.log('Measurement Annotation upload resp:', data);

        } catch (e) {
            console.log('Error:', e);
        }
    }
    return data;
};

async function uploadAnnotationFile(BASE_URL, filename, measurementId, file, doneUploadCB) {
    console.log('uploading File: ', filename, 'using measurementId:', measurementId);

    try {
        let data = await uploadAnnotationMeasurementFile(BASE_URL, measurementId, file);
        console.log('data:', data);
    } catch (err) {
        console.log(`error uploading file ${filename}:`, filename);
    }

    doneUploadCB(filename);
};

async function createInspection(BASE_URL, body) {
    //console.log('createInspection() called with: ', body);

    let data = {};
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
        },
        body: JSON.stringify(body)
    };

    try {
        let res = await fetch(`${BASE_URL}/inspection`, requestOptions);
        data = await res.json();
        console.log('Inspection created:', data);
    } catch (e) {
        console.log('Error:', e);
    }

    return data;
};

async function getListOfImagesWithMissingFiles(BASE_URL, inspectionId) {
    console.log('getListOfImagesWithMissingFiles() called with inspectionId: ', inspectionId );
    
    let url = new URL(`${BASE_URL}/maintenance/inspection/${inspectionId}/image_list/missing_image_files`)

    let data = []
    try {
        let res = await fetch(url);
        data = await res.json();
        console.log('List of images with missing files:', data);
    } catch (e) {
        console.log('Error:', e);
    }

    return data;
};

async function getInspectionStats(BASE_URL, inspectionId) {
    console.log('getInspectionStats() called with inspectionId: ', inspectionId );
    
    let url = new URL(`${BASE_URL}/inspection/${inspectionId}/stats`)

    let data = []
    try {
        let res = await fetch(url);
        data = await res.json();
        console.log('Got Inspection stats:', data);
    } catch (e) {
        console.log('Error:', e);
    }

    return data;
};


async function getListOfImages(BASE_URL, inspectionId) {
    console.log('getListOfImages() called for inspectionId: ', inspectionId );
    
    let url = new URL(`${BASE_URL}/inspection/${inspectionId}/image/list`)

    let data = []
    try {
        let res = await fetch(url);
        data = await res.json();
        //console.log('List of inspection images:', data);
    } catch (e) {
        console.log('Error:', e);
    }

    return data;
};


async function searchInspections(BASE_URL, esn, sect=null, date=null, manufacture_stage=null) {
    console.log('searchInspections() called with: ',esn, sect, date, manufacture_stage );
    
    let url = new URL(`${BASE_URL}/inspection/search`);

    if (esn != null) url.searchParams.append('esn', esn);
    if (sect != null) url.searchParams.append('sect', sect);
    if (date != null) url.searchParams.append('date', date);
    if (manufacture_stage != null) url.searchParams.append('manufacture_stage', manufacture_stage);

    let data = []
    try {
        let res = await fetch(url);
        data = await res.json();
        console.log('Inspection list:', data);
    } catch (e) {
        console.log('Error:', e);
    }

    return data;
};

// Measurement image is the 2d snapshot, annotation is json
async function uploadMeasurementImageAndAnnotation(BASE_URL, imageId, imageFile, annotationFile) {
    //console.log('uploadMeasurementImageAndAnnotation() called for:', imageId, imageFile, annotationFile);

    let data = {};
    if (imageFile != null || annotationFile != null) {
        const formData = new FormData();
        if (imageFile) {
            let imageBlob = new Blob([fs.readFileSync(imageFile)])
            let imageFilename = imageFile.split('/').pop();
            formData.append('image_file', imageBlob, imageFilename);
        }
        if (annotationFile) {
            let annotationBlob = new Blob([fs.readFileSync(annotationFile)])
            let annotationFilename = annotationFile.split('/').pop();
            formData.append('annotation_file', annotationBlob, annotationFilename);
        }

        const requestOptions = {
            method: 'POST',
            body: formData
        }

        try {
            let res = await fetch(`${BASE_URL}/image/${imageId}/uploadMeasurementImageAndAnnotation`, requestOptions);
            data = await res.json();
            //console.log('Upload Measurement Image resp:', data);

        } catch (e) {
            console.log('Error:', e);
        }

    }

    return data;
};

// 360 image file + json meta-data
async function uploadImageFileAndMetadata(BASE_URL, inspectionId, bladeId, imageFile, metadataFile) {
    //console.log(`uploadImageFileAndMetadata() called for inspectionId: ${inspectionId}, bladeId: ${bladeId}, imageFile: ${imageFile}, metadataFile: ${metadataFile}`);

    let data = {};
    if (imageFile != null || metadataFile != null) {
        const formData = new FormData();
        if (imageFile) {
            let imageBlob = new Blob([fs.readFileSync(imageFile)])
            let imageFilename = imageFile.split('/').pop();
            //console.log('image_file:',imageFilename);
            formData.append('image_file', imageBlob, imageFilename);
        }
        if (metadataFile) {
            let metadataBlob = new Blob([fs.readFileSync(metadataFile)])
            let metadataFilename = metadataFile.split('/').pop();
            //console.log('metadata_file:',metadataFilename);
            formData.append('metadata_file', metadataBlob, metadataFilename);
        }

        const requestOptions = {
            method: 'POST',
            body: formData
        }

        try {
            let res = await fetch(`${BASE_URL}/inspection/${inspectionId}/${bladeId}/uploadImageFileAndMetadata`, requestOptions);
            //console.log('Image upload resp:', res);
            data = await res.json();
            //console.log('Image upload json resp:', data);

        } catch (e) {
            console.log('Error:', e);
        }

    }

    return data;
};


// 360 image file
async function updateImageFile(BASE_URL, imageId, imageFile) {
    console.log(`updateImageFile() called for imageId: ${imageId},  imageFile: ${imageFile}`);

    let data = {};
    if (imageFile != null ) {
        const formData = new FormData();
        if (imageFile) {
            let imageBlob = new Blob([fs.readFileSync(imageFile)])
            let imageFilename = imageFile.split('/').pop();
            //console.log('image_file:',imageFilename);
            formData.append('image_file', imageBlob, imageFilename);
        }
      
        const requestOptions = {
            method: 'POST',
            body: formData
        }

        try {
            let res = await fetch(`${BASE_URL}/image/${imageId}/file`, requestOptions);
            //console.log('Image upload resp:', res);
            data = await res.json();
            //console.log('Image upload json resp:', data);

        } catch (e) {
            console.log('Error:', e);
        }

    }

    return data;
};


/**
 * 
 * @param {*} body should contain image_id and 
 * @returns 
 */
async function createVTShot  (BASE_URL, body) {
    //console.log('createVTShot() called with: ',body);
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    }; 

    let resp = await fetch(`${BASE_URL}/vtshot`, requestOptions);
    //console.log('Create vtshot resp:', resp);
    let data = await resp.json();
    return data;
}


async function uploadImageVTShotFile (BASE_URL, vtshotId, vtshotFile) {
    //console.log(`uploadImageVTShotFile() called for vtshotId: ${vtshotId}, vtshotFile: ${vtshotFile}`);

    let data = {};
    if (vtshotFile != null) {
        const formData = new FormData();
        if (vtshotFile) {
            let imageBlob = new Blob([fs.readFileSync(vtshotFile)])
            let imageFilename = vtshotFile.split('/').pop();
            //console.log('image_file:',imageFilename);
            formData.append('image_file', imageBlob, imageFilename);
        }
        
        const requestOptions = {
            method: 'POST',
            body: formData
        }

        try {
            let res = await fetch(`${BASE_URL}/vtshot/${vtshotId}/image_file`, requestOptions);
            data = await res.json();
            //console.log('VTShot Image upload resp:', data);

        } catch (e) {
            console.log('Error:', e);
        }
    }
    return data;
}

async function getInspectionList(BASE_URL, esn=null) {
    console.log('getInspectionList() called');
    let data = [];
    let query = ''
    if (esn != null) {
        query = `?esn=${esn}`
    }
    try {
        const res = await fetch(`${BASE_URL}/inspection/list${query}`);
        data = await res.json();
        //console.log("Read Inspection list:", data);
        if (! Array.isArray(data)) {
            data = [];
        }
    } catch (e) {
        console.log('Error:', e);
    }
    return data;
}

async function compressInspectionImages(BASE_URL, inspectionId) {
    console.log('compressInspectionImages() called for inspection id:',inspectionId);
   
    let data = {}
    try {
        const res = await fetch(`${BASE_URL}/maintenance/inspection/${inspectionId}/compress_image_files`);
        data = await res.json();
    } catch (e) {
        console.log('Error:', e);
    }
    return data;
}

async function moveInspectionImagesToS3(BASE_URL, inspectionId) {
    console.log('moveInspectionImagesToS3() called for inspection id:',inspectionId);
   
    let data = {}
    try {
        const res = await fetch(`${BASE_URL}/maintenance/inspection/${inspectionId}/move_image_files_to_s3`);
        data = await res.json();
    } catch (e) {
        console.log('Error:', e);
    }
    return data;
}

// ---------------------------- Measurement ----------------------------------

async function parseMeasurementAnnotationFile(BASE_URL, measurementId) {
    console.log('parseMeasurementAnnotationFile() called for measurement id:',measurementId);
   
    let data = []
    try {
        const res = await fetch(`${BASE_URL}/measurement/${measurementId}/annotation_file/parse_defects`);
        data = await res.json();
    } catch (e) {
        console.log('Error:', e);
    }
    return data;
}

async function getInspectionMeasurementList(BASE_URL, inspectionId) {
    console.log('getInspectionMeasurements() called for inspection id:',inspectionId);
   
    let data = []
    try {
        const res = await fetch(`${BASE_URL}/inspection/${inspectionId}/measurement/list`);
        data = await res.json();
    } catch (e) {
        console.log('Error:', e);
    }
    return data;
}


// ------------------------------------------- Logs ----------------------------------------------------
async function getInspectionLogs(BASE_URL) {
    console.log('getInspectionLogs() called.');
    let data = {};
    try {
        const res = await fetch(`${BASE_URL}/logs`);
        data = await res.json();
        console.log("Read Logs:", data);
    } catch (e) {
        console.log('Error:', e);
    }
    return data;
}


async function createInspectionLogEntry(BASE_URL, body) {
    console.log('createInspectionLogEntry() called with: ',body); 
    let data = {};

    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    }; 
    try {
        let res = await fetch(`${BASE_URL}/logs`,requestOptions);
        data = await res.json();
        console.log('create log entry resp:', data);
    } catch(e) {
        console.log('Error:',e);
    }
    return data;
}


// use this to create a log entry, then modify it with your data
function getInspectionLogBodyObj(inspectionId = -1, 
                                inputPath='', 
                                message='', 
                                operation='', 
                                status='', 
                                sso='unknown') {

    return {
        "date": new Date().toISOString(),
        "input_path": inputPath,
        "inspection_id": inspectionId,
        "message": message,
        "operation": operation,
        "sso": sso,
        "status": status
    };
}


module.exports = {
    uploadImageFileAndMetadata,
    uploadMeasurementImageAndAnnotation,
    searchInspection: searchInspections,
    createInspection,
    uploadAnnotationFile,
    uploadAnnotationMeasurementFile,
    getListOfImagesWithMissingFiles,
    updateImageFile,
    createVTShot,
    uploadImageVTShotFile,
    getInspectionList,
    compressInspectionImages,
    moveInspectionImagesToS3,
    getListOfImages,
    getInspectionLogs,
    createInspectionLogEntry,
    getInspectionLogBodyObj,
    getInspectionStats,
    parseMeasurementAnnotationFile,
    getInspectionMeasurementList
};


// =================================== END REST API ====================================
