/*
  This file defines the `DefectValidationPage` component, which is part of a React application 
  using MUI components and various services to manage and display defect validation data. 
  The component initializes several state variables to store data such as inspection lists, 
  defect severity tables, blade cavity options, measurement lists, and validation status. 
  It uses `useEffect` to fetch initial data from various APIs when the component is mounted.

  The component provides a data grid to display measurements, allows users to select and validate 
  defects, and updates the state accordingly. It includes functionality to download validated 
  measurement files and annotations. The `handleValidationStatusChange` function manages the 
  validation status of selected measurements, updating annotation files and logging state changes 
  to a local server for debugging purposes.

  Key elements include:
  - MUI components for the layout and UI elements.
  - State management using `useState` hooks for various data elements like inspection lists, 
    defect severity tables, and measurement lists.
  - API calls to fetch data from `inspection_api` and `measurement_api`.
  - Logging functionality to track state changes for debugging.
  - Conditional rendering to display progress bars, validation statuses, and images based on 
    the selected measurement.
  - Constants for validation statuses and an empty annotation template to standardize data handling.
*/

import "./DefectValidationPage.css";
import { useEffect, useState, Suspense, Fragment, useCallback } from "react";
import {
  Box,
  LinearProgress,
  Button,
  Grid,
  Typography,
  Select,
  MenuItem,
  FormControl,
  FormLabel,
  responsiveFontSizes,
  TextField,
  DialogContent,
  DialogTitle,
  Dialog,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";

import { DataGrid, useGridApiRef } from "@mui/x-data-grid";
import { showDirectoryPicker } from "https://cdn.jsdelivr.net/npm/file-system-access/lib/es2018.js";

//import { useHistory } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Loading from "../../components/Loading";
import React from "react";

import DrawOutlinedIcon from "@mui/icons-material/DrawOutlined";
import GridOnOutlinedIcon from "@mui/icons-material/GridOnOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import NavigateBeforeOutlinedIcon from "@mui/icons-material/NavigateBeforeOutlined";
import CardMembershipIcon from "@mui/icons-material/CardMembership";

import { jsonrepair } from "jsonrepair";
import {
  deleteInspection,
  getInspectionById,
  getInspectionImageDistances,
  getInspectionImageList,
  getInspectionList,
  getInspectionMeasurementList,
  updateInspection,
} from "../../services/inspection_api";

import FileDownloadIcon from "@mui/icons-material/FileDownload";
import LinearProgressWithLabel from "../../components/LinearProgressWithLabel";
import {
  downloadValidatedMeasurementFilesAndAnnotationsAsync,
  getDefectSeverity,
  getMeasurement,
  getMeasurementAnnotationFile,
  getMeasurementOriginalAnnotationFile,
  getMeasurementOriginalAnnotationFileMetadata,
  getMeasurementValidatedAnnotationFile,
  getMeasurementValidatedAnnotationFileMetadata,
  searchMeasurementList,
  uploadAnnotationMeasurementFile,
  uploadImageMeasurementFile,
  uploadOriginalAnnotationMeasurementFile,
  uploadValidatedAnnotationMeasurementFile,
} from "../../services/measurement_api";
import dayjs from "dayjs";
import ValidatedCanvasBodyWrapper from "./ValidatedCanvasBodyWrapper";
import { getImage } from "../../services/image_api";

import CustomColumnHeader from "../../components/Filter/CustomColumnHeader";
import useFilters from "../../components/Filter/useFilters2";
import { BLADE_CAVITIES, DEFECT_DISPOSITION_OPTIONS } from "../../config";
import { getMeasurementLocation } from "../../utils/utils";

const textFieldStyles = {
  margin: 0,
  padding: 0,
  "& .MuiInputBase-root": {
    height: "10px",
    fontSize: "0.875rem",
  },
  "& .MuiOutlinedInput-input": {
    padding: "8px 14px",
  },
};

const DEBUG = true;

function DefectValidationPage() {
  const [loading, setLoading] = useState(false); // Spinner visibility state

  /*
  This block of code initializes state variables and hooks for the DefectValidationPage component. 
  The `loggedUser` retrieves the logged-in user's SSO from local storage. Various `useState` hooks 
  are used to manage different aspects of the component's state:

  - `inspectionList` and `inspectionIdList` store the list of inspections and their IDs, respectively. 
    Example: inspectionList = [], inspectionIdList = [].
  - `defectSeverityTable` and `defectTypeList` store the defect severity information and types. 
    Example: 
    defectSeverityTable = {
      "Adhesive Cracks": "LOW",
      "Adhesive Voids": "HIGH",
      "CoreGap": "LOW",
      "Cuts in Web Flange": "HIGH",
      "Damaged Glass": "HIGH",
      "Dust & dirt": "NONE",
      "Entrained air": "LOW",
      "Exposed core / Missing laminate": "HIGH",
      "Foreign Objects": "NONE",
      "Laminate Loose Edge": "LOW",
      "Layer end": "LOW",
      "Layer misplacement": "HIGH",
      "Layers Overlap": "HIGH",
      "LPS Cable Damage": "HIGH",
      "Main SW Web Foot Lam": "HIGH",
      "Metal Shavings": "LOW",
      "RCO Bracket bond": "SAFETY",
      "RCO Seal": "NONE",
      "Repairs incorrect staggering": "LOW",
      "Shearclips missing": "NONE",
      "TE SW Web Foot Lam": "HIGH",
      "TEBC Overlam Overlap": "HIGH",
      "TEBC Paste Thickness": "LOW",
      "TEBC Wave": "HIGH",
      "Uncured laminate": "LOW",
      "Other": "NONE",
      "Voids Overlaminate": "HIGH",
      "Waves Laminate": "HIGH",
      "Core Offset": "LOW",
      "Semi-Dry Glass / LFR": "LOW",
      "Delamination / LDL": "HIGH",
      "Core Misplacement / LCM": "LOW",
      "LPS Loose Cable": "LOW",
      "Laminate Roving Misplacement / LRM": "LOW"
    }
    defectTypeList = [
      "Adhesive Cracks",
      "Adhesive Voids",
      "Core Misplacement / LCM",
      "Core Offset",
      "CoreGap",
      "Cuts in Web Flange",
      "Damaged Glass",
      "Delamination / LDL",
      "Dust & dirt",
      "Entrained air",
      "Exposed core / Missing laminate",
      "Foreign Objects",
      "LPS Cable Damage",
      "LPS Loose Cable",
      "Laminate Loose Edge",
      "Laminate Roving Misplacement / LRM",
      "Layer end",
      "Layer misplacement",
      "Layers Overlap",
      "Main SW Web Foot Lam",
      "Metal Shavings",
      "Other",
      "RCO Bracket bond",
      "RCO Seal",
      "Repairs incorrect staggering",
      "Semi-Dry Glass / LFR",
      "Shearclips missing",
      "TE SW Web Foot Lam",
      "TEBC Overlam Overlap",
      "TEBC Paste Thickness",
      "TEBC Wave",
      "Uncured laminate",
      "Voids Overlaminate",
      "Waves Laminate"
    ]
  - `bladeCavityOptions` and `newDefectCavity` manage the blade cavity options and the currently 
    selected blade cavity. Example: bladeCavityOptions = ["Leading Edge", "Trailing Edge", "Center Web"], 
    newDefectCavity = "Leading Edge".
  - `statusOptions` and `defectDispositionOptions` store possible status and disposition options 
    for defects. Example: statusOptions = ["Open", "Closed", "Repaired"], defectDispositionOptions = 
    ["AI False Positive", "Out of Tolerance - Repair Needed", "Within Tolerance - No Repair Needed"].
  - `measurementList` and `measurementIdList` manage the list of measurements and their IDs. 
    Example: measurementList = [], measurementIdList = [].
  - `selectedIdList` keeps track of the IDs of selected measurements in the data grid. 
    Example: selectedIdList = [].
  - `showProgressBar` controls the visibility of a progress bar. Example: showProgressBar = false.
  - `selectedMeasurementId` holds the ID of the currently selected measurement. Example: selectedMeasurementId = 531.
  - `inspectionData`, `imageData`, and `measurementData` store detailed data for the selected inspection, 
    image, and measurement. Example:
    inspectionData = {
      "app_type": "aerones",
      "blade_type": "",
      "certificate_id": null,
      "certification_status": "",
      "customer_name": "TPI",
      "d3_date": null,
      "date": "Thu, 21 Mar 2024 00:00:00 GMT",
      "disp": "",
      "engine_type": "na",
      "esn": "tpi-50844",
      "factory_name": "",
      "id": 7,
      "inspector_name": "",
      "location": "MX3-Juarez, Mexico",
      "manufacture_date": null,
      "manufacture_stage": "Blade_1",
      "misc": "",
      "post_molding_date": null,
      "sect": "Central_Web",
      "sso": "",
      "status": "Incomplete",
      "supplier": null,
      "upload_date": "Wed, 27 Mar 2024 00:00:00 GMT"
    }
    imageData = {
      "blade_id": 1,
      "defect_desc": "",
      "defect_location": "",
      "defect_severity": "n_a",
      "defect_size": 0,
      "distance": 45.5,
      "id": 141,
      "inspection_id": 7,
      "timestamp": "Wed, 27 Mar 2024 00:00:00 GMT"
    }
    measurementData = {
      "area": 0,
      "aspect_ratio": 0,
      "chord_wise_width": 0,
      "component": "",
      "date": "Wed, 27 Mar 2024 00:00:00 GMT",
      "depth": 0,
      "description": "",
      "design_tolerance": "",
      "disposition_provided_by": "",
      "dnv_response": "",
      "edge_distance": 0,
      "finding_category": "",
      "finding_code": "",
      "finding_reference": "",
      "finding_type": "CoreGap",
      "ge_disposition": "",
      "ge_disposition_response": "",
      "height": 0,
      "id": 531,
      "image_hfov": 80,
      "image_id": 141,
      "image_pitch": 30,
      "image_yaw": 190,
      "is_manual": false,
      "is_priority": false,
      "le_distance": 0,
      "length": 0,
      "location": "Central_Web",
      "percent_area": 0,
      "position_in_blade": "",
      "reference": "",
      "repair_approved_by": "",
      "repair_date": null,
      "repair_report_id": "",
      "root_face_distance": 45.5,
      "span_wise_length": 0,
      "status": "Open",
      "submission_code": "",
      "te_distance": 0,
      "width": 0
    }

  "measurementList": [
    {
      "defect_id": "J80812-254",
      "id": 254,
      "image_distance": 9,
      "image_id": 45,
      "inspection_blade_type": "",
      "inspection_esn": "J80812",
      "inspection_id": 3,
      "inspection_sect": "te_uw",
      "inspection_sso": "",
      "inspection_upload_date": "Fri, 08 Mar 2024 00:00:00 GMT",
      "measurement_disposition": "",
      "measurement_finding_type": "Other",
      "measurement_is_manual": false,
      "measurement_status": "Open",
      "validated_by": null,
      "validated_measurement_annotation_file_id": null,
      "validation_status": null,
      "validation_timestamp": null
    },
    {
      "defect_id": "J80812-250",
      "id": 250,
      "image_distance": 4,
      "image_id": 47,
      "inspection_blade_type": "",
      "inspection_esn": "J80812",
      "inspection_id": 3,
      "inspection_sect": "te_uw",
      "inspection_sso": "",
      "inspection_upload_date": "Fri, 08 Mar 2024 00:00:00 GMT",
      "measurement_disposition": "",
      "measurement_finding_type": "Other",
      "measurement_is_manual": false,
      "measurement_status": "Open",
      "validated_by": null,
      "validated_measurement_annotation_file_id": null,
      "validation_status": null,
      "validation_timestamp": null
    },
  - `validationStatus` manages the validation status of the selected measurement. 
    Example: validationStatus = "Not Validated", validationStatus = "As Is".
  - `validatedImageTS` tracks the timestamp for the validated image, ensuring it updates appropriately. 
    Example: validatedImageTS = 1672531199000.
  - `VALIDATION_AS_IS`, `VALIDATION_REVIEW`, `VALIDATION_REJECT`, and `NOT_VALIDATED` are constants 
    defining validation statuses. Example: VALIDATION_AS_IS = "As Is", VALIDATION_REVIEW = "Review", 
    VALIDATION_REJECT = "Reject", NOT_VALIDATED = "Not Validated".
  - `VALIDATED_OPTIONS_LIST` is an array containing the validation status options. 
    Example: VALIDATED_OPTIONS_LIST = [VALIDATION_AS_IS, VALIDATION_REVIEW, VALIDATION_REJECT].
  - `EMPTY_ANNOTATION` is a template for an empty annotation. Example: EMPTY_ANNOTATION = {
    version: "5.2.1",
    flags: {},
    shapes: [],
    imagePath: "unknown.png",
    imageData: null,
    imageHeight: 768,
    imageWidth: 1024
  }.
*/

  const loggedUser = localStorage.getItem("loggedSSO");

  const [inspectionList, setInspectionList] = useState([]);
  const [inspectionidList, setInspectionIdList] = useState([]);

  const [defectSeverityTable, setDefectSeverityTable] = useState({});
  const [defectTypeList, setDefectTypeList] = useState([]);

  const bladeCavities = BLADE_CAVITIES;
  const [bladeCavityOptions, setBladeCavityOptions] = useState(bladeCavities);
  const [newDefectCavity, setNewDefectCavity] = useState(bladeCavities[0]);

  const statusOptions = ["Open", "Closed", "Repaired"];
  const defectDispositionOptions = DEFECT_DISPOSITION_OPTIONS;

  const [doShowOriginal, setDoShowOriginal] = useState(false);

  const [measurementList, setMeasurementList] = useState([]);

  const [measurementIdList, setMeasurementIdList] = useState([]);
  const [validationInfo, setValidationInfo] = useState(null);

  const [selectedIdList, setSelectedIdList] = useState([]);
  const [showProgressBar, setShowProgressBar] = useState(false);

  const [selectedMeasurementId, setSelectedMeasurementId] = useState(null);

  const [inspectionData, setInspectionData] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [measurementData, setMeasurementData] = useState(null);
  const [validationStatus, setValidationStatus] = useState("Not Validated");

  const [validatedImageTS, setValidatedImageTS] = useState(
    new Date().getTime()
  );

  const [originalImageTS, setOriginalImageTS] = useState(new Date().getTime());

  const [currentImageTS, setCurrentImageTS] = useState(new Date().getTime());

  const VALIDATION_AS_IS = "As Is";
  const VALIDATION_REVIEW = "Review";
  const VALIDATION_REJECT = "Reject";
  const NOT_VALIDATED = "Not Validated";

  const VALIDATED_OPTIONS_LIST = [
    VALIDATION_AS_IS,
    VALIDATION_REVIEW,
    VALIDATION_REJECT,
  ];

  const EMPTY_ANNOTATION = {
    version: "5.2.1",
    flags: {},
    shapes: [],
    imagePath: "unknown.png",
    imageData: null,
    imageHeight: 768,
    imageWidth: 1024,
  };

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialFilters = {
    defect_id: { value: "", type: "contains" },
    image_distance: { value: "", type: "Less than" },
    inspection_upload_date: { value: "", type: "contains" },
    inspection_sso: { value: "", type: "contains" },
    inspection_blade_type: { value: "", type: "contains" },
    inspection_sect: { value: "", type: "contains" },
    measurement_finding_type: { value: "", type: "contains" },
    validation_labels: { value: "", type: "contains" },
    measurement_disposition: { value: "", type: "contains" },
    validation_timestamp: { value: "", type: "contains" },
    validated_by: { value: "", type: "contains" },
    validation_status: { value: "", type: "contains" },
    is_manual: { value: "all", type: "manual_filter" },
  };

  const [filters, handleFilterChange, clearFilters, setFilters, applyFilters] =
    useFilters(initialFilters, "DefectValidationFilters");

  const filteredRows = applyFilters(measurementList, filters);

  const addMeasurementId = (inspection, measList) => {
    if (measList != null)
      for (let measurement of measList) {
        measurement["measurement_id"] = inspection.esn + "-" + measurement.id;
      }
  };

  const getProbabilityOfFailure = (defect_type) => {
    let prob = defectSeverityTable[defect_type];
    if (prob == null) prob = "N/A";
    //console.log(`Probability for: ${defect_type} is ${prob}`);
    return prob;
  };

  // if we want to calculate the severity ws use the table form the server
  // fetchDefectSeverityTable is an asynchronous function responsible for fetching the defect severity table
  // from the server using the getDefectSeverity API call. This function sets the defectSeverityTable state
  // with the retrieved data, which is an object mapping defect types to their respective severity levels.
  // For example:
  // defectSeverityTable = {
  //   "Adhesive Cracks": "LOW",
  //   "Adhesive Voids": "HIGH",
  //   "CoreGap": "LOW",
  //   "Cuts in Web Flange": "HIGH",
  //   "Damaged Glass": "HIGH",
  //   "Dust & dirt": "NONE",
  //   "Entrained air": "LOW",
  //   "Exposed core / Missing laminate": "HIGH",
  //   "Foreign Objects": "NONE",
  //   "Laminate Loose Edge": "LOW",
  //   "Layer end": "LOW",
  //   "Layer misplacement": "HIGH",
  //   "Layers Overlap": "HIGH",
  //   "LPS Cable Damage": "HIGH",
  //   "Main SW Web Foot Lam": "HIGH",
  //   "Metal Shavings": "LOW",
  //   "RCO Bracket bond": "SAFETY",
  //   "RCO Seal": "NONE",
  //   "Repairs incorrect staggering": "LOW",
  //   "Shearclips missing": "NONE",
  //   "TE SW Web Foot Lam": "HIGH",
  //   "TEBC Overlam Overlap": "HIGH",
  //   "TEBC Paste Thickness": "LOW",
  //   "TEBC Wave": "HIGH",
  //   "Uncured laminate": "LOW",
  //   "Other": "NONE",
  //   "Voids Overlaminate": "HIGH",
  //   "Waves Laminate": "HIGH",
  //   "Core Offset": "LOW",
  //   "Semi-Dry Glass / LFR": "LOW",
  //   "Delamination / LDL": "HIGH",
  //   "Core Misplacement / LCM": "LOW",
  //   "LPS Loose Cable": "LOW",
  //   "Laminate Roving Misplacement / LRM": "LOW"
  // }
  // The function also extracts defect types from the table keys, sorts them, and populates the defectTypeList
  // state with these values, which may look like:
  // defectTypeList = [
  //   "Adhesive Cracks",
  //   "Adhesive Voids",
  //   "Core Misplacement / LCM",
  //   "Core Offset",
  //   "CoreGap",
  //   "Cuts in Web Flange",
  //   "Damaged Glass",
  //   "Delamination / LDL",
  //   "Dust & dirt",
  //   "Entrained air",
  //   "Exposed core / Missing laminate",
  //   "Foreign Objects",
  //   "LPS Cable Damage",
  //   "LPS Loose Cable",
  //   "Laminate Loose Edge",
  //   "Laminate Roving Misplacement / LRM",
  //   "Layer end",
  //   "Layer misplacement",
  //   "Layers Overlap",
  //   "Main SW Web Foot Lam",
  //   "Metal Shavings",
  //   "Other",
  //   "RCO Bracket bond",
  //   "RCO Seal",
  //   "Repairs incorrect staggering",
  //   "Semi-Dry Glass / LFR",
  //   "Shearclips missing",
  //   "TE SW Web Foot Lam",
  //   "TEBC Overlam Overlap",
  //   "TEBC Paste Thickness",
  //   "TEBC Wave",
  //   "Uncured laminate",
  //   "Voids Overlaminate",
  //   "Waves Laminate"
  // ]
  // This data is crucial for initializing and updating the defect type options in the data grid columns
  // (specifically in the measurementsColumnsMeta definition) and for various other parts of the UI
  // where defect severity and types are displayed or selected. Accurate defect severity information
  // helps in validating defects and making informed decisions about their disposition.

  const fetchDefectSeverityTable = async () => {
    try {
      let table = await getDefectSeverity();
      if (table != null) {
        setDefectSeverityTable(table);
        console.log("defectSeverityTable:", table);

        let defectTypes = Object.keys(table);
        defectTypes.sort();
        setDefectTypeList(defectTypes);
        console.log("defectTypeList:", defectTypes);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // whole list of inspections
  const fetchInspectionList = async () => {
    try {
      const inspections = await getInspectionList();
      if (inspections != null) {
        setInspectionList(inspections);

        let idList = [];
        for (let inspection of inspections) {
          idList.push(inspection.id);
        }

        setInspectionIdList(idList);
        console.log("inspectionIdList:", idList);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // search for all individual measurements in the system
  // measurement here is a custom record representing a search result
  // includes validation status and optional original measurement id
  const fetchMeasurementList = async () => {
    try {
      // the search parameters are empty here because we are searching for all measurements in the system.
      // TODO: pass filter parameters here: esn, bladeSection, rootFaceDistance, validationStatus
      const esn = null;
      const bladeSection = null;
      const rootFaceDistance = null;
      const validationStatus = null;
      const measurements = await searchMeasurementList(
        esn,
        bladeSection,
        rootFaceDistance,
        validationStatus
      );

      if (measurements != null) {
        setMeasurementList([]);
        setMeasurementList(measurements);
        console.log("updated measurementList toto:", measurements);
        logState({ measurementList: measurements });

        let idList = [];
        for (let meas of measurements) {
          idList.push(meas.id);
        }

        setMeasurementIdList(idList);
        console.log("measurementIdList:", idList);

        if (measurements.length > 0) {
          // measurement.id here is the actual record id for a measurement (2d shapshot)
          setSelectedMeasurementId(measurements[0].id);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  // called after the component is created
  useEffect(() => {
    const fetchData = async () => {
      console.log("fetchData() called");
      await fetchDefectSeverityTable();
      await fetchInspectionList();
      await fetchMeasurementList();
    };

    fetchData();

    // no return function.
    // we could return a cleanup function here.
  }, []);

  const getCavityName = getMeasurementLocation;

  const formatDate = (date) => {
    console.log("formatDate:", date);
    if (date != null && date !== "") {
      //return dayjs(date).format('YYYY-MM-DD');
      return new Date(date).toISOString().split("T")[0];
    }
    return date;
  };

  // We use time here to force the reload of the image upon upload
  const getMeasurementUrl = (measurement_id, includeAnnotations = true) => {
    return `/api/measurement/${measurement_id}/image_file?includeAnnotations=${includeAnnotations}&ts=${currentImageTS}`;
  };

  // The original measurement is a backup copy of those that have been overwritten with validated annotations
  const getOriginalMeasurementUrl = (
    measurement_id,
    includeAnnotations = true
  ) => {
    return `/api/measurement/${measurement_id}/image_file?includeOriginalAnnotations=${includeAnnotations}&ts=${originalImageTS}`;
  };

  // We use timestamp parameter here to force the reload of the image upon upload
  const getValidatedMeasurementUrl = (
    measurement_id,
    includeAnnotations = true
  ) => {
    return `/api/measurement/${measurement_id}/image_file?includeValidatedAnnotations=${includeAnnotations}&ts=${validatedImageTS}`;
  };

  // configure table columns
  const measurementsColumnsMeta = [
    {
      field: "measurement_id",
      headerName: "Measurement ID",
      width: 150,
      editable: false,
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
        />
      ),
    },

    {
      field: "image_distance",
      headerName: "Distance From Root",
      type: "number",
      width: 200,
      editable: false,
      valueGetter: (params) => {
        let distance = params.row.image_distance;
        // console.log("distance ===", params.row);
        if (distance != null) distance = Math.round(distance * 10) / 10;
        return distance;
      },
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
          textFieldStyles={textFieldStyles}
        />
      ),
    },

    {
      field: "inspection_upload_date",
      headerName: "Upload Date",
      type: "date",
      width: 150,
      editable: false,
      valueGetter: (params) => {
        let upload_date = params.row.inspection_upload_date;
        if (upload_date != null) return new Date(upload_date);
        else return null;
      },
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
        />
      ),
    },
    {
      field: "inspection_sso",
      headerName: "Inspector ID",
      width: 150,
      editable: false,
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
        />
      ),
    },
    {
      field: "inspection_blade_type",
      headerName: "Blade Type",
      width: 150,
      editable: false,
      type: "singleSelect",
      valueOptions: defectTypeList,
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
        />
      ),
    },
    {
      field: "inspection_sect",
      headerName: "Blade Cavity",
      width: 150,
      editable: false,
      valueGetter: (params) => {
        return getCavityName(params.row.inspection_sect);
      },
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
        />
      ),
    },
    {
      field: "measurement_finding_type",
      headerName: "Defect Type",
      width: 150,
      editable: false,
      type: "singleSelect",
      valueOptions: defectTypeList,
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
        />
      ),
    },
    {
      field: "validation_labels",
      headerName: "Validated Defect Type",
      width: 150,
      editable: false,
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
        />
      ),
    },
    {
      field: "measurement_disposition",
      headerName: "Disposition",
      editable: false,
      type: "singleSelect",
      valueOptions: defectDispositionOptions,
      width: 150,
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
        />
      ),
    },
    {
      field: "validation_timestamp",
      headerName: "Validation Date",
      type: "date",
      width: 150,
      editable: false,
      valueGetter: (params) => {
        let validation_date = params.row.validation_timestamp;
        if (validation_date != null) return new Date(validation_date);
        else return null;
      },
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
        />
      ),
    },
    {
      field: "validated_by",
      headerName: "Validated By",
      width: 150,
      editable: false,
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
        />
      ),
    },
    {
      field: "validation_status",
      headerName: "Validation Status",
      width: 150,
      editable: false,
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
        />
      ),
    },
  ];

  // in case more than one id is selected at a time
  const rowsSelected = (indexList) => {
    setSelectedIdList(indexList);
    console.log("selectedIndices:", selectedIdList);
  };

  // We don't need this anymore, just have to return the new row as shown below
  const apiRef = useGridApiRef();

  // called when the user updates one or more row props
  // we use this to perform validation and enforce rules
  const handleProcessRowUpdate = async (updatedRow, originalRow) => {
    console.log("handleProcessRowUpdate() called.");
    console.log("originalRow:", originalRow);
    console.log("updatedRow:", updatedRow);

    return updatedRow;
  };

  const handleProcessRowUpdateError = () => {
    console.log("handleProcessRowUpdateError() called.");
  };

  // This function, `handleDownloadFilteredData`, is designed to download the filtered data
  // that is currently displayed in the DataGrid. When the user clicks the corresponding
  // button, this function is triggered. It iterates through all rows of the DataGrid, regardless
  // of pagination, to collect the IDs of the rows that match the current filters. These IDs represent the measurements
  // that need to be downloaded. If there are any such IDs, the function calls
  // `downloadValidatedMeasurementFilesAndAnnotations` with the list of filtered IDs to initiate the
  // download process. If no measurements are found in the filtered data, it alerts the user
  // with a message indicating that no measurements are available for download.
  const handleDownloadFilteredImages = async () => {
    console.log("handleDownloadFilteredImages() called.");
    setLoading(true); // Show spinner

    // Access the visible rows from the state
    const filteredRowsLookup = apiRef.current.state.filter.filteredRowsLookup;
    console.log("filteredRowsLookup = ", filteredRowsLookup);
    let filteredIds = [];

    // Iterate over the visible rows to collect their IDs
    for (const id in filteredRowsLookup) {
      if (filteredRowsLookup[id]) {
        const row = apiRef.current.getRow(id); // Retrieve the row data
        filteredIds.push(parseInt(id, 10)); // Ensure the correct field is used for ID
        console.log(`Row ID: ${id}, Measurement ID: ${row.defect_id}`);
      }
    }

    console.log("Filtered measurement idList:", filteredIds);
    if (filteredIds.length > 0) {
      await downloadValidatedMeasurementFilesAndAnnotationsAsync(filteredIds);
    } else {
      alert("No measurements found in the filtered data.");
    }
    setLoading(false); // Hide spinner when done
  };

  // when the user selects a row
  // The `handleRowClick` function is executed when a row in the DataGrid is selected. It logs the clicked row's parameters
  // and updates the state with the selected measurement ID. The function then fetches the measurement data for the selected
  // row's ID using `getMeasurement` and updates the `measurementData` state. Following this, it retrieves the associated
  // image data using `getImage` and updates the `imageData` state. Next, it fetches the inspection data related to the image
  // with `getInspectionById` and updates the `inspectionData` state. Finally, the function checks the validation status of
  // the selected row and updates the `validationStatus` state accordingly, ensuring it is set to a valid status or defaulting
  // to `NOT_VALIDATED` if the status is null or invalid. toto

  const handleRowClick = async (params) => {
    console.log(`handleRowClick() called with:`, params);
    setSelectedMeasurementId(params.row.id);
    logState({ selectedMeasurementId: params.row.id });

    let measurement = await getMeasurement(params.row.id);
    setMeasurementData(measurement);
    logState({ measurementData: measurement });

    let imageId = measurement.image_id;
    let image = await getImage(imageId);
    setImageData(image);
    logState({ imageData: image });

    let inspectionId = image.inspection_id;
    let inspection = await getInspectionById(inspectionId);
    setInspectionData(inspection);
    logState({ inspectionData: inspection });

    // We already know the status since it comes as part of the list of measurements in fetchMeasurementsList
    let status = params.row.validation_status;
    if (
      status != null &&
      (status === VALIDATION_AS_IS ||
        status === VALIDATION_REJECT ||
        status === VALIDATION_REVIEW)
    ) {
      setValidationStatus(status);
      logState({ validationStatus: status });
    } else {
      setValidationStatus(NOT_VALIDATED);
      logState({ validationStatus: NOT_VALIDATED });
    }
    await computeDoShowOriginal();
  };

  // --------------------------- Annotation Review Actions ------------------------

  // Look into the annotation file content for its image name and replace it with .json ext.
  const getAnnotationFilename = (annotationFileContent) => {
    let annoFilename = "unknown.json";
    if (
      annotationFileContent != null &&
      annotationFileContent["imagePath"] != null
    ) {
      annoFilename = annotationFileContent["imagePath"]
        .replace(".png", ".json")
        .replace(".jpg", ".json")
        .replace(".jpeg", ".json");
    }

    if (!annoFilename.endsWith(".json")) annoFilename += ".json";
    return annoFilename;
  };

  // When clicking on the list of validation options.
  const handleValidationStatusChange = async (event, newValidationStatus) => {
    console.log("handleValidationStatusChange() called new");
    console.log("Setting validationStatus to:", newValidationStatus);

    setValidationStatus(newValidationStatus);
    logState({ validationStatus: newValidationStatus });

    let existingAnnotationFileContent = await getMeasurementAnnotationFile(
      measurementData.id
    );
    let validationInfo_ = {};

    let annoFilename = getAnnotationFilename(existingAnnotationFileContent);
    let validationTimestamp = new Date().toDateString();

    console.log("Generated annotation filename:", annoFilename);
    console.log("Generated validation timestamp:", validationTimestamp);

    let isDataUpdated = false;
    // copy the existing annotation file content into the validated_annotation_file table
    console.log("Checking if new validation status is 'As Is' or 'Review'");
    if (
      newValidationStatus === VALIDATION_AS_IS ||
      newValidationStatus === VALIDATION_REVIEW
    ) {
      console.log("New validation status is 'As Is' or 'Review'");
      console.log("Checking if existing annotation content is valid");
      // The API responds with a message and the system may think it is the annotation, so we
      // verify for correct content. If content is a not found message, we use an empty annotation.
      if (
        existingAnnotationFileContent["version"] == null ||
        existingAnnotationFileContent["shapes"] == null
      ) {
        console.log(
          "Existing annotation content is invalid, using EMPTY_ANNOTATION"
        );
        existingAnnotationFileContent = Object.assign({}, EMPTY_ANNOTATION);
      }

      console.log(
        "Updating annotation content with new validation status, validator, and timestamp existingAnnotationFileContent = ",
        existingAnnotationFileContent
      );
      existingAnnotationFileContent["validationStatus"] = newValidationStatus;
      existingAnnotationFileContent["validatedBy"] = loggedUser;
      existingAnnotationFileContent["validationTimestamp"] =
        validationTimestamp;

      // populate validationInfo_ which we will transfer to canvas in case we do a review,
      // so Arpit can retreive in teh json file the fov pitch and yaw
      validationInfo_["validationStatus"] = newValidationStatus;
      validationInfo_["validatedBy"] = loggedUser;
      validationInfo_["validationTimestamp"] = validationTimestamp;
      validationInfo_["imageHfov"] = measurementData["image_hfov"];
      validationInfo_["imagePitch"] = measurementData["image_pitch"];
      validationInfo_["imageYaw"] = measurementData["image_yaw"];
      console.log("validationInfo = ", validationInfo_, measurementData);

      validationInfo_["imageHfov"] =
        measurementData["image_hfov"] != null
          ? measurementData["image_hfov"]
          : existingAnnotationFileContent["imageHfov"];

      validationInfo_["imagePitch"] =
        measurementData["image_pitch"] != null
          ? measurementData["image_pitch"]
          : existingAnnotationFileContent["imagePitch"];

      validationInfo_["imageYaw"] =
        measurementData["image_yaw"] != null
          ? measurementData["image_yaw"]
          : existingAnnotationFileContent["imageYaw"];

      validationInfo_["imageYfov"] =
        measurementData["image_yfov"] != null
          ? measurementData["image_yfov"]
          : existingAnnotationFileContent["imageYfov"];

      if (
        existingAnnotationFileContent["imageYfov"] == null &&
        measurementData["image_yfov"] != null
      )
        existingAnnotationFileContent["imageYfov"] =
          measurementData["image_yfov"];

      if (
        existingAnnotationFileContent["imageHfov"] == null &&
        measurementData["image_hfov"] != null
      )
        existingAnnotationFileContent["imageHfov"] =
          measurementData["image_hfov"];

      if (
        existingAnnotationFileContent["imagePitch"] == null &&
        measurementData["image_pitch"] != null
      )
        existingAnnotationFileContent["imagePitch"] =
          measurementData["image_pitch"];
      console.log(
        "existingAnnotationFileContent = ",
        existingAnnotationFileContent
      );

      if (
        existingAnnotationFileContent["imageYaw"] == null &&
        measurementData["image_yaw"] != null
      )
        existingAnnotationFileContent["imageYaw"] =
          measurementData["image_yaw"];

      console.log(
        "existingAnnotationFileContent = ",
        existingAnnotationFileContent
      );

      setValidationInfo(validationInfo_);

      console.log("Creating new annotation file with updated content");
      console.log(
        "existingAnnotationFileContent = ",
        existingAnnotationFileContent,
        measurementData
      );
      let annoFile = new File(
        [JSON.stringify(existingAnnotationFileContent)],
        annoFilename,
        { type: "application/json", lastModified: new Date() }
      );

      // Copy the existing annotation to a new validation record
      let resp = uploadValidatedAnnotationMeasurementFile(
        measurementData.id,
        newValidationStatus,
        loggedUser,
        validationTimestamp,
        annoFile
      );
      console.log(`Saved ${newValidationStatus} validated annotation:`, resp);
      isDataUpdated = true;
      // rejects are saved as empty annotation files
    } else if (newValidationStatus === VALIDATION_REJECT) {
      console.log("New validation status is 'Reject'");
      console.log("Creating new annotation file content for rejection");

      let newAnnotationFileContent = Object.assign({}, EMPTY_ANNOTATION);
      newAnnotationFileContent["imageWidth"] =
        existingAnnotationFileContent["imageWidth"];
      newAnnotationFileContent["imageHeight"] =
        existingAnnotationFileContent["imageHeight"];
      newAnnotationFileContent["imagePath"] =
        existingAnnotationFileContent["imagePath"];

      newAnnotationFileContent["validationStatus"] = newValidationStatus;
      newAnnotationFileContent["validatedBy"] = loggedUser;
      newAnnotationFileContent["validationTimestamp"] = validationTimestamp;

      console.log(
        "Creating new annotation file with updated content for rejection"
      );
      let annoFile = new File(
        [JSON.stringify(newAnnotationFileContent)],
        annoFilename,
        { type: "application/json", lastModified: new Date() }
      );

      console.log("Uploading rejected annotation measurement file");
      let resp = await uploadValidatedAnnotationMeasurementFile(
        measurementData.id,
        newValidationStatus,
        loggedUser,
        validationTimestamp,
        annoFile
      );
      console.log(`Saved ${newValidationStatus} validated annotation:`, resp);
      logState({ validatedAnnotation: resp });
      isDataUpdated = true;
    }

    if (isDataUpdated === true) {
      let newMeasurementList = [...measurementList];

      for (let i = 0; i < newMeasurementList.length; i++) {
        let measurement = newMeasurementList[i];
        if (measurement.id === measurementData.id) {
          measurement["validation_status"] = newValidationStatus;
          measurement["validation_timestamp"] = validationTimestamp;
          measurement["validated_by"] = loggedUser;

          setMeasurementData(measurement);
          logState({ measurementData: measurement });
        }
      }

      console.log("Updating measurementList with new validation status");
      setMeasurementList(newMeasurementList);

      updateValidatedImage();
      //updateOriginalImage();
    }
  };

  const getValidatedMeasurementIdList = () => {
    let idList = [];
    for (let measurement of measurementList) {
      if (VALIDATED_OPTIONS_LIST.includes(measurement.validation_status)) {
        idList.push(measurement.id);
      }
    }
    console.log("Validated measurement idList:", idList);
    return idList;
  };

  // Effectively updates the validated image when the annotation component modifies it on the DB
  const onAnnotationEditorUpdate = () => {
    console.log("onAnnotationEditorUpdate() called");
    updateValidatedImage();
  };

  const updateValidatedImage = () => {
    console.log("Updating validated image timestamp");
    setValidatedImageTS(new Date().getTime());
  };

  const updateOriginalImage = async () => {
    let doShow = await computeDoShowOriginal();
    if (doShow) setOriginalImageTS(new Date().getTime());
  };

  const updateCurrentImage = () => {
    setCurrentImageTS(new Date().getTime());
  };

  const logState = async (state) => {
    console.log("Logging state:", state);
    // if (DEBUG) {
    //   try {
    //     await axios.post("http://localhost:3001/log", state);
    //   } catch (error) {
    //     console.error("Error logging state:", error);
    //   }
    // }
  };

  // include only if original exists.
  const computeDoShowOriginal = async () => {
    let originalExists = false;
    let originalRecMeta = await getMeasurementOriginalAnnotationFileMetadata(
      selectedMeasurementId
    );
    if (originalRecMeta.id != null && originalRecMeta.id > 0) {
      originalExists = true;
    }
    console.log(`doShowOriginal?: ${originalExists}`);
    setDoShowOriginal(originalExists);
    return originalExists;
  };

  /**
   * Creates a backup of measurement_annotation_file as an original_measurement_annotation_file and
   * Copies the validated file content over the current measurement_annotation_file record.
   */
  const handleReplaceCurrentAnnotationFile = async () => {
    console.log("handleUpdateCurrentAnnotationFile() called");

    // -------------- current content
    let currentAnnotationFileContent = await getMeasurementAnnotationFile(
      measurementData.id
    );

    if (
      currentAnnotationFileContent["version"] == null ||
      currentAnnotationFileContent["shapes"] == null
    ) {
      currentAnnotationFileContent = Object.assign({}, EMPTY_ANNOTATION);
    }

    let originalRecMeta = await getMeasurementOriginalAnnotationFileMetadata(
      measurementData.id
    );
    let originalRecId = originalRecMeta.id;
    let replacedTimestamp = originalRecMeta["replaced_timestamp"];

    // backup the current measurement annotation file into a new original record
    // if it was not backed up yet
    if (originalRecId == null || originalRecId < 0) {
      let annoFilename = getAnnotationFilename(currentAnnotationFileContent);

      currentAnnotationFileContent["replacedBy"] = loggedUser;
      currentAnnotationFileContent["replacedTimestamp"] = replacedTimestamp;

      let annoFile = new File(
        [JSON.stringify(currentAnnotationFileContent)],
        annoFilename,
        { type: "application/json", lastModified: new Date() }
      );

      replacedTimestamp = new Date().toDateString();
      let uploadOriginalResp = await uploadOriginalAnnotationMeasurementFile(
        measurementData.id,
        loggedUser,
        replacedTimestamp,
        annoFile
      );
      console.log(
        `Backed up current annotation content to a new original annotation file record.`
      );
      console.log(`resp: `, uploadOriginalResp);
      logState({ resp: uploadOriginalResp });
      originalRecId = uploadOriginalResp.id;
    } else {
      console.log(
        `Nothing to backup. Original record id# ${originalRecId} already exists.`
      );
    }

    // ------------------- validated content
    let validatedAnnotationFileContent =
      await getMeasurementValidatedAnnotationFile(measurementData.id);
    if (
      validatedAnnotationFileContent["version"] == null ||
      validatedAnnotationFileContent["shapes"] == null
    ) {
      validatedAnnotationFileContent = Object.assign({}, EMPTY_ANNOTATION);
    }

    validatedAnnotationFileContent["replacedBy"] = loggedUser;
    validatedAnnotationFileContent["replacedTimestamp"] = replacedTimestamp;

    let validatedAnnoFilename = getAnnotationFilename(
      validatedAnnotationFileContent
    );
    let validatedAnnoFile = new File(
      [JSON.stringify(validatedAnnotationFileContent)],
      validatedAnnoFilename,
      { type: "application/json", lastModified: new Date() }
    );

    let uploadResp = await uploadAnnotationMeasurementFile(
      measurementData.id,
      validatedAnnoFile
    );
    console.log(
      `Overwrite current annotation file with the validated content resp: `,
      uploadResp
    );

    if (originalRecId > 0) {
      // find and update measurement in list
      let newMeasurementList = [...measurementList];
      for (let i = 0; i < newMeasurementList.length; i++) {
        let measurement = newMeasurementList[i];
        if (measurement.id === measurementData.id) {
          measurement["original_measurement_annotation_file_id"] =
            originalRecId;
          measurement["original_replaced_timestamp"] = replacedTimestamp;
          measurement["original_replaced_by"] = loggedUser;

          setMeasurementData(measurement);
          break;
        }
      }
      console.log("Updating measurementList...");
      setMeasurementList(newMeasurementList);

      updateCurrentImage();
      updateOriginalImage();
    } else {
      console.log("Nothing to do. original_annotation_file rec not created.");
    }
  };

  // --------------------------------- Page layout ---------------------------------------
  return (
    <div className="defectvalidation">
      <div style={{ fontSize: 25, paddingTop: 20, paddingBottom: 20 }}>
        <NavigateBeforeOutlinedIcon
          onClick={() => navigate(-1)}
          style={{ display: "grid", alignItems: "center", fontSize: 30 }}
        />
        Defect Validation <br />
      </div>
      {/* <Grid container direction="row" spacing={1} justifyContent="space-between">
             Search bar: inspection_upload_date, esn, defect type, blade type, inspector
      </Grid> */}
      {/* Download Validated Data */}
      <Grid
        container
        direction="row"
        spacing={1}
        justifyContent="space-between"
      >
        <Button
          style={{
            backgroundColor: "darkslategray",
            color: "white",
            marginLeft: 10,
            marginBottom:5,
          }}
          onClick={() =>
            downloadValidatedMeasurementFilesAndAnnotationsAsync(
              getValidatedMeasurementIdList()
            )
          }
        >
          <FileDownloadIcon /> Download validated images
        </Button>
        <Button
          style={{
            backgroundColor: "darkslategray",
            color: "white",
            marginLeft: 10,
            marginBottom:5,
          }}
          onClick={handleDownloadFilteredImages}
        >
          <FileDownloadIcon /> Download filtered images
        </Button>
      </Grid>
      {/*       // The following code section renders a DataGrid within a Suspense component to handle lazy loading and display a fallback
        // loading component (`<Loading />`) while the data is being fetched. A LinearProgress bar is conditionally rendered at the 
        // top of the DataGrid based on the `showProgressBar` state. The DataGrid itself is configured to display the measurement 
        // data (`measurementList`) with columns defined by `measurementsColumnsMeta`. It supports row editing, pagination, and 
        // row selection. The `handleRowClick` function is triggered when a row is clicked to update the selected measurement data. 
        // The `rowsSelected` function updates the list of selected rows. Row updates are processed and validated by the 
        // `handleProcessRowUpdate` function, and errors in row updates are handled by the `handleProcessRowUpdateError` function. */}
      {/* Spinner display */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
          <CircularProgress size={160} />
        </Box>
      )}
      <Suspense fallback={<Loading />}>
        <Box sx={{ width: "100%" }}>
          {showProgressBar && <LinearProgress />}
        </Box>
        <Box sx={{ height: "40vh", width: "100%" }}>
          <DataGrid
            apiRef={apiRef}
            editMode="row"
            rows={filteredRows}
            // getRowHeight={() => 'auto'} //https://mui.com/x/react-data-grid/row-height/
            columns={measurementsColumnsMeta}
            sx={{
              "& .MuiDataGrid-columnHeader:focus-within .MuiDataGrid-menuIconButton":
                {
                  display: "none",
                },
              "& .MuiDataGrid-columnHeader .MuiDataGrid-menuIconButton": {
                display: "none",
              },
              "& .MuiDataGrid-columnHeader:hover .MuiDataGrid-menuIcon": {
                display: "none", // Hide the menu icon on hover
              },
              "& .MuiDataGrid-columnHeader .MuiDataGrid-columnHeaderTitleContainer:after":
                {
                  display: "none", // Hide the arrow icon
                },
              "& .MuiDataGrid-sortIcon": {
                display: "none", // Hide the sort icon
              },
              "& .MuiDataGrid-columnHeaders": {
                minHeight: "180px !important",
                height: "180px !important",
                maxHeight: "180px !important",
                lineHeight: "normal !important",
              },
              "& .MuiDataGrid-columnHeadersInner": {
                minHeight: "180px !important",
                height: "180px !important",
              },
              "& .MuiDataGrid-columnHeaderRow": {
                minHeight: "180px !important",
              },
              "& .MuiDataGrid-columnHeader--sortable": {
                minHeight: "180px !important",
              },
              "& .MuiDataGrid-columnHeader": {
                minHeight: "180px !important",
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                whiteSpace: "normal !important",
                overflow: "visible !important",
              },
              "& .MuiDataGrid-cell": {
                padding: "8px 16px",
              },
              "& .MuiDataGrid-row": {
                maxHeight: "none",
              },
              "& .MuiInputBase-root": {
                height: "40px",
              },
              "& .MuiOutlinedInput-input": {
                padding: "10px",
              },
            }}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 8,
                },
              },
            }}
            onRowClick={handleRowClick}
            onRowSelectionModelChange={rowsSelected}
            pageSizeOptions={[5]}
            processRowUpdate={handleProcessRowUpdate}
            onProcessRowUpdateError={handleProcessRowUpdateError}
          />
        </Box>
      </Suspense>
      {measurementData == null && (
        <Box sx={{ marginTop: 10, textAlign: "center" }}>
          <Typography>
            {" "}
            Select a defect from the list to start validation{" "}
          </Typography>
        </Box>
      )}
      {measurementData != null && (
        <Grid
          container
          direction="row"
          spacing={2}
          justifyContent="space-between"
          alignItems="center"
        >
          <Grid item direction="column" xs={5} alignItems="center">
            <Box sx={{ textAlign: "center" }}>
              {" "}
              <strong> Current </strong>{" "}
            </Box>
            <img
              align="center"
              width="100%"
              maxWidth="600"
              height="auto"
              src={getMeasurementUrl(selectedMeasurementId)}
              alt={`measurement image id# ${selectedMeasurementId}`}
              onError={() => {
                console.log("Image Load Error");
              }}
              onLoad={() => {
                console.log("Image Loaded");
              }}
            />
          </Grid>
          {/* This Grid item contains a column layout for the validation status controls. 
              It includes a Box component with a centered title "Validation Status" and 
              a ToggleButtonGroup for selecting the validation status of the selected measurement. 
              The ToggleButtonGroup has four buttons: NOT_VALIDATED, VALIDATION_AS_IS, 
              VALIDATION_REVIEW, and VALIDATION_REJECT. The buttons are vertically oriented 
              and exclusive, meaning only one can be selected at a time. The onChange event 
              of the ToggleButtonGroup triggers the handleValidationStatusChange function, 
              updating the validation status state. The NOT_VALIDATED button is disabled if 
              the current validation status is one of the validated options. */}
          <Grid
            item
            container
            direction="column"
            // justifyContent="center"
            alignItems="center"
            xs={1}
          >
            <Box sx={{ textAlign: "center", marginBottom: 2 }}>
              <strong>Validation Status</strong>
            </Box>
            <ToggleButtonGroup
              orientation="vertical"
              value={validationStatus}
              exclusive
              onChange={handleValidationStatusChange}
            >
              <ToggleButton
                value={NOT_VALIDATED}
                aria-label="not_validated"
                disabled={VALIDATED_OPTIONS_LIST.includes(validationStatus)}
              >
                {NOT_VALIDATED}
              </ToggleButton>

              <ToggleButton value={VALIDATION_AS_IS} aria-label="as_is">
                {VALIDATION_AS_IS}
              </ToggleButton>
              <ToggleButton value={VALIDATION_REVIEW} aria-label="review">
                {VALIDATION_REVIEW}
              </ToggleButton>
              <ToggleButton value={VALIDATION_REJECT} aria-label="reject">
                {VALIDATION_REJECT}
              </ToggleButton>
            </ToggleButtonGroup>

            <Button
              sx={{ marginTop: 2 }}
              disabled={validationStatus !== VALIDATED_OPTIONS_LIST[1]}
              onClick={handleReplaceCurrentAnnotationFile}
            >
              Replace Current with Validated
            </Button>
          </Grid>

          <Grid item xs={5} alignItems="center">
            <Box sx={{ textAlign: "center" }}>
              {" "}
              <strong>Validated</strong>{" "}
            </Box>
            <img
              align="center"
              width="100%"
              maxWidth="600"
              height="auto"
              src={getValidatedMeasurementUrl(selectedMeasurementId)}
              alt={`measurement image id# ${selectedMeasurementId}`}
              onError={() => {
                console.log("Image Load Error");
              }}
              onLoad={() => {
                console.log("Image Loaded");
              }}
            />
          </Grid>

          {doShowOriginal && (
            <Grid item direction="column" xs={5} alignItems="center">
              <Box sx={{ textAlign: "center" }}>
                {" "}
                <strong> Original </strong>{" "}
              </Box>
              <img
                align="center"
                width="100%"
                maxWidth="600"
                height="auto"
                src={getOriginalMeasurementUrl(selectedMeasurementId)}
                alt={`measurement image id# ${selectedMeasurementId}`}
                onError={() => {
                  console.log("Image Load Error");
                }}
                onLoad={() => {
                  console.log("Image Loaded");
                }}
              />
            </Grid>
          )}
        </Grid>
      )}
      {/**
       * This section of the code renders a Grid container that is centered and takes up the full width (xs={12}).
       * It uses padding and margin-top for spacing. Inside this container, it conditionally renders another Grid item
       * if the validation status is "Review". The inner Grid item centers its content and contains the
       * ValidatedCanvasBodyWrapper component. This component is responsible for displaying and handling the validated
       * annotation review process. It receives several props:
       * - `panorama_image_data` which contains data about the image,
       * - `inspectionId` which is the ID of the current inspection,
       * - `measurementDefect` which contains the defect data of the measurement,
       * - `defectId` which is the ID of the current defect,
       * - `onUpdate` which is a callback function that updates the annotation editor.
       *
       * This setup ensures that the validation process can be reviewed and updated when the validation status is set to "Review".
       */}
      <Grid
        container
        xs={12}
        direction="row"
        justifyContent="center"
        alignItems="center"
        sx={{ pading: 2, marginTop: 5 }}
      >
        {validationStatus === "Review" && (
          <Grid item alignItems="center">
            <ValidatedCanvasBodyWrapper
              panorama_image_data={imageData}
              inspectionId={inspectionData?.id}
              measurementDefect={measurementData}
              defectId={measurementData?.id}
              onUpdate={onAnnotationEditorUpdate}
              validationInfo={validationInfo}
            ></ValidatedCanvasBodyWrapper>
          </Grid>
        )}
      </Grid>
    </div>
  );
}

export default DefectValidationPage;
