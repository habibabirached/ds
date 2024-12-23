import { BASE_URL } from './api_config';


export const emptyVTShot = {
    
    "image_id": -1,

    "date": null,
    "image_hfov": 0.0,
    "image_pitch": 0.0,
    "image_yaw": 0.0,
    
    "root_face_distance": 0.0,
  }


/**
 * 
 * @param {*} body should contain image_id and 
 * @returns 
 */
export const createVTShot = async (body) => {
    console.log('createVTShot() called with: ',body);
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    }; 

    let resp = await fetch(`${BASE_URL}/vtshot`, requestOptions);
    console.log('Create vtshot resp:', resp);
    let data = await resp.json();
    return data;
}


export const getVTShot = async (id) => {
    console.log('getVTShot() called.');
    
    let resp = await fetch(`${BASE_URL}/vtshot/${id}`);
    console.log('Get vtshot resp:', resp);
    let data = await resp.json();
    return data;
}


export const deleteVTShot = async (id) => {
    console.log('deleteVTShot() called.');
    
    const requestOptions = {
        method: 'DELETE'
    }

    let resp = await fetch(`${BASE_URL}/vtshot/${id}`, requestOptions);
    console.log('Delete vtshot resp:', resp);
    let data = await resp.json();
    return data;
}


export const uploadImageVTShotFile = async (vtshotId, vtshotFile) => {
    console.log(`uploadImageVTShotFile() called for vtshotId: ${vtshotId}, vtshotFile: ${vtshotFile}`);

    let data = {};
    if (vtshotFile != null) {
        const formData = new FormData();
        if (vtshotFile)
            formData.append('image_file', vtshotFile);
        
        const requestOptions = {
            method: 'POST',
            body: formData
        }

        try {
            let res = await fetch(`${BASE_URL}/vtshot/${vtshotId}/image_file`, requestOptions);
            data = await res.json();
            console.log('VTShot Image upload resp:', data);

        } catch (e) {
            console.log('Error:', e);
        }
    }
    return data;
}



