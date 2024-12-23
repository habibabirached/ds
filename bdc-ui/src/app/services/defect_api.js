import { BASE_URL } from "./api_config";
import { fetchAndDeleteFile, getTextFileContent, waitForResponse } from "./async_utils";

export const emptyDefect = {
    area: 0.0,
    aspect_ratio: 0.0,
    chord_wise_width: 0.0,
    date: null,
    depth: 0.0,
    description: "",
    design_tolerance: "",
    disposition_provided_by: "",
    finding_type: "Other",
    ge_disposition: "",
    height: 0.0,
    image_hfov: 0,
    image_id: -1,
    image_pitch: 0.0,
    image_yaw: 0.0,
    is_manual: true,
    sso: "",
    is_priority: false,
    length: 0.0,
    location: "cw",
    percent_area: 0.0,
    repair_approved_by: "",
    repair_date: null,
    repair_report_id: "",
    root_face_distance: 0.0,
    span_wise_length: 0.0,
    status: "Open",
    width: 0.0,
  };



/**
 *
 * @param {*} body should contain image_id and and measurement_id
 * @returns
 */
export const createDefect = async (body) => {
  console.log("createDefect() called with: ", body);
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };

  let resp = await fetch(`${BASE_URL}/defect`, requestOptions);
  console.log("Create defect resp:", resp);
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
  
export const getDefect = async (id) => {
  console.log("getDefect() called.");

  let resp = await fetch(`${BASE_URL}/defect/${id}`);
  console.log("Get defect resp:", resp);
  let data = await resp.json();
  return data;
};

export const updateDefect = async (id, body) => {
  console.log("updateDefect() called with: ", id, body);
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };

  let resp = await fetch(
    `${BASE_URL}/defect/${id}/update`,
    requestOptions
  );
  console.log("Update defect resp:", resp);

  return resp;
};


export const updateDefectList = async (idList, body) => {
  console.log("updateDefectList() called with: ", idList, body);
  
  let update_body = Object.assign({},body);
  update_body["id_list"]=idList;

  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update_body),
  };

  let resp = await fetch(
    `${BASE_URL}/defect/update_list`,
    requestOptions
  );
  console.log("Update defect list resp:", resp);

  return resp;
};


export const searchDefectList = async (
  esn = null
) => {
  console.log("searchDefectList() called.");

  let query = "";
  if (esn != null) {
    query += `esn=${esn}`;
  }

  let url = `${BASE_URL}/defect/search`;
  if (query.length > 0) url = url + "?" + query;
  let resp = await fetch(url);
  console.log("Get defect/search resp:", resp);
  let data = await resp.json();
  return data;
};


export const readSearchDefectListCsv = async (esn=null) => {
  let apiUrl = `${BASE_URL}/defect/search/csv`;
  try {
   
    let res = await fetch(apiUrl, {
      method:'GET', // can also be POST
      headers: {
          'content-type': 'text/csv;charset=UTF-8',
        }
      });
    
      if (res.status === 200) {
        const data = await res.text();
        return data;
      }
        
  } catch (error) {
    console.error("Error while searching list of defects:", error);
    return null;
  }
};


export const downloadSelectedDefectFilesAndAnnotationsAsync = async (
  idList
) => {
  console.log(
    `downloadSelectedDefectFilesAndAnnotationsAsync() called with idList: ${idList}`
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
        `${BASE_URL}/defect/selected_annotation_list/zip`,
        requestOptions
      );

      if (task_resp != null) {
        const task = await task_resp.json();
        if (task.id != null) {
          const taskId = task.id;
          await waitForResponse(taskId);
          const filename =  "selected_defect_files_and_annotations.zip";
          fetchAndDeleteFile(taskId, filename);
        } else {
          alert("Error downloading file:"+JSON.stringify(task)); 
        }
      }
    } catch (e) {
      console.log("Error:", e);
    }
  } else {
    alert("Nothing to do. Current list of selected defect annotations is empty.");
  }
};


// Defect Repair Evidence Files --------------------------------------------------------


export const getDefectEvidenceFileList = async (id) => {
  console.log("getDefectEvidenceFileList() called.");

  let resp = await fetch(`${BASE_URL}/defect/${id}/repair_evidence_file_list`);
  console.log("Get defect repair evidence file list resp:", resp);
  let data = await resp.json();
  return data;
};

export const getDefectEvidenceFile = async (id) => {
  console.log("getDefectEvidenceFile() called.");
  let url = getDefectEvidenceFileUrl(id);
  let resp = await fetch(url);
  console.log("Get defect repair evidence file resp:", resp);
  let data = await resp.json();
  return data;
};

export const getDefectEvidenceFileUrl = (id) => {
  let url = `${BASE_URL}/defect/repair_evidence_file/${id}`;
  return url;
}

export const deleteDefectEvidenceFile = async (id) => {
  console.log("deleteDefectEvidenceFile() called.");

  let resp = await fetch(`${BASE_URL}/defect/repair_evidence_file/${id}`,{method:'DELETE'});
  console.log("Delete defect repair evidence fileresp:", resp);
  let data = await resp.json();
  return data;
};

export const uploadDefectRepairEvidenceFile = async (
  defectId,
  evidenceFile,
  repairEvidenceComments
) => {
  console.log(
    `uploadDefectRepairEvidenceFile() called for defectId: ${defectId}, evidenceFile: ${evidenceFile}, repairEvidenceComments: ${repairEvidenceComments}`
  );

  let data = {};
  if (evidenceFile != null) {
    const formData = new FormData();
    if (evidenceFile) formData.append("evidence_file", evidenceFile);
    if (repairEvidenceComments) formData.append("repair_evidence_comments", repairEvidenceComments);

    const requestOptions = {
      method: "POST",
      body: formData,
    };

    try {
      let res = await fetch(
        `${BASE_URL}/defect/${defectId}/repair_evidence_file`,
        requestOptions
      );
      data = await res.json();
      console.log("Repair Evidence File upload resp:", data);
    } catch (e) {
      console.log("Error:", e);
    }
  }
  return data;
};