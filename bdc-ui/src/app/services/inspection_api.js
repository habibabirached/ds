import { BASE_URL } from "./api_config";
import { fetchAndDeleteFile, getTextFileContent, waitForResponse } from "./async_utils";

// ----------------------------------- Async/poll API ---------------------------------------------

// large data sets take longer than 30min to prepare and download. This method uses async calls to
// wait for the data to be ready, then it downloads it.
export const downloadInspectionDataAsync = async (
  inspection,
  snapshotsOnly = false,
  snapshotsAnd360 = false
) => {
  const esn = inspection.esn;
  const inspectionId = inspection.id;
  const cavity = inspection.sect;
  console.log(
    "downloadInspectionDataUsingFetch() called for:",
    esn,
    inspectionId
  );

  let op = 'Full';
  if (snapshotsOnly) op = 'snapshotsOnly'
  if (snapshotsAnd360) op = 'snapshotsAnd360'
  const asyncUrl = `/api/inspection/${inspectionId}/zip?snapshotsOnly=${snapshotsOnly}&snapshotsAnd360Only=${snapshotsAnd360}&async=true`;
  const task_resp = await fetch(asyncUrl);
  const resp = await task_resp.json();
  if (resp != null && resp.id != null) {
    const taskId = resp.id;
    await waitForResponse(taskId);
    const filename = `${esn}_${cavity}_${inspectionId}_${op}.zip`;
    fetchAndDeleteFile(taskId, filename);
  } else {
    alert("Error downloading file:" + JSON.stringify(resp));
  }
};

// The async process triggers the rest call and obtains a task id;
// it uses the task id to poll for the COMPLETION status using task/id/status endpoint;
// when completed, it then downloads the produced file using the task/id/file endpoint;
// then finally deletes the file when done.
export const downloadInspectionStatsCsvAsync = async (doneCallback, manufactureStage) => {
  console.log("downloadInspectionStatsAsync() called");

  let asyncUrl = `/api/inspection/stats/csv?async=true`;
  if (manufactureStage != null) {
    asyncUrl += `&manufacture_stage=${manufactureStage.replace(' ','%20')}`;
  }
  const task_resp = await fetch(asyncUrl);
  const resp = await task_resp.json();
  if (resp != null && resp.id != null) {
    const taskId = resp.id;
    await waitForResponse(taskId);
    const filename = `inspection_report_stats.csv`;
    fetchAndDeleteFile(taskId, filename);
  } else {
    alert("Error downloading file:" + JSON.stringify(resp));
  }
  if (doneCallback != null)
    doneCallback();
};

export const downloadInspectionListCsvAsync = async (doneCallback) => {
  console.log("downloadInspectionListCsvAsync() called");

  const asyncUrl = `/api/inspection/list/csv?async=true`;
  const task_resp = await fetch(asyncUrl);
  const resp = await task_resp.json();
  if (resp != null && resp.id != null) {
    const taskId = resp.id;
    await waitForResponse(taskId);
    const filename = `inspection_list.csv`;
    fetchAndDeleteFile(taskId, filename);
  } else {
    alert("Error downloading file:" + JSON.stringify(resp));
  }
  if (doneCallback != null)
    doneCallback();
};

export const readInspectionStatsCsvAsync = async (manufactureStage) => {
  console.log(`readInspectionStatsCsvAsync() called with: ${manufactureStage}`);

  let asyncUrl = `/api/inspection/stats/csv?async=true`;
  if (manufactureStage != null) {
    asyncUrl += `&manufacture_stage=${manufactureStage.replace(' ','%20')}`;
  }
  const task_resp = await fetch(asyncUrl);
  const resp = await task_resp.json();
  if (resp != null && resp.id != null) {
    const taskId = resp.id;
    await waitForResponse(taskId);
    let content = await getTextFileContent(taskId);
    return content;
  } else {
    alert("Error downloading file:" + JSON.stringify(resp));
    return null;
  }
};

export const downloadDefectStatsCsvAsync = async () => {
  console.log("downloadDefectStatsAsync() called");

  const asyncUrl = `/api/defect/stats/csv?async=true`;
  const task_resp = await fetch(asyncUrl);
  const resp = await task_resp.json();
  if (resp != null && resp.id != null) {
    const taskId = resp.id;
    await waitForResponse(taskId);
    const filename = `defect_stats_report.csv`;
    fetchAndDeleteFile(taskId, filename);
  } else {
    alert("Error downloading file:" + JSON.stringify(resp));
  }
};

// path parameter allows it to work for both /api/inspection/pdf and /api/virtualtour/pdf
export const downloadInspectionReportPDFAsync = async (
  esn = "%",
  manufactureStage = "%",
  path = "/api/inspection/pdf"
) => {
  console.log("downloadInspectionReportPDFAsync() called");

  // alert('This feature is temporarily disabled.');
  // return;

  const asyncUrl = `${path}?esn=${esn}&manufacture_stage=${manufactureStage}&async=true`;
  const task_resp = await fetch(asyncUrl);
  const resp = await task_resp.json();
  if (resp != null && resp.id != null) {
    const taskId = resp.id;
    await waitForResponse(taskId);
    if (manufactureStage === "%") manufactureStage = "All_Stages";
    const filename = `${esn}_${manufactureStage}_report.pdf`;
    fetchAndDeleteFile(taskId, filename);
  } else {
    alert("Error downloading file:" + JSON.stringify(resp));
  }
};

// ----------------------------------- Request/response API ---------------------------------------------

export const getInspectionById = async (id) => {
  console.log("getInspection() called with id:", id);
  let data = {};
  try {
    const res = await fetch(`${BASE_URL}/inspection/${id}`);
    data = await res.json();
    console.log("Read Inspection:", data);
  } catch (e) {
    console.log("Error:", e);
  }
  return data;
};

export const getInspectionList = async (esn = null) => {
  console.log(`getInspectionList() called for esn: ${esn}`);
  let data = [];
  let query = "";
  if (esn != null) {
    query = `?esn=${esn}`;
  }
  try {
    console.log("query = ", query);
    const res = await fetch(`${BASE_URL}/inspection/list${query}`);
    data = await res.json();
    console.log("Read Inspection list:", data);
    if (!Array.isArray(data)) {
      data = [];
    }
  } catch (e) {
    console.log("Error:", e);
  }
  return data;
};

// this will download a file
export const getInspectionStats = async (id) => {
  console.log("getInspectionStats() called with id:", id);
  let data = {};
  try {
    const res = await fetch(`${BASE_URL}/inspection/${id}/stats`);
    data = await res.json();
    console.log("Read Inspection stats:", data);
  } catch (e) {
    console.log("Error:", e);
  }
  return data;
};

export const findInspectionImage = async (inspectionId, distance) => {
  console.log("findInspectionImage() called");
  let data = [];
  let query = "";
  if (distance != null) {
    query = `?distance=${distance}`;
  }
  try {
    const res = await fetch(
      `${BASE_URL}/inspection/${inspectionId}/image/find${query}`
    );
    data = await res.json();
    console.log("Read Inspection list:", data);
    if (!Array.isArray(data)) {
      data = [];
    }
  } catch (e) {
    console.log("Error:", e);
  }
  return data;
};

export const getInspectionImageDistances = async (inspectionId) => {
  console.log("getInspectionImageDistances() called");
  let data = [];

  try {
    const res = await fetch(
      `${BASE_URL}/inspection/${inspectionId}/image/distances`
    );
    data = await res.json();
    console.log("Read distances list:", data);
    if (!Array.isArray(data)) {
      data = [];
    }
  } catch (e) {
    console.log("Error:", e);
  }
  return data;
};

export const getInspectionMeasurementList = async (inspectionId) => {
  console.log("getInspectionMeasurementList() called with:", inspectionId);
  let data = [];
  try {
    const res = await fetch(
      `${BASE_URL}/inspection/${inspectionId}/measurement/list`
    );
    data = await res.json();
    console.log("Read Inspection measurement list:", data);
    if (!Array.isArray(data)) {
      data = [];
    }
  } catch (e) {
    console.log("Error:", e);
  }
  return data;
};

// Note: defects are groups of shapes within a measurement that share a common label
export const getInspectionDefectList = async (
  inspectionId,
  includeAIAnnotations = true
) => {
  console.log(
    "getInspectionDefectList() called with:",
    inspectionId,
    includeAIAnnotations
  );
  let data = [];
  try {
    const res = await fetch(
      `${BASE_URL}/inspection/${inspectionId}/defect/list?includeAI=${includeAIAnnotations}`
    );
    data = await res.json();
    console.log("Read Inspection defect list:", data);
    if (!Array.isArray(data)) {
      data = [];
    }
  } catch (e) {
    console.log("Error:", e);
  }
  return data;
};

// list of 360 images for a given inspection
export const getInspectionImageList = async (inspectionId) => {
  console.log("getInspectionImageList() called with:", inspectionId);
  let data = [];
  try {
    const res = await fetch(
      `${BASE_URL}/inspection/${inspectionId}/image/list`
    );
    data = await res.json();
    console.log("Read Inspection Image list:", data);
    if (!Array.isArray(data)) {
      data = [];
    }
  } catch (e) {
    console.log("Error:", e);
  }
  return data;
};

export const createInspection = async (body) => {
  console.log("createInspection() called with: ", body);

  let data = {};
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  };

  try {
    let res = await fetch(`${BASE_URL}/inspection`, requestOptions);
    data = await res.json();
    console.log("Inspection created:", data);
  } catch (e) {
    console.log("Error:", e);
  }

  return data;
};

export const deleteInspection = async (id) => {
  console.log("deleteInspection() called with id:", id);

  let data = {};
  const requestOptions = {
    method: "DELETE",
  };

  try {
    let res = await fetch(`${BASE_URL}/inspection/${id}`, requestOptions);
    data = await res.json();
    console.log("delete response:", data);
  } catch (e) {
    console.log("Error:", e);
  }
  return data;
};

// update inspection with the properties specified in the body json object
// property not included in the body, or provided as null, are not modified.
export const updateInspection = async (id, body) => {
  console.log("updateInspection() called with: ", id, body);
  let data = {};

  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
  try {
    let res = await fetch(
      `${BASE_URL}/inspection/${id}/update`,
      requestOptions
    );
    data = await res.json();
    console.log("Inspection update resp:", data);
  } catch (e) {
    console.log("Error:", e);
  }
  return data;
};

// note that metadataFile is optional
export const uploadImageFileAndMetadata = async (
  inspectionId,
  bladeId,
  imageFile,
  metadataFile
) => {
  console.log(
    `uploadImageFileAndMetadata() called for inspectionId: ${inspectionId}, bladeId: ${bladeId}, imageFile: ${imageFile}, metadataFile: ${metadataFile}`
  );

  let data = {};
  if (imageFile != null || metadataFile != null) {
    const formData = new FormData();
    if (imageFile) formData.append("image_file", imageFile);
    if (metadataFile) formData.append("metadata_file", metadataFile);

    const requestOptions = {
      method: "POST",
      body: formData,
    };

    try {
      let res = await fetch(
        `${BASE_URL}/inspection/${inspectionId}/${bladeId}/uploadImageFileAndMetadata`,
        requestOptions
      );
      data = await res.json();
      console.log("Image & metadata upload resp:", data);
    } catch (e) {
      console.log("Error:", e);
    }
  }

  return data;
};


// ------------------------- Filtered Inspection Reports ---------------------------- //
export const generateInspectionDefectStatsReport = async (filterParams, doneCallback) => {
  let apiUrl = `/api/report/inspDefectStats`;
  try {
    const task_resp = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filterParams),
    });

    const resp = await task_resp.json();

    if (resp && resp.id) {
      const taskId = resp.id;
      await waitForResponse(taskId);

      const today = new Date().toISOString().split('T')[0];
      const filename = `blades_inspection_defect_stats_${today}.csv`;
      fetchAndDeleteFile(taskId, filename);
    } else {
      alert("Error downloading file:" + JSON.stringify(resp));
    }

    if (doneCallback) doneCallback();
    return { success: true };
  } catch (error) {
    console.error("Error while generating inspection defect stats:", error);
    alert("Oops! Something went wrong while generating the inspection defect stats. Please retry or reach out to support if the issue persists.");
    return { success: false };
  }
};

export const generateInspectionListReport = async (filterParams, doneCallback) => {
  let apiUrl = `/api/report/inspectionList`;
  try {
    const task_resp = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filterParams),
    });

    const resp = await task_resp.json();

    if (resp && resp.id) {
      const taskId = resp.id;
      await waitForResponse(taskId);

      const today = new Date().toISOString().split('T')[0];
      const filename = `blades_inspection_list_${today}.csv`;
      fetchAndDeleteFile(taskId, filename);
    } else {
      alert("Error downloading file:" + JSON.stringify(resp));
    }

    if (doneCallback) doneCallback();
    return { success: true };
  } catch (error) {
    console.error("Error while generating inspection list report:", error);
    alert("Oops! Something went wrong while generating the inspection list. Please retry or reach out to support if the issue persists.");
    return { success: false };
  }
};

export const generateInspectionDefectListCsv = async (filterParams, doneCallback) => {
  let apiUrl = `/api/report/inspectionDefectList`;
  try {
    const task_resp = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filterParams),
    });

    const resp = await task_resp.json();

    if (resp && resp.id) {
      const taskId = resp.id;
      await waitForResponse(taskId);

      const today = new Date().toISOString().split('T')[0];
      const filename = `blades_inspection_defect_list_${today}.csv`;
      fetchAndDeleteFile(taskId, filename);
    } else {
      alert("Error downloading file:" + JSON.stringify(resp));
    }

    if (doneCallback) doneCallback();
    return { success: true };
  } catch (error) {
    console.error("Error while generating inspection defect list report:", error);
    alert("Oops! Something went wrong while generating the inspection defect list. Please retry or reach out to support if the issue persists.");
    return { success: false };
  }
};

export const getInspectionDefectStatsDashboard = async (filterParams) => {
  let apiUrl = `/api/report/inspDefectStats`;
  try {
    const task_resp = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filterParams),
    });

    const resp = await task_resp.json();

    if (resp != null && resp.id != null) {
      const taskId = resp.id;
      await waitForResponse(taskId);
      let content = await getTextFileContent(taskId);
      return content;
    } else {
      alert("Error downloading file:" + JSON.stringify(resp));
      return null;
    }

  } catch (error) {
    console.error("Error while generating inspection list report:", error);
    alert("Oops! Something went wrong while generating the inspection list. Please retry or reach out to support if the issue persists.");
    return null;
  }
};

export const getInspectionDefectListDashboard = async (filterParams) => {
  let apiUrl = `/api/report/inspectionDefectList`;
  try {
    const task_resp = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filterParams),
    });

    const resp = await task_resp.json();

    if (resp != null && resp.id != null) {
      const taskId = resp.id;
      await waitForResponse(taskId);
      let content = await getTextFileContent(taskId);
      return content;
    } else {
      alert("Error downloading file:" + JSON.stringify(resp));
      return null;
    }
  } catch (error) {
    console.error("Error while generating inspection defect list :", error);
    alert("Oops! Something went wrong while generating the inspection defect list. Please retry or reach out to support if the issue persists.");
    return { success: false };
  }
};