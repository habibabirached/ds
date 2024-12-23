import { styled, Badge } from "@mui/material";

import { defectLabels } from "../config";

// StyledBadge definition
export const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: "#44b700",
    color: "#44b700",
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
  },
  "@keyframes ripple": {
    "0%": {
      transform: "scale(.8)",
      opacity: 1,
    },
    "100%": {
      transform: "scale(2.4)",
      opacity: 0,
    },
  },
}));

export const emptyMeasurement = {
  area: 0,
  aspect_ratio: 0,
  chord_wise_width: 0,
  component: "",
  date: "2023-11-01",
  depth: 0,
  description: "",
  dnv_response: "",
  edge_distance: 0,
  finding_category: "",
  finding_code: "",
  finding_reference: "",
  finding_type: "",
  ge_disposition: "",
  ge_disposition_response: "",
  height: 0,
  image_id: 1, // remember to set it up to current image_id
  is_priority: true,
  le_distance: 0,
  length: 0,
  location: "",
  percent_area: 0,
  position_in_blade: "",
  reference: "",
  root_face_distance: 0,
  span_wise_length: 0,
  submission_code: "",
  te_distance: 0,
  width: 0,
  image_pitch: 0.0,
  image_yaw: 0.0,
  image_hfov: 0,
  is_manual: true,
};


// --------------------------------------------------------------------------------------


export const defaultLabelIndex = 25; // 'Other' is default
export const snapWidth = 1024;
export const snapHeight = 768;

// =========================== Labeling Feature ==========================
export const ANNOTATION_FILE_TEMPLATE = {
  version: "5.2.1",
  flags: {},
  shapes: [
    {
      label: "None",
      points: [],
      description: "",
      shape_type: "polygon",
      group_id: null,
      flags: {},
    },
  ],
  imagePath: "image.png",
  imageData: null,
  imageHeight: snapHeight,
  imageWidth: snapWidth,
};

// getThumbnailUrl definition 
export const getImageThumbnailUrl = (image_id, includeAnnotations = false) => {
  return `/api/image/${image_id}/thumbnail?includeAnnotations=${includeAnnotations}`;
};

export const getImageUrl = (image_id) => {
  console.log("image_id = ", image_id);
  return `/api/image/${image_id}/file`;
};

export const BASE_URL_REGEX = /^.+?[^\/:](?=[?\/]|$)/;

export const getBaseUrl = () => {
  let siteUrl = window.location.href || "";
  let baseUrl = siteUrl.match(BASE_URL_REGEX)[0];
  return baseUrl;
};

export const getXLSReportUrl = (inspection_id) => {
  return `/api/inspection/${inspection_id}/xls`;
};

export const getDOCXReportUrl = (esn) => {
  return `/api/inspection/docx?esn=${esn}`;
};

export const getDownloadFilesUrl = (inspection_id) => {
  return `/api/inspection/${inspection_id}/zip`;
};

export const getDownloadSnapshotsUrl = (inspection_id) => {
  console.log("api/inspection");
  return `/api/inspection/${inspection_id}/zip?snapshotsOnly=true`;
};

export const getDownloadSnapshotsAnd360ImagesUrl = (inspection_id) => {
  console.log("api/inspection");
  return `/api/inspection/${inspection_id}/zip?snapshotsAnd360Only=true`;
};

// We use time here to force the reload of the image upon upload
const getMeasurementUrl = (id, includeAnnotations = true) => {
  return `/api/measurement/${id}/image_file?includeAnnotations=${includeAnnotations}&ts=${new Date().getTime()}`;
};

export const getMeasurementImageFileUrl = (measurement_id) => {
  return `/api/measurement/${measurement_id}/image_file`;
};

export const getMeasurementAnnotationFileUrl = (measurement_id) => {
  return `/api/measurement/${measurement_id}/annotation_file`;
};

export const getMeasurementThumbnailUrl = (measurement_id, includeAnnotations=false) => {
  let timestamp = Date.now();
  return `/api/measurement/${measurement_id}/thumbnail?includeAnnotations=${includeAnnotations}&ts=${timestamp}`;
};

export const getLabelIndex = (name) => {
  for (let i = 0; i < defectLabels.length; i++) {
    let label = defectLabels[i];
    if (label.toLowerCase() == name.toLowerCase()) {
      return i;
    }
  }
  return -1;
};

// --------------------------------------- Inspection Utils --------------------------------------

export const getMeasurementLocation = (location) => {
  console.log(
    "utils.getMeasurementLocation() called. with location refz_loc = ",
    location
  );
  if (location != null) {
    let loc = location.trim().toLowerCase();

    if (loc === "cw" || loc.includes("cent")) {
      return "Center Web";
    }
    
    if (
      loc === "te" ||
      loc.includes("trail")
    ) {
      return "Trailing Edge";
    }

    if (loc === "le" || loc.includes("lead")) {
      return "Leading Edge";
    }

    if (loc === "cs" || loc.includes("stiff")) {
      return "C Stiffener";
    }

    if (loc === "tw"  || loc.includes("third")) {
      return "Third Web";
    }
    
    return "Unknown Cavity";
    
  }
  
  return location;
};


export const csv2JSON = (csvFileText) => {

  let lines=csvFileText.split("\n");
  console.log('csv lines: \n',lines);
  let result = [];

  // NOTE: If your columns contain commas in their values, you'll need
  // to deal with those before doing the next step 
  // (you might convert them to &&& or something, then covert them back later)
  // jsfiddle showing the issue https://jsfiddle.net/
  let initialLine = 0;
  while (lines[initialLine] == null)
    initialLine++;

  let headerLine = lines[initialLine];
  headerLine = headerLine.replace(/(\r\n|\n|\r)/gm, "");
  let headers=headerLine.split(",")

  initialLine++;

  for(let i=initialLine;i<lines.length;i++){
      let obj = {};
      let line = lines[i];
      line = line.replace(/(\r\n|\n|\r)/gm, "");
      let lineArray=line.split(",");
      for(var j=0;j<headers.length;j++){
          obj[headers[j]] = lineArray[j];
      }
      result.push(obj);
  }

  return result; //JavaScript object
  //return JSON.stringify(result); //JSON
};