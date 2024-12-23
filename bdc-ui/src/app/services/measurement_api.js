import { BASE_URL } from "./api_config";
import { fetchAndDeleteFile, waitForResponse } from "./async_utils";


export const emptyMeasurement = {
  area: 0.0,
  aspect_ratio: 0.0,
  chord_wise_width: 0.0,
  component: "",
  date: null,
  depth: 0.0,
  description: "",
  design_tolerance: "",
  disposition_provided_by: "",
  dnv_response: "",
  edge_distance: 0,
  finding_category: "",
  finding_code: "",
  finding_reference: "",
  finding_type: "Other",
  ge_disposition: "",
  ge_disposition_response: "",
  height: 0.0,
  image_hfov: 0,
  image_id: -1,
  image_pitch: 0.0,
  image_yaw: 0.0,
  is_manual: true,
  sso: "",
  is_priority: false,
  le_distance: 0.0,
  length: 0.0,
  location: "cw",
  percent_area: 0.0,
  position_in_blade: "",
  reference: "",
  repair_approved_by: "",
  repair_date: null,
  repair_report_id: "",
  root_face_distance: 0.0,
  span_wise_length: 0.0,
  status: "Open",
  submission_code: "",
  te_distance: 0.0,
  width: 0.0,
};


export const updateMeasurement = async (id, body) => {
  console.log("updateMeasurement() called with: ", id, body);
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };

  let resp = await fetch(
    `${BASE_URL}/measurement/${id}/update`,
    requestOptions
  );
  console.log("Update measurement resp:", resp);

  return resp;
};

/**
 *
 * @param {*} body should contain image_id and
 * @returns
 */
export const createMeasurement = async (body) => {
  console.log("createMeasurement() called with: ", body);
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };

  let resp = await fetch(`${BASE_URL}/measurement`, requestOptions);
  console.log("Create measurement resp:", resp);
  let data = await resp.json();
  return data;
};

export const getDefectSeverity = async () => {
  console.log("getDefectSeverity() called.");

  let resp = await fetch(`${BASE_URL}/defect_severity`);
  console.log("Get defect_severity resp:", resp);
  let data = await resp.json();
  return data;
};

export const getMeasurement = async (id) => {
  console.log("getMeasurement() called.");

  let resp = await fetch(`${BASE_URL}/measurement/${id}`);
  console.log("Get measurement resp:", resp);
  let data = await resp.json();
  return data;
};

export const getMeasurementDefectList = async (id) => {
  console.log("getMeasurementDefectList() called.");

  let resp = await fetch(`${BASE_URL}/measurement/${id}/defect_list`);
  console.log("Get measurement resp:", resp);
  let data = await resp.json();
  return data;
};


export const searchMeasurementList = async (
  esn = null,
  bladeSection = null,
  rootFaceDistance = null,
  validationStatus = null
) => {
  console.log("searchMeasurementList() called.");

  let query = "";
  if (esn != null) {
    query += `esn=${esn}`;
  }
  if (bladeSection != null) {
    if (query.length > 0) query += "&";
    query += `blade_section=${bladeSection}`;
  }
  if (rootFaceDistance != null) {
    if (query.length > 0) query += "&";
    query += `root_face_distance=${rootFaceDistance}`;
  }
  if (validationStatus != null) {
    if (query.length > 0) query += "&";
    query += `validation_status=${validationStatus}`;
  }

  let url = `${BASE_URL}/measurement/search`;
  if (query.length > 0) url = url + "?" + query;
  console.log("refz_url = ", url);
  let resp = await fetch(url);
  console.log("Get measurement/search resp:", resp);
  let data = await resp.json();
  return data;
};

// returns the json content of the annotation file or null
export const getMeasurementAnnotationFile = async (id) => {
  console.log("getMeasurementAnnotationFile() called.");

  let resp = await fetch(`${BASE_URL}/measurement/${id}/annotation_file`);
  console.log("Get measurement annotation file resp:", resp);
  let data = {};
  try {
    data = await resp.json();
  } catch (e) {
    console.log("Error parsing json: ", e);
  }
  return data;
};


export const getComputeMeasurementsForMeasurementAnnotationFile = async (id) => {
  console.log("getComputeMeasurementsForMeasurementAnnotationFile() called.");

  let resp = await fetch(`${BASE_URL}/measurement/${id}/annotation_file/compute_measurements`);
  console.log("Get measurement new annotation file resp:", resp);
  let data = {};
  try {
    data = await resp.json();
  } catch (e) {
    console.log("Error parsing json: ", e);
  }
  return data;
};


// ---------------------------- Validated annotation file -------------------

// returns the json content of the annotation file or null
export const getMeasurementValidatedAnnotationFile = async (id) => {
  console.log("getMeasurementValidatedAnnotationFile() called.");

  let resp = await fetch(
    `${BASE_URL}/measurement/${id}/validated_annotation_file`
  );
  console.log("Get measurement validated annotation file resp:", resp);

  let data = {};
  try {
    data = await resp.json();
  } catch (e) {
    console.log("Error parsing json: ", e);
  }
  return data;
};

export const getMeasurementValidatedAnnotationFileMetadata = async (id) => {
  console.log("getMeasurementValidatedAnnotationFileMetadata() called.");

  let resp = await fetch(
    `${BASE_URL}/measurement/${id}/validated_annotation_file_metadata`
  );
  console.log("Get measurement validated annotation file meta resp:", resp);
  let data = await resp.json();
  return data;
};

// ------------------------------ Original annotation file ---------------------

// returns the json content of the annotation file or null
export const getMeasurementOriginalAnnotationFile = async (id) => {
  console.log("getMeasurementOriginalAnnotationFile() called.");

  let resp = await fetch(
    `${BASE_URL}/measurement/${id}/original_annotation_file`
  );
  console.log("Get measurement original annotation file resp:", resp);

  let data = {};
  try {
    data = await resp.json();
  } catch (e) {
    console.log("Error parsing json: ", e);
  }
  return data;
};

export const getMeasurementOriginalAnnotationFileMetadata = async (id) => {
  console.log("getMeasurementOriginalAnnotationFileMetadata() called.");

  let resp = await fetch(
    `${BASE_URL}/measurement/${id}/original_annotation_file_metadata`
  );
  console.log("Get measurement original annotation file meta resp:", resp);
  let data = await resp.json();
  return data;
};


export const deleteMeasurement = async (id) => {
  console.log("refz_delete deleteMeasurement() called.");

  const requestOptions = {
    method: "DELETE",
  };

  let resp = await fetch(`${BASE_URL}/measurement/${id}`, requestOptions);
  console.log("refz_delete Delete measurement resp:", resp);
  //   let data = await resp.json(); // commented by H because data is not used
  return resp;
};

export const deleteMeasurementAnnotationFile = async (id) => {
  console.log("deleteMeasurementAnnotationFile() called.");

  const requestOptions = {
    method: "DELETE",
  };

  let resp = await fetch(
    `${BASE_URL}/measurement/${id}/annotation_file`,
    requestOptions
  );
  console.log("Delete measurement annotation file resp:", resp);
  let data = await resp.json();
  return data;
};

export const deleteMeasurementValidatedAnnotationFile = async (id) => {
  console.log("deleteMeasurementValidatedAnnotationFile() called.");

  const requestOptions = {
    method: "DELETE",
  };

  let resp = await fetch(
    `${BASE_URL}/measurement/${id}/validated_annotation_file`,
    requestOptions
  );
  console.log("Delete measurement validated annotation file resp:", resp);
  let data = await resp.json();
  return data;
};

export const deleteMeasurementOriginalAnnotationFile = async (id) => {
  console.log("deleteMeasurementOriginalAnnotationFile() called.");

  const requestOptions = {
    method: "DELETE",
  };

  let resp = await fetch(
    `${BASE_URL}/measurement/${id}/original_annotation_file`,
    requestOptions
  );
  console.log("Delete measurement original annotation file resp:", resp);
  let data = await resp.json();
  return data;
};

export const uploadImageMeasurementFile = async (
  measurementId,
  measurementFile
) => {
  console.log(
    `uploadImageMeasurementFile() called for measurementId: ${measurementId}, measurementFile: ${measurementFile}`
  );

  let data = {};
  if (measurementFile != null) {
    const formData = new FormData();
    if (measurementFile) formData.append("image_file", measurementFile);

    const requestOptions = {
      method: "POST",
      body: formData,
    };

    try {
      let res = await fetch(
        `${BASE_URL}/measurement/${measurementId}/image_file`,
        requestOptions
      );
      data = await res.json();
      console.log("Measurement Image upload resp:", data);
    } catch (e) {
      console.log("Error:", e);
    }
  }
  return data;
};

// annotationFile should be JSON.stringify(jsonObject) or a File
export const uploadAnnotationMeasurementFile = async (
  measurementId,
  annotationFile
) => {
  console.log(
    `uploadAnnotationMeasurementFile() called for measurementId: ${measurementId}, annotationFile: ${annotationFile}`
  );

  let data = {};
  if (annotationFile != null) {
    const formData = new FormData();
    if (annotationFile) formData.append("annotation_file", annotationFile);

    const requestOptions = {
      method: "POST",
      body: formData,
    };

    try {
      let res = await fetch(
        `${BASE_URL}/measurement/${measurementId}/annotation_file`,
        requestOptions
      );
      data = await res.json();
      console.log("Measurement Annotation upload resp:", data);
    } catch (e) {
      console.log("Error:", e);
    }
  }
  return data;
};

// create or update
// annotationFile should be JSON.stringify(jsonObject)
export const uploadValidatedAnnotationMeasurementFile = async (
  measurementId,
  validationStatus,
  validatedBy,
  validationTimestamp,
  annotationFile
) => {
  console.log(`uploadValidatedAnnotationMeasurementFile() called with: 
                 measurementId: ${measurementId},
                 validationStatus: ${validationStatus}, 
                 validatedBy: ${validatedBy}, validationTimestamp: ${validationTimestamp}
                 annotationFile: ${annotationFile}`);

  let data = {};
  if (annotationFile != null) {
    const formData = new FormData();
    if (validationStatus)
      formData.append("validation_status", validationStatus);
    if (validatedBy) formData.append("validated_by", validatedBy);
    if (validationTimestamp)
      formData.append("validation_timestamp", validationTimestamp);
    if (annotationFile) formData.append("annotation_file", annotationFile);

    const requestOptions = {
      method: "POST",
      body: formData,
    };

    try {
      let res = await fetch(
        `${BASE_URL}/measurement/${measurementId}/validated_annotation_file`,
        requestOptions
      );
      data = await res.json();
      console.log("Validated Measurement Annotation upload resp:", data);
    } catch (e) {
      console.log("Error:", e);
    }
  }
  return data;
};

// Create or update
// annotationFile should be JSON.stringify(jsonObject) or a File
export const uploadOriginalAnnotationMeasurementFile = async (
  measurementId,
  replacedBy,
  replacedTimestamp,
  annotationFile
) => {
  console.log(`uploadOriginalAnnotationMeasurementFile() called with: 
                 measurementId: ${measurementId},
                 replacedBy: ${replacedBy}, replacedTimestamp: ${replacedTimestamp}
                 annotationFile: ${annotationFile}`);

  let data = {};
  if (annotationFile != null) {
    const formData = new FormData();
  
    if (replacedBy) formData.append("replaced_by", replacedBy);
    if (replacedTimestamp)
      formData.append("replaced_timestamp", replacedTimestamp);
    if (annotationFile) formData.append("annotation_file", annotationFile);

    const requestOptions = {
      method: "POST",
      body: formData,
    };

    try {
      let res = await fetch(
        `${BASE_URL}/measurement/${measurementId}/original_annotation_file`,
        requestOptions
      );
      data = await res.json();
      console.log("Original Measurement Annotation upload resp:", data);
    } catch (e) {
      console.log("Error:", e);
    }
  }
  return data;
};


export const downloadValidatedMeasurementFilesAndAnnotations = async (
  idList
) => {
  console.log(
    `downloadValidatedMeasurementFilesAndAnnotations() called with idList: ${idList}`
  );

  if (idList != null && idList.length > 0) {
    let body = { id_list: idList };
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    };

    try {
      let res = await fetch(
        `${BASE_URL}/measurement/validated_annotation_list/zip`,
        requestOptions
      );

      if (res != null) {
        const newBlob = new Blob([await res.blob()], {
          type: "application/x-zip",
        });
        const objUrl = window.URL.createObjectURL(newBlob);
        let link = document.createElement("a");
        link.href = objUrl;
        link.download = "validated_measurement_files_and_annotations.zip";
        link.click();
      }
    } catch (e) {
      console.log("Error:", e);
    }
  } else {
    alert("Nothing to do. Current list of validated annotations is empty.");
  }
};


export const downloadValidatedMeasurementFilesAndAnnotationsAsync = async (
  idList
) => {
  console.log(
    `downloadValidatedMeasurementFilesAndAnnotationsAsync() called with idList: ${idList}`
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
        `${BASE_URL}/measurement/validated_annotation_list/zip`,
        requestOptions
      );

      if (task_resp != null) {
        const task = await task_resp.json();
        if (task.id != null) {
          const taskId = task.id;
          await waitForResponse(taskId);
          const filename =  "validated_measurement_files_and_annotations.zip";
          fetchAndDeleteFile(taskId, filename);
        } else {
          alert("Error downloading file:"+JSON.stringify(task)); 
        }
      }
    } catch (e) {
      console.log("Error:", e);
    }
  } else {
    alert("Nothing to do. Current list of validated annotations is empty.");
  }
};
