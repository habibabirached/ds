import { BASE_URL } from './api_config';
import { fetchAndDeleteFile, waitForResponse } from "./async_utils";

export const updateImage = async (id, body) => {
    console.log('updateImage() called with: ', id, body);
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    };

    let imageResp = await fetch(`/api/image/${id}`, requestOptions);
    let data = await imageResp.json();
    console.log('Update image resp:', data);

    return data;
}


export const getImage = async (id) => {
    console.log('getImage() called with: ', id);

    let imageResp = await fetch(`/api/image/${id}`);
    console.log('Got image resp:', imageResp);
    let data = await imageResp.json();
    
    return data;
}

export const searchImageList = async (
    esn = null, min_distance = null, max_distance = null
  ) => {
    console.log("searchDefectList() called.");
  
    let query = "";
    if (esn != null) {
      query += `esn=${esn}`;
    }
    if (min_distance != null) {
        if (query.length > 0) query += '&'
        query += `min_distance=${min_distance}`
    }
    if (max_distance != null) {
        if (query.length > 0) query += '&'
        query += `max_distance=${max_distance}`
    }
  
    let url = `${BASE_URL}/image/search`;
    if (query.length > 0) url = url + "?" + query;
    let resp = await fetch(url);
    console.log("Get image/search resp:", resp);
    let data = await resp.json();
    return data;
}
  

export const getMeasurementListForImage = async (image_id) => {
    console.log('getMeasurementListForImage() called with image_id: ', image_id);

    let resp = await fetch(`/api/image/${image_id}/measurement/list`);
    console.log('Got measurement list for image resp:', resp);
    let data = await resp.json();

    return data;
}

export const downloadSelectedImageFilesAsync = async (
    idList
  ) => {
    console.log(
      `downloadSelectedImageFilesAsync() called with idList: ${idList}`
    );
  
    if (idList != null && idList.length > 0) {
      let body = { id_list: idList, is_async:true };
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      };
  
      try {
        let task_resp = await fetch(
          `${BASE_URL}/image/selected_list/zip`,
          requestOptions
        );
  
        if (task_resp != null) {
          const task = await task_resp.json();
          if (task.id != null) {
            const taskId = task.id;
            await waitForResponse(taskId);
            const filename =  "selected_image_files.zip";
            fetchAndDeleteFile(taskId, filename);
          } else {
            alert("Error downloading file:"+JSON.stringify(task)); 
          }
        }
      } catch (e) {
        console.log("Error:", e);
      }
    } else {
      alert("Nothing to do. Current list of selected image files is empty.");
    }
  };


export const getVTShotListForImage = async (image_id) => {
    console.log('getVTShotListForImage() called with image_id: ', image_id);

    let resp = await fetch(`/api/image/${image_id}/vtshot/list`);
    console.log('Got vtshot list for image resp:', resp);
    let data = await resp.json();

    return data;
}

// Note: this REST API will mark the annotation as AI generated.
export const uploadMeasurementImageAndAnnotation = async (imageId, imageFile, annotationFile) => {
    console.log('uploadMeasurementImageAndAnnotation() called for:', imageId, imageFile, annotationFile);

    let data = {};
    if (imageFile != null || annotationFile != null) {
        const formData = new FormData();
        if (imageFile)
            formData.append('image_file', imageFile);
        if (annotationFile)
            formData.append('annotation_file', annotationFile);

        const requestOptions = {
            method: 'POST',
            body: formData
        }

        try {
            let res = await fetch(`${BASE_URL}/image/${imageId}/uploadMeasurementImageAndAnnotation`, requestOptions);
            data = await res.json();
            console.log('Measurement Image upload resp:', data);

        } catch (e) {
            console.log('Error:', e);
        }

    }

    return data;
}

