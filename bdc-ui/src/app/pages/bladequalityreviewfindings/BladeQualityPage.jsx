// Import necessary hooks and components from React and Material-UI libraries
import { useGridApiRef } from "@mui/x-data-grid"; // For using API methods in DataGrid
import "./BladeQualityPage.css"; // Import CSS for the page styling
import CustomColumnHeader from "../../components/Filter/CustomColumnHeader"; // Custom column header component for filtering
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { useEffect, useState, Suspense, Fragment } from "react"; // React hooks and components
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
  TextField,
  DialogContent,
  DialogTitle,
  Dialog,
  DialogActions,
  Checkbox,
  FormControlLabel,
} from "@mui/material"; // Material-UI components for UI design
import { useSearchParams } from "react-router-dom"; // For handling URL query parameters

import LinearProgressWithLabel from "../../components/LinearProgressWithLabel";
import Bottleneck from "bottleneck";
import { showDirectoryPicker } from "https://cdn.jsdelivr.net/npm/file-system-access/lib/es2018.js"; // For file system access (web API)

import { useNavigate,useLocation } from "react-router-dom"; // For navigation between pages
import Loading from "../../components/Loading"; // Loading component for suspense fallback
import React from "react"; // React library

import DrawOutlinedIcon from "@mui/icons-material/DrawOutlined"; // Icon for drawing
import GridOnOutlinedIcon from "@mui/icons-material/GridOnOutlined"; // Icon for grid view
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined"; // Icon for AR view
import NavigateBeforeOutlinedIcon from "@mui/icons-material/NavigateBeforeOutlined"; // Icon for back navigation
import CardMembershipIcon from "@mui/icons-material/CardMembership"; // Icon for membership card
import GpsFixedIcon from "@mui/icons-material/GpsFixed"; // Icon for GPS fixed position
import useFilters from "../../components/Filter/useFilters2"; // Custom hook for handling filters
import InputLabel from "@mui/material/InputLabel";
import FilterAltIcon from "@mui/icons-material/FilterAlt";

import Accordion from "@mui/material/Accordion";
import AccordionActions from "@mui/material/AccordionActions";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { jsonrepair } from "jsonrepair"; // Library for repairing JSON strings
import {
  deleteInspection,
  getInspectionDefectList,
  getInspectionImageDistances,
  getInspectionImageList,
  getInspectionList,
  getInspectionMeasurementList,
  updateInspection,
} from "../../services/inspection_api"; // API services for inspection data

import {
  createMeasurement,
  emptyMeasurement,
  getDefectSeverity,
  updateMeasurement,
} from "../../services/measurement_api"; // API services for measurement data
import dayjs from "dayjs"; // Library for date manipulation
import {
  createCertificate,
  deleteCertificate,
  getCertificateById,
} from "../../services/certificate_api"; // API services for certificate data
import { getCurrentUser } from "../../services/login_api"; // API service for login data

import BladeQualityTable from "./BladeQualityTable"; // Blade quality table component
import {
  createDefect,
  emptyDefect,
  updateDefect,
} from "../../services/defect_api";

import { BLADE_CAVITIES, DEFECT_DISPOSITION_OPTIONS } from "../../config";
import { getMeasurementLocation } from "../../utils/utils";

const getCavityName = getMeasurementLocation;

function BladeQualityPage() {
  // Function to check if an object is empty
  const isEmptyObject = (obj) => {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  };

  const [searchParams] = useSearchParams();
  const pageEsn = searchParams.get("esn");
  const location = useLocation();
  const previousRoute = location.state?.from;

  // Initial filter configuration
  const initialFilters = {
    defect_id: { value: "", type: "contains" },
    root_face_distance: { value: "", type: "is not empty" },
    finding_type: { value: "", type: "contains" },
    location: { value: "", type: "contains" },
    failure_prob: { value: "", type: "contains" },
    manufacture_stage: { value: "", type: "contains" },
    ge_disposition: { value: "", type: "contains" },
    status: { value: "", type: "contains" },
    repair_date: { value: "", type: "contains" },
    repair_report_id: { value: "", type: "contains" },
    repair_approved_by: { value: "", type: "contains" },
    is_manual: { value: "all", type: "manual_filter" },
    area: { value: "", type: "less than" },
    width: { value: "", type: "less than" },
    length: { value: "", type: "less than" },
  };

  // Using the custom hook to manage filters
  const [filters, handleFilterChange, clearFilters, setFilters, applyFilters] =
    useFilters(initialFilters, "BladeQualityNewFilters");

  // The following state variables manage the functionality of the "Undo" button, allowing the user to reverse the
  // last action performed by the "Apply Disposition" button. When "Apply Disposition" is clicked, it applies the
  // chosen disposition to a list of defects and saves a snapshot of these defect states in the `undoData` variable,
  // allowing for a one-time reversal. At this point, `isUndoActive` is set to `true`, enabling the "Undo" button.
  // The `undo` function, when triggered, restores each defect to its previous state using the data saved in `undoData`,
  // deactivates the undo option by setting `isUndoActive` to `false`, and clears `undoData` to prevent repeated undo actions.
  // This setup ensures that the "Undo" button only appears and functions immediately after an "Apply Disposition" action,
  // allowing the user a single opportunity to revert their last disposition change.
  const [undoData, setUndoData] = useState(null);
  const [isUndoActive, setIsUndoActive] = useState(false);

  // States to manage the number of open and closed defects
  const [openDefectCount, setOpenDefectCount] = useState(0);
  const [closedDefectCount, setClosedDefectCount] = useState(0);

  // Various state variables to manage inspection data, images, measurements, and UI elements
  const [inspectionList, setInspectionList] = useState([]);
  const [imageList, setImageList] = useState([]);
  const [defectList, setDefectList] = useState([]);
  const [selectedIdList, setSelectedIdList] = useState([]);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [defectSeverityTable, setDefectSeverityTable] = useState({});
  const [defectTypeList, setDefectTypeList] = useState([]);

  const [newMeasurementDistance, setNewDefectDistance] = useState(0.0);
  const [newMeasurementImage, setNewDefectImage] = useState({});

  const [newDefectDistanceOptions, setNewDefectDistanceOptions] = useState([]);

  // Blade cavity options for dropdown
  const bladeCavities = BLADE_CAVITIES;

  // the options vary according to the existing inspections so it is a state var.
  const [bladeCavityOptions, setBladeCavityOptions] = useState(bladeCavities);
  const [newDefectCavity, setNewDefectCavity] = useState(bladeCavities[0]);

  // Status and disposition options for dropdown
  const statusOptions = ["Open", "Closed"];
  const defectDispositionOptions = [
    DEFECT_DISPOSITION_OPTIONS[0],
    DEFECT_DISPOSITION_OPTIONS[1],
  ];

  const [openStatus, setOpenStatus] = useState(true);

  const [completeStatus, setCompleteStatus] = useState(false);
 
  const [certificate, setCertificate] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);

  const [showOpenAIFindings, setShowOpenAIFindings] = useState(true);

  // -------------------------- Bulk review control ------------------------

  const defaultBulkDefectTypeOptions = ["CoreGap", "Dust & dirt"];
  const defaultBulkRepairDefectTypeOptions = ["Dust & dirt"];

  const [bulkDisposition, setBulkDisposition] = useState(
    defectDispositionOptions[1]
  );
  const [bulkDefectType, setBulkDefectType] = useState(
    defaultBulkDefectTypeOptions[0]
  );
  const [bulkRepairDefectType, setBulkRepairDefectType] = useState(
    defaultBulkRepairDefectTypeOptions[0]
  );

  const [bulkRepairApprovedBy, setBulkRepairApprovedBy] = useState("");
  const [bulkRepairReportId, setBulkRepairReportId] = useState("");
  const [bulkRepairDescription, setBulkRepairDescription] = useState("");

  // these options will change during initialization
  const [bulkDefectTypeOptions, setBulkDefectTypeOptions] = useState(
    defaultBulkDefectTypeOptions
  );
  const [bulkRepairDefectTypeOptions, setBulkRepairDefectTypeOptions] =
    useState(defaultBulkRepairDefectTypeOptions);

  // based on dynamic bladeCavityOptions, which itself is based on existing inspections
  const [bulkCavity, setBulkCavity] = useState(bladeCavityOptions[0]);
  const [bulkRepairCavity, setBulkRepairCavity] = useState(
    bladeCavityOptions[0]
  );

  const toleranceOptions = [
    0, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  ];
  const [bulkTolerance, setBulkTolerance] = useState(toleranceOptions[5]); // 10mm

  const measurementPropOptions = ["width", "length"];
  const [bulkMeasurementProp, setBulkMeasurementProp] = useState(
    measurementPropOptions[0]
  );

  const [doUseBulkTolerance, setDoUseBulkTolerance] = useState(true);
  const [dustSelected, setDustSelected] = useState(false);

  const [repairableDefects, setRepairableDefects] = useState([]);

  // --------------------------------------------------------------------------------

  const [updateProgress, setUpdateProgress] = useState(0);

  let processedDefectsList = [];

  const computeDefectUpdateProgress = (defect, total = defectList.length) => {
    processedDefectsList.push(defect);
    let progress = Math.round(100 * (processedDefectsList.length / total));
    setUpdateProgress(progress);
  };

  const resetProgressBar = () => {
    setUpdateProgress(0);
    processedDefectsList = [];
  };

  // -------------------------------------------------------------------------

  const navigate = useNavigate();

  // Retrieve logged-in user information from local storage
  const loggedUser = localStorage.getItem("loggedSSO");
  console.log("loggedUser:", loggedUser);

  // Function to add defect ID to each measurement
  const addDefectId = (inspection, measList) => {
    if (measList != null)
      for (let measurement of measList) {
        measurement["defect_id"] = inspection.esn + "-" + measurement.id;
      }
  };

  // Function to add missing location to each measurement
  const addMissingLocation = (inspection, measList) => {
    if (measList != null)
      for (let measurement of measList) {
        measurement["location"] = getCavityName(inspection.sect);
      }
  };

  // Function to add manufacture stage to each measurement
  const addManufactureStage = (inspection, measList) => {
    if (measList != null)
      for (let measurement of measList) {
        measurement["manufacture_stage"] = inspection.manufacture_stage;
      }
  };

  // Function to add missing distance to each measurement
  const addMissingDistance = (inspection, measList) => {
    if (measList != null)
      for (let measurement of measList) {
        if (measurement.root_face_distance === 0) {
          console.log("measurement has no root_face_distance:", measurement);
        }
      }
  };

  // Function to get probability of failure based on defect type
  const getProbabilityOfFailure = (defect_type) => {
    let prob = defectSeverityTable[defect_type];
    if (prob == null) prob = "N/A";
    return prob;
  };

  // Function to update a modified measurement record
  // Remember: measurement is a group of shapes can be of different defect type
  // we do not support modification of defects, only measurements.
  const updateModifiedMeasurement = async (id, payload) => {
    try {
      let data = await updateMeasurement(id, payload);
      console.log("updated measurement record:", data);
    } catch (err) {
      console.log(`error uploading measurement id: ${id}:`, err);
    }
  };

  // Function to fetch the defect severity table from the API
  const fetchDefectSeverityTable = async () => {
    try {
      let table = await getDefectSeverity();
      if (table != null) {
        setDefectSeverityTable(table);
        let defectTypes = Object.keys(table);
        defectTypes.sort();
        setDefectTypeList(defectTypes);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Function to get the list of cavities for the given inspections
  const getCavityListForInspections = (inspections) => {
    let cavList = [];

    for (let insp of inspections) {
      let sect = insp.sect;
      let cavity = getCavityName(sect);

      if (cavity !== "Unknown" && !cavList.includes(cavity)) {
        cavList.push(cavity);
      }
    }

    return cavList;
  };

  const filterAIDefects = (allInspectionDefects) => {
    if (!showOpenAIFindings) {
      let filteredDefects = [];
      for (let defect of allInspectionDefects) {
        if (defect.is_manual) {
          filteredDefects.push(defect);
        } else {
          // is AI
          if (defect.status === "Closed") {
            filteredDefects.push(defect);
          }
        }
      }
      return filteredDefects;
    }

    return allInspectionDefects;
  };

  const updateBulkDefectTypeOptions = (defList) => {
    let defectTypeOptionsList = getDefectTypeOptions(defList);
    console.log("set defectTypeOptions to:", defectTypeOptionsList);
    setBulkDefectTypeOptions(defectTypeOptionsList);
    setBulkDefectType(bulkDefectTypeOptions[0]);
  };


  const NUMBER_PARALLEL_CALLS = 3;
  let readDefectListLimiter = new Bottleneck({
    maxConcurrent: NUMBER_PARALLEL_CALLS,
  });

  // Function to build the page data for the given ESN
  // This function is responsible for fetching and organizing all the necessary data related to inspections and their measurements for a specific engine serial number (ESN).
  // It does so by first retrieving a list of inspections associated with the ESN. For each inspection, it checks if a certificate is associated with it and fetches it if not already present.
  // It then retrieves all measurements for each inspection and enriches these measurements with additional information such as defect ID, location, and manufacture stage.
  // These measurements are collected into a list, which is then sorted by root face distance. The function updates the state with the list of inspections and sorted measurements.
  // It also determines and sets the available blade cavity options based on the inspections' sections. Next, it retrieves the distances of inspection images and sets the initial cavity and distance options for new defects.
  // It fetches the list of images for the first inspection and sets the new defect image to the first image matching the selected distance. Finally, it computes the open status of the defects to determine if any are still open.
  // The function handles any errors that occur during the data fetching and processing steps.
  const buildPageData = async () => {
    try {
      const inspections = await getInspectionList(pageEsn);
      console.log("refz_inspections = ", inspections);
      if (inspections != null) {
        let defList = [];
        let callList = [];
        for (let inspection of inspections) {
          
          callList.push( readDefectListLimiter.schedule(
            async () => {
              if (certificate == null && inspection.certificate_id != null) {
                let cert = await getCertificateById(inspection.certificate_id);
                setCertificate(cert);
              }

              // return all defects, AI and manual
              let inspectionDefects = await getInspectionDefectList(
                inspection.id,
                true
              );

              inspectionDefects = filterAIDefects(inspectionDefects);

              if (inspectionDefects != null) {
                addDefectId(inspection, inspectionDefects);
                addMissingDistance(inspection, inspectionDefects);
                addMissingLocation(inspection, inspectionDefects);
                addManufactureStage(inspection, inspectionDefects);

                inspection["defects"] = inspectionDefects;
                defList = defList.concat(inspectionDefects);
              } else {
                inspection["defects"] = [];
              }
            })
          );
        }
        await Promise.all(callList);
        setInspectionList(inspections);

        defList.sort((a, b) => {
          let x = a["root_face_distance"];
          let y = b["root_face_distance"];
          return x < y ? -1 : x > y ? 1 : 0;
        });
        console.log("read defectList:", defList);
        setDefectList(defList);

        // provide only the defect types listed
        //updateBulkDefectTypeOptions(defList);

        let cavities = getCavityListForInspections(inspections);
        setBladeCavityOptions(cavities);

        let inspectionId = inspections[0].id;
        let distances = await getInspectionImageDistances(inspectionId);
        let cavName = getCavityName(inspections[0].sect);
        setNewDefectCavity(cavName);

        setNewDefectDistanceOptions(distances);
        let distance = distances[0];
        setNewDefectDistance(distance);

        let imgList = await getInspectionImageList(inspections[0].id);
        setImageList(imgList);

        for (let img of imgList) {
          if (img.distance === distance) {
            setNewDefectImage(img);
            break;
          }
        }

        computeOpenStatus(defList, null);
        computeCompleteStatus(inspections);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // useEffect hook to calculate the number of open and closed defects
  useEffect(() => {
    const openCount = defectList.filter((m) => m.status === "Open").length;
    const closedCount = defectList.filter(
      (m) => m.status === "Closed" || m.status === "Repaired"
    ).length;
    setOpenDefectCount(openCount);
    setClosedDefectCount(closedCount);
    countRepairableDefects(defectList);
  }, [defectList]);

  // useEffect hook to fetch data based on search parameters
  // it reacts to changes in searchParams and doIncludeAIFindingsInCertificate
  useEffect(() => {

    

    const fetchData = async () => {
      await fetchDefectSeverityTable();
      await buildPageData();
    };
    fetchData();

  }, [searchParams, showOpenAIFindings]);

  // Function to get the report URL for a given inspection ID
  const getReportUrl = (inspection_id) => {
    return `api/inspection/${inspection_id}/xls`;
  };

  // has to be open and out of tolerance and within the list of defects we support
  const countRepairableDefects = (defectList) => {
    let openList = [];
    for (let defect of defectList) {
      if (
        defect.status === "Open" &&
        defect.ge_disposition.toLowerCase().includes("out of")
      ) {
        for (let cavityOption of bulkRepairDefectTypeOptions) {
          if (cavityOption === defect.finding_type) {
            openList.push(defect);
          } else {
            console.log(
              "cavityOption: ",
              cavityOption,
              "does not match defect.finding_type:",
              defect.finding_type
            );
          }
        }
        //openList.push(defect);
      }
    }
    setRepairableDefects(openList);
  };

  const getDefectTypeOptions = (defList) => {
    console.log("getDefectTypeOptions called with:", defList);
    let optionsSet = new Set();
    for (let defect of defList) {
      optionsSet.add(defect["finding_type"]);
    }
    let options = Array.from(optionsSet);
    console.log("return options:", options);
    return options;
  };

  // Function to get the inspection for a given cavity
  const getInspectionForCavity = (cavity) => {
    for (let inspection of inspectionList) {
      let insCav = inspection.sect;
      let cavName = getCavityName(insCav);
      if (cavity === cavName) {
        return inspection;
      }
    }
    return null;
  };

  // Function to format date to ISO string
  const formatDate = (date) => {
    if (date != null && date !== "") {
      return new Date(date).toISOString().split("T")[0];
    }
    return date;
  };

  // Function to handle row selection in the table
  const rowsSelected = (indexList) => {
    setSelectedIdList(indexList);
  };

  // Function to delete selected rows
  const delSelected = async () => {
    setShowProgressBar(true);
    for (let id of selectedIdList) {
      let resp = await deleteInspection(id);
      buildPageData();
    }
    setShowProgressBar(false);
  };

  // Function to open the new defect dialog
  const newDefectDialog = async () => {
    setDialogOpen(true);
  };

  const bulkRepairDefects = async () => {
    console.log("bulkRepairDefects() called");

    console.log("bulkRepairDefectType:", bulkRepairDefectType);
    console.log("bulkRepairCavity:", bulkRepairCavity);
    console.log("bulkRepairReportId:", bulkRepairReportId);
    console.log("bulkRepairApprovedBy:", bulkRepairApprovedBy);
    console.log("bulkRepairDescription:", bulkRepairDescription);

    if (bulkRepairApprovedBy == "" || bulkRepairReportId == "") {
      alert("Both 'Report Id' and 'Approved By' fields are required.");
    }

    let repairDate = new Date();

    let selectedDefectList = [];
    let updatedDefectList = [];
    console.log("defecttt actually defectList = ", defectList);
    for (let defect of defectList) {
      console.log("defecttt:", defect);
      if (
        defect.status === "Open" &&
        defect.location === bulkRepairCavity &&
        defect.finding_type === bulkRepairDefectType
      ) {
        if (defect.ge_disposition.toLowerCase().includes("out of")) {
          selectedDefectList.push(defect);
        } else {
          console.log("skipping defect id:", defect.id);
        }
      }
    }
    if (selectedDefectList.length === 0) {
      alert(
        "Could not find Open defects matching the criteria.\nNo new defects closed. \n Make sure to disposition Dust & dirt defects as out of tolerance first"
      );
      return;
    }

    const answer =
      window.confirm(`Will close ${selectedDefectList.length} Open Repair Needed ${bulkRepairDefectType} defect(s) for ${bulkRepairCavity} cavity.
                                                \nOnce perfomred, the operation cannot be undone, and can only be reversed by reviewing each defect individually.\nWould you like to continue?`);
    if (answer) {
      resetProgressBar();
      for (let defect of selectedDefectList) {
        defect.status = "Closed";
        defect.sso = loggedUser;
        defect.repair_report_id = bulkRepairReportId;
        defect.repair_approved_by = bulkRepairApprovedBy;
        defect.description = bulkRepairDescription;
        defect.repair_date = repairDate;
        let resp = await updateDefect(defect.id, defect);
        console.log("updated defect: ", resp);
        updatedDefectList.push(defect.id);
        computeDefectUpdateProgress(defect, selectedDefectList);
      }
    }

    if (updatedDefectList.length > 0) {
      alert(`Closed ${updatedDefectList.length} defect(s).`);
      buildPageData(); // refresh the page
    }

    resetProgressBar();
  };

  const bulkDispositionDefectsPreviewFilter = () => {
    console.log("bulkDispositionDefectsFilter()");

    console.log("bulkDisposition:", bulkDisposition); // does not apply to this filter since this will the resulting state
    console.log("bulkDefectType:", bulkDefectType);
    console.log("bulkCavity:", bulkCavity);
    console.log("bulkMeasurementProp:", bulkMeasurementProp);
    console.log("bulkTolerance:", bulkTolerance / 1000, "m");
    console.log("doUseBulkTolerance:", doUseBulkTolerance);

    let filterStatus = "Open";
    let filterWidth = "";
    let filterLength = "";

    if (doUseBulkTolerance) {
      if (bulkMeasurementProp == "width") {
        filterWidth = bulkTolerance.toString();
      }

      if (bulkMeasurementProp == "length") {
        filterLength = bulkTolerance.toString();
      }
    }

    setFilters({
      defect_id: { value: "", type: "contains" },
      root_face_distance: { value: "", type: "is not empty" },
      finding_type: { value: bulkDefectType, type: "contains" },
      location: { value: bulkCavity, type: "contains" },
      failure_prob: { value: "", type: "contains" },
      manufacture_stage: { value: "", type: "contains" },
      ge_disposition: { value: "", type: "contains" },
      status: { value: filterStatus, type: "contains" },
      repair_date: { value: "", type: "contains" },
      repair_report_id: { value: "", type: "contains" },
      repair_approved_by: { value: "", type: "contains" },
      is_manual: { value: "all", type: "manual_filter" },
      area: { value: "", type: "less than" },
      width: { value: filterWidth, type: "less than" },
      length: { value: filterLength, type: "less than" },
    });
  };

  // apply properties used in the bulk repair action to the filtered list of defects
  const bulkRepairPreviewFilter = () => {
    console.log("bulkRepairFilter()");

    console.log("bulkRepairDefectType:", bulkRepairDefectType);
    console.log("bulkRepairCavity:", bulkRepairCavity);
    console.log("bulkRepairReportId:", bulkRepairReportId);
    console.log("bulkRepairApprovedBy:", bulkRepairApprovedBy);
    console.log("bulkRepairDescription:", bulkRepairDescription);

    let filterDisposition = "Out of Tolerance";
    let filterStatus = "Open";

    setFilters({
      defect_id: { value: "", type: "contains" },
      root_face_distance: { value: "", type: "is not empty" },
      finding_type: { value: bulkRepairDefectType, type: "contains" },
      location: { value: bulkRepairCavity, type: "contains" },
      failure_prob: { value: "", type: "contains" },
      manufacture_stage: { value: "", type: "contains" },
      ge_disposition: { value: filterDisposition, type: "contains" },
      status: { value: filterStatus, type: "contains" },
      repair_date: { value: "", type: "contains" },
      repair_report_id: { value: "", type: "contains" },
      repair_approved_by: { value: "", type: "contains" },
      is_manual: { value: "all", type: "manual_filter" },
      area: { value: "", type: "less than" },
      width: { value: "", type: "less than" },
      length: { value: "", type: "less than" },
    });
  };

  // The `undo` function enables a one-time undo of the last "Apply Disposition" action. When the user clicks
  // the "Apply Disposition" button, a snapshot of the affected defects is saved to `undoData`, and the `isUndoActive`
  // state is set to `true` to activate the "Undo" button. The `undo` function checks if the undo action is available by
  // ensuring `isUndoActive` is `true` and that `undoData` contains data. If these conditions are met, it iterates
  // over each defect in `undoData` and restores its previous state by calling `updateDefect`, which updates each defect
  // in the database. After completing the reversal, the function deactivates the "Undo" button by setting `isUndoActive`
  // to `false`, clears `undoData` to prevent repeated undos, and alerts the user that the changes have been reverted.
  // Finally, it refreshes the page data by calling `buildPageData` to reflect the reverted defect states in the UI.
  const undo = async () => {
    if (!isUndoActive || !undoData) return;

    for (let defect of undoData) {
      await updateDefect(defect.id, defect); // Restore each defect
    }

    setIsUndoActive(false); // Deactivate undo button
    setUndoData(null); // Clear stored data
    alert("Undo successful. Previous disposition changes have been reverted.");
    buildPageData(); // Refresh the page
  };

  // apply properties used in the bulk disposition action to the filtered list of defects
  const bulkDispositionDefects = async () => {
    console.log("bulkCloseDefects() called");

    console.log("bulkDisposition:", bulkDisposition);
    console.log("bulkDefectType:", bulkDefectType);
    console.log("bulkCavity:", bulkCavity);
    console.log("bulkMeasurementProp:", bulkMeasurementProp);
    console.log("bulkTolerance:", bulkTolerance / 1000, "m");
    console.log("doUseBulkTolerance:", doUseBulkTolerance);

    let selectedDefectList = []; // defects to be updated
    let updatedDefectsList = []; // defects updated
    console.log("ttt defectList = ", defectList);
    for (let defect of defectList) {
      console.log("defecttt:", defect);
      if (
        defect.status === "Open" &&
        defect.location === bulkCavity &&
        defect.finding_type === bulkDefectType &&
        (!doUseBulkTolerance ||
          (doUseBulkTolerance &&
            defect[bulkMeasurementProp] >= 0 && // if they are 0 and the person wants to dispose them as within tolerance because he eye balled them as good, then he should be able to do it.
            defect[bulkMeasurementProp] < bulkTolerance / 1000))
      ) {
        selectedDefectList.push(defect);
      }
    }

    if (selectedDefectList.length == 0) {
      alert(
        "Could not find Open defects matching the criteria.\nNo new defects closed."
      );
      return;
    }

    const answer =
      window.confirm(`Will update ${selectedDefectList.length} Open ${bulkDefectType} defect(s) for ${bulkRepairCavity} cavity as: ${bulkDisposition}.
                                                \nOnce performed, the operation cannot be undone, and can only be reversed by reviewing each defect individually.\nWould you like to continue?`);
    if (answer) {
      resetProgressBar();
      // Store the current state of the defects for undo functionality
      setUndoData(selectedDefectList.map((defect) => ({ ...defect }))); // Save current state for undo
      setIsUndoActive(true); // Activate the undo button

      for (let defect of selectedDefectList) {
        if (bulkDisposition.toLowerCase().includes("out of")) {
          console.log(
            "will not auto-close matching out of tolerance defect id:",
            defect.id
          );
        } else {
          defect.status = "Closed";
        }
        defect.ge_disposition = bulkDisposition;
        defect.sso = loggedUser;
        let resp = await updateDefect(defect.id, defect);
        console.log("updated defect: ", resp);
        updatedDefectsList.push(defect.id);
        computeDefectUpdateProgress(defect, selectedDefectList.length);
      }
    } else {
      console.log("User cancelled the operation.");
    }

    if (updatedDefectsList.length > 0) {
      alert(
        `Updated ${updatedDefectsList.length} defect(s) to disposition: ${bulkDisposition}.`
      );
      const search_esn = searchParams.get("esn");
      buildPageData(search_esn); // refresh the page
    }
    
    resetProgressBar();
  };

  // Function to create a new measurement and open the defect pages at the end.
  // Once we create a new measurement, the measurement page is opened and the user can take screenshots from a 360 image.
  // once a measurement is saved, it becomes one or more defects
  // measurements can have multiple defect types, but on defect can only have one defect type
  // defects are then reviewed using their own defect page.
  const newMeasurement = async () => {
    let location = newDefectCavity;
    let inspection = getInspectionForCavity(newDefectCavity);
    let inspectionId = inspection.id;
    let distance = newMeasurementDistance;

    if (
      newMeasurementImage == null ||
      newMeasurementDistance == null ||
      newMeasurementDistance === 0
    ) {
      alert(
        "Please select a cavity and a valid distance before creating a new defect."
      );
    } else {
      let imageId = newMeasurementImage.id;
      let newMeasResp = await createNewMeasurement(imageId, distance, location);
      let newMeaurementId = newMeasResp.id;
      // let newDefectResp = await createNewDefect(imageId, distance, location, newMeaurementId);
      // let newDefectId = newDefectResp.id

      // navigate on edit mode as opposed to review mode.
      navigate(`/measurement/${newMeaurementId}`);
    }
  };

  // Function to create a new measurement (NEW INDICATOR)
  const createNewMeasurement = async (imageId, distance, location) => {
    let newMeasurementJson = Object.assign({}, emptyMeasurement);
    newMeasurementJson.image_id = imageId;
    newMeasurementJson.date = new Date();
    newMeasurementJson.is_manual = true;
    newMeasurementJson.sso = loggedUser;
    newMeasurementJson.root_face_distance = distance;
    newMeasurementJson.location = location;

    let newMeasurementRecJson = await createMeasurement(newMeasurementJson);
    return newMeasurementRecJson;
  };

  // // Create a new defect out of a new measurement (NEW INDICATOR)
  // const createNewDefect = async (imageId, distance, location, measurementId) => {
  //   let newDefectJson = Object.assign({}, emptyDefect);
  //   newDefectJson.image_id = imageId;
  //   newDefectJson.date = new Date();
  //   newDefectJson.is_manual = true;
  //   newDefectJson.sso = loggedUser;
  //   newDefectJson.root_face_distance = distance;
  //   newDefectJson.location = location;
  //   newDefectJson.measurement_id = measurementId;

  //   let newDefectRecJson = await createDefect(newDefectJson);
  //   return newDefectRecJson;
  // };

  // Function to compute the open status based on the list of measurements

  const computeCompleteStatus = (listOfInspections) =>{
    console.log ('computeCompleteStatus() called');
    const manf_stage = [];
    const ins_status = [];
    const final_release_cavity = [];
    const other_cavity = [];
    const final_stage = ['Final_Release_Inspection','Final Release'];
    for (let inspection of listOfInspections) {
      manf_stage.push(inspection.manufacture_stage);
      ins_status.push(inspection.status);
      console.log ('inspection.manufacture_stage  ', inspection.manufacture_stage);
      console.log (final_stage.includes(inspection.manufacture_stage));
      if (final_stage.includes(inspection.manufacture_stage)) {
        final_release_cavity.push(inspection.sect);
      } else {
        other_cavity.push(inspection.sect);
      }
    }

    const allPresent = other_cavity.every(item => final_release_cavity.includes(item));
    const allAnnotatioComplete = ins_status.every(item => 'Complete' === item);
    console.log('allPresent ', allPresent);
    console.log('allAnnotatioComplete ', allAnnotatioComplete);
    if (allPresent && allAnnotatioComplete){
      setCompleteStatus(true);
      return;
    }    
    setCompleteStatus(false);
  };

  const computeOpenStatus = (listOfMeasurements, newRow = null) => {
    console.log("computeOpenStatus() called.");

    for (let measurement of listOfMeasurements) {
      if (newRow != null && newRow.id === measurement.id) {
        measurement = newRow;
      }

      if (measurement.status === "Open") {
        setOpenStatus(true);
        return;
      }
    }

    setOpenStatus(false);
  };

  const apiRef = useGridApiRef();

  // Function to handle row update in the table
  const handleProcessRowUpdate = async (updatedRow, originalRow) => {
    let message = "";

    let newDisposition = updatedRow["ge_disposition"];
    let oldDisposition = originalRow["ge_disposition"];

    if (newDisposition !== oldDisposition) {
      updatedRow["disposition_provided_by"] = loggedUser;

      if (
        newDisposition.includes("False") ||
        newDisposition.includes("No Repair")
      )
        updatedRow.status = "Closed";
      else if (newDisposition.includes("Out of Tolerance")) {
        if (
          updatedRow["repair_report_id"].length == 0 ||
          updatedRow["repair_approved_by"].length == 0 ||
          updatedRow["repair_date"] == null
        ) {
          updatedRow.status = "Open";
        }
      }
    }

    if (
      updatedRow.status === "Closed" &&
      updatedRow.ge_disposition.includes("Out of Tolerance")
    ) {
      if (
        updatedRow.repair_report_id == null ||
        updatedRow.repair_report_id.trim() === ""
      ) {
        message += ' "Repair Report Id"';
      }
      if (
        updatedRow.repair_approved_by == null ||
        updatedRow.repair_approved_by.trim() === ""
      ) {
        message += ' "Repair Approved by"';
      }
      if (updatedRow.repair_date == null) {
        message += ' "Repair Date"';
      }
    }

    if (updatedRow.ge_disposition.includes("Within Tolerance")) {
      if (updatedRow.repair_date != null) {
        message += ' Within Tolerance indicators cannot have "Repair Date".';
      }
      if (
        updatedRow.repair_report_id != null &&
        updatedRow.repair_report_id.length > 0
      ) {
        message +=
          ' Within Tolerance indicators cannot have "Repair Report Id".';
      }
      if (
        updatedRow.repair_approved_by != null &&
        updatedRow.repair_approved_by.length > 0
      ) {
        message += ' Within Tolerance indicators cannot have "Approved By".';
      }
    }

    if (message.length === 0) {
      await updateModifiedMeasurement(updatedRow.id, updatedRow);

      let newRow = Object.assign({}, updatedRow);

      let newMeasurementsList = [];
      for (let measurement of defectList) {
        if (measurement.id === newRow.id) {
          newMeasurementsList.push(newRow);
        } else {
          let newMeasurement = Object.assign({}, measurement);
          newMeasurementsList.push(newMeasurement);
        }
      }

      setDefectList(newMeasurementsList);

      computeOpenStatus(newMeasurementsList, newRow);

      return newRow;
    } else {
      message =
        "Missing: " +
        message +
        "\n Defect cannot be closed. Row will not be updated.";
      alert("Error: " + message);

      return originalRow;
    }
  };

  // Error handling for row update
  const handleProcessRowUpdateError = () => {
    console.log("handleProcessRowUpdateError() called.");
  };

  // Function to select new defect cavity
  const selectNewDefectCavity = async (cavityName) => {
    let inspection = getInspectionForCavity(cavityName);
    if (inspection != null) {
      setNewDefectCavity(cavityName);
      let inspectionId = inspection.id;

      let imgList = await getInspectionImageList(inspectionId);
      setImageList(imgList);

      let distances = await getInspectionImageDistances(inspectionId);
      setNewDefectDistanceOptions(distances);
      selectNewDefectDistance(distances[0]);
    } else {
      console.log("Error. Found no inspection for cavity:", cavityName);
    }
  };

  // Function to select new defect distance
  const selectNewDefectDistance = (distance) => {
    for (let image of imageList) {
      if (image.distance === distance) {
        setNewDefectImage(image);
        setNewDefectDistance(distance);
        return;
      }
    }
  };

  // Template for certificate data
  const CERTIFICATE_TEMPLATE = {
    blade_areas_inspected: null,
    blade_model: null,
    blade_serial_number: null,
    blade_type: null,
    certificate_number: null,
    certification_date: null,
    factory_location: null,
    factory_name: null,
    inspection_date: null,
    inspection_equipment: null,
    inspection_modality: null,
    inspector_name: null,
    manufacture_date: null,
    supplier_name: null,
  };

  // Function to delete the current certificate
  const deleteCurrentCertificate = async () => {
    if (certificate != null) {
      let resp = await deleteCertificate(certificate.id);
      setCertificate(null);
     
      await buildPageData();
    }
  };

  // Function to issue a new certificate
  const issueCertificate = async () => {
    let body = CERTIFICATE_TEMPLATE;

    let bladeAreasSet = new Set();
    for (let inspection of inspectionList) {
      if (inspection["sect"] != null && inspection["sect"].trim() != "")
        bladeAreasSet.add(inspection["sect"]);

      if (body["blade_model"] == null)
        body["blade_model"] = inspection["model"];
      if (body["blade_serial_number"] == null)
        body["blade_serial_number"] = inspection["esn"];
      if (body["blade_type"] == null)
        body["blade_type"] = inspection["blade_type"];
      if (body["certification_date"] == null)
        body["certification_date"] = new Date().toISOString().split("T")[0];
      if (body["factory_location"] == null)
        body["factory_location"] = inspection["location"];
      if (body["factory_name"] == null)
        body["factory_name"] = inspection["factory_name"];
      if (body["inspection_date"] == null)
        body["inspection_date"] = inspection["date"];
      if (body["inspection_modality"] == null)
        body["inspection_modality"] = inspection["app_type"];
      if (body["inspection_equipment"] == null)
        body["inspection_equipment"] = inspection["engine_type"];
      if (body["inspector_name"] == null)
        body["inspector_name"] = inspection["inspector_name"];
      if (body["manufacture_date"] == null)
        body["manufacture_date"] = inspection["manufacture_date"];
      if (body["supplier_name"] == null)
        body["supplier_name"] = inspection["customer_name"];
    }
    let bladeAreasInspected = Array.from(bladeAreasSet).join(" ");
    body["blade_areas_inspected"] = bladeAreasInspected;

    let newCert = await createCertificate(body);
    setCertificate(newCert);
    let certificateId = newCert.id;

    if (newCert.id != null) {
      for (let inspection of inspectionList) {
        let inspectionId = inspection.id;
        let updatedInspection = await updateInspection(inspectionId, {
          certificate_id: newCert.id,
        });
      }
    }
  };

  // Function to handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  // Debugging logs
  console.log(
    "certificate = ",
    certificate,
    "openStatus = ",
    openStatus,
    "completeStatus = ",
    completeStatus
  );

  const handleSelectBulkDisposition = (value) => {
    console.log("handleSelectBulkDisposition() called with:", value);
    if (value.toLowerCase().includes("within")) {
      setDoUseBulkTolerance(true);
      //updateBulkDefectTypeOptions(defectList);
      //setBulkDefectType(defectList[0]);

      setBulkDefectTypeOptions(defaultBulkDefectTypeOptions);
      setBulkDefectType(defaultBulkDefectTypeOptions[0]);
    } else if (value.toLowerCase().includes("out of")) {
      setDoUseBulkTolerance(false);
      setBulkDefectTypeOptions(defaultBulkDefectTypeOptions);
      // setBulkDefectType(defaultBulkRepairDefectTypeOptions[0]);
    }

    setBulkDisposition(value);
  };

  const handleShowOpenAIFindings = (event) => {
    console.log("handleShowOpenAIFindings() called");
    console.log(event.target.checked);

    // because we change this react property, it will trigger the useEffect() of this page and reload
    // the defects list. It will also compute the open status
    setShowOpenAIFindings(event.target.checked);

    // TODO: reload list of defects from the server
    //computeOpenStatus(defectList, null);
  };

  const handleDoUseBulkTolerance = (event) => {
    setDoUseBulkTolerance(event.target.checked);
  };

  const handleBulkDefectType = (defectType) => {
    console.log("handleBulkDefectType() called with:", defectType);

    if (defectType.toLowerCase().includes("dust")) {
      setDoUseBulkTolerance(false);
      setDustSelected(true);
    } else {
      setDoUseBulkTolerance(true);
      setDustSelected(false);
    }
    setBulkDefectType(defectType);
  };

  return (
    <div className="bladequality">
      {/* Header section with back navigation and page title */}
      <div
        style={{
          fontSize: 25,
          paddingTop: 2,
          paddingBottom: 2,
          display: "flex",
          alignItems: "center",
          backgroundColor: "#808000",
          color: "white",
          padding: "2px",
          borderRadius: "5px",
        }}
      >
        <NavigateBeforeOutlinedIcon
          onClick={() => {
            if (previousRoute) {
              navigate(previousRoute);
            }
            else{
            navigate(`/bladeslist`);
            }
          }}
          style={{ display: "flex", alignItems: "center", fontSize: 30 }}
        />
        <div style={{ display: "flex", alignItems: "center", marginLeft: 10 }}>
          <GridOnOutlinedIcon style={{ marginRight: 5 }} />
          Review Findings <br />
        </div>
      </div>
      {/* Section to display selected blade details */}
      <div style={{ paddingTop: 20 }}>
        <span style={{ fontSize: 20, paddingTop: 20 }}>
          Findings: Annotate Blade Image <br />
        </span>
        <span style={{ fontSize: 20, paddingTop: 20 }}>
          Blade Serial Number:{" "}
          <span style={{ fontWeight: "bold" }}>{searchParams.get("esn")}</span>{" "}
        </span>
      </div>

      {/* Display open and closed defects count */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div>Reviewing {defectList.length} indicators in all cavities</div>
        <div>-</div>
        <Typography variant="body1">
          Open Defects: {openDefectCount} ({" "}
          {openDefectCount + closedDefectCount > 0
            ? (
                (openDefectCount / (openDefectCount + closedDefectCount)) *
                100
              ).toFixed(1)
            : 0}
          %)
        </Typography>
        <div>-</div>
        <Typography variant="body1">
          Closed Defects: {closedDefectCount} ({" "}
          {openDefectCount + closedDefectCount > 0
            ? (
                (closedDefectCount / (openDefectCount + closedDefectCount)) *
                100
              ).toFixed(1)
            : 0}
          %)
        </Typography>
      </div>

      <Box sx={{ width: "100%" }}>
        {updateProgress > 0 && (
          <LinearProgressWithLabel value={updateProgress} />
        )}
      </Box>

      <Accordion sx={{ marginTop: 5 }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
          sx={{ fontWeight: "bold" }}
        >
          Bulk Disposition & Repair
        </AccordionSummary>
        <AccordionDetails>
          {/* --------------Bulk disposition bar -------------- */}
          <Grid container direction="row" justifyContent="flex-start">
            <Grid item>
              <FormControl sx={{ margin: 0.5 }}>
                <Typography sx={{ fontWeight: "bold", paddingTop: 3 }}>
                  {" "}
                  For each Open indicator of ...................... :
                  {"                      "}
                </Typography>
              </FormControl>

              <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                <InputLabel id="defect-type-label">Defect Type</InputLabel>
                <Select
                  labelId="defect-type-label"
                  defaultValue={bulkDefectTypeOptions[0]}
                  name="defect-type-options"
                  size="small"
                  onChange={(e) => handleBulkDefectType(e.target.value)}
                >
                  {bulkDefectTypeOptions.map((option, index) => (
                    <MenuItem key={index} value={option}>
                      {" "}
                      {option}{" "}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                <InputLabel id="cavity-label">Blade Cavity</InputLabel>
                <Select
                  labelId="cavity-label"
                  defaultValue={bladeCavities[0]}
                  id="cavity"
                  value={bulkCavity}
                  onChange={(e) => setBulkCavity(e.target.value)}
                >
                  {bladeCavities.map((cavity, index) => (
                    <MenuItem key={index} value={cavity}>
                      {" "}
                      {cavity}{" "}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {!dustSelected && (
              <Grid item>
                <FormControl>
                  <FormControlLabel
                    sx={{ paddingTop: 2 }}
                    control={
                      <Checkbox
                        checked={doUseBulkTolerance}
                        onChange={handleDoUseBulkTolerance}
                        name="check-tolerance"
                      />
                    }
                    label="Within Tolerance"
                  />
                </FormControl>
              </Grid>
            )}

            {doUseBulkTolerance && (
              <Grid item>
                <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                  <InputLabel id="measurement-prop-label">
                    Measured Property
                  </InputLabel>
                  <Select
                    labelId="measurement-prop-label"
                    defaultValue={measurementPropOptions[0]}
                    id="measurement-prop"
                    value={bulkMeasurementProp}
                    onChange={(e) => setBulkMeasurementProp(e.target.value)}
                  >
                    {measurementPropOptions.map((measProp, index) => (
                      <MenuItem key={index} value={measProp}>
                        {" "}
                        {measProp}{" "}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                  <InputLabel id="tolerance-label">Tolerance</InputLabel>
                  <Select
                    labelId="tolerance-label"
                    defaultValue={toleranceOptions[0]}
                    id="tolerance"
                    value={bulkTolerance}
                    onChange={(e) => setBulkTolerance(e.target.value)}
                    label="Tolerance"
                  >
                    {toleranceOptions.map((tolerance, index) => (
                      <MenuItem key={index} value={tolerance}>
                        {"< "}
                        {tolerance}
                        {" mm"}
                      </MenuItem>
                    ))}
                    {/* <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        
                        <MenuItem value={10}>&lt; 10 mm</MenuItem>
                        <MenuItem value={15}>&lt; 15 mm</MenuItem> 
                        <MenuItem value={20}>&lt; 20 mm</MenuItem>
                        <MenuItem value={25}>&lt; 25 mm</MenuItem>
                        <MenuItem value={30}>&lt; 30 mm</MenuItem> */}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                style={{
                  marginRight: 5,
                  marginTop: 25,
                  fontWeight: "bold",
                }}
                onClick={() => bulkDispositionDefectsPreviewFilter()}
              >
                <FilterAltIcon style={{ marginRight: 5 }} /> Show matching
                indicators
              </Button>
            </Grid>
            <Grid item>
              <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                <InputLabel id="disposition-label">Disposition</InputLabel>
                <Select
                  labelId="disposition-label"
                  defaultValue={defectDispositionOptions[1]}
                  name="disposition-options"
                  size="small"
                  onChange={(e) => handleSelectBulkDisposition(e.target.value)}
                >
                  {defectDispositionOptions.map((option, index) => (
                    <MenuItem key={index} value={option}>
                      {" "}
                      {option}{" "}
                    </MenuItem>
                  ))}
                  {/* <MenuItem key={1} value={defectDispositionOptions[1]}>
                        {defectDispositionOptions[1]}
                      </MenuItem> */}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                style={{
                  marginRight: 5,
                  marginTop: 25,
                  fontWeight: "bold",
                  backgroundColor: "seagreen",
                }}
                onClick={() => bulkDispositionDefects()}
              >
                <CheckBoxIcon style={{ marginRight: 5 }} /> Apply disposition
              </Button>

              <Button
                variant="contained"
                style={{
                  marginRight: 5,
                  marginTop: 25,
                  fontWeight: "bold",
                  backgroundColor: isUndoActive ? "seagreen" : "gray",
                }}
                onClick={undo}
                disabled={!isUndoActive}
              >
                <CheckBoxIcon style={{ marginRight: 5 }} /> Undo
              </Button>
            </Grid>
          </Grid>

          {/* --------------Bulk repair bar -------------- */}
          <Grid container direction="row" justifyContent="space-between">
            {/* {repairableDefects.length > 0 && ( */}
            {
              <Grid item justifyContent="space-between" alignItems="baseline">
                <FormControl sx={{ margin: 0.5 }}>
                  <Typography sx={{ fontWeight: "bold", paddingTop: 3 }}>
                    For each Open 'Repair Needed' indicator of
                  </Typography>
                </FormControl>

                <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                  <InputLabel id="defect-type-label">Defect Type</InputLabel>
                  <Select
                    labelId="defect-type-label"
                    defaultValue={bulkRepairDefectTypeOptions[0]}
                    name="defect-type-options"
                    size="small"
                    onChange={(e) => setBulkRepairDefectType(e.target.value)}
                  >
                    {bulkRepairDefectTypeOptions.map((option, index) => (
                      <MenuItem key={index} value={option}>
                        {" "}
                        {option}{" "}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                  <InputLabel id="cavity-label">Blade Cavity</InputLabel>
                  <Select
                    labelId="cavity-label"
                    defaultValue={bladeCavities[0]}
                    id="cavity"
                    value={bulkRepairCavity}
                    onChange={(e) => setBulkRepairCavity(e.target.value)}
                  >
                    {bladeCavities.map((cavity, index) => (
                      <MenuItem key={index} value={cavity}>
                        {" "}
                        {cavity}{" "}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  color="primary"
                  style={{
                    marginRight: 5,
                    marginTop: 25,
                    fontWeight: "bold",
                  }}
                  onClick={() => bulkRepairPreviewFilter()}
                >
                  <FilterAltIcon style={{ marginRight: 5 }} /> Show matching
                  indicators
                </Button>

                <FormControl sx={{ margin: 0.5 }}>
                  <FormLabel>Report Id</FormLabel>
                  <TextField
                    name="app_type"
                    size="small"
                    value={bulkRepairReportId}
                    onChange={(e) => setBulkRepairReportId(e.target.value)}
                  >
                    {" "}
                  </TextField>
                </FormControl>

                <FormControl sx={{ margin: 0.5 }}>
                  <FormLabel>Approved By</FormLabel>
                  <TextField
                    name="app_type"
                    size="small"
                    value={bulkRepairApprovedBy}
                    onChange={(e) => setBulkRepairApprovedBy(e.target.value)}
                  >
                    {" "}
                  </TextField>
                </FormControl>

                <FormControl sx={{ margin: 0.5 }}>
                  <FormLabel>Comments</FormLabel>
                  <TextField
                    name="app_type"
                    size="small"
                    value={bulkRepairDescription}
                    onChange={(e) => setBulkRepairDescription(e.target.value)}
                  >
                    {" "}
                  </TextField>
                </FormControl>

                <Button
                  variant="contained"
                  style={{
                    marginRight: 5,
                    marginTop: 25,
                    fontWeight: "bold",
                    backgroundColor: "seagreen",
                  }}
                  onClick={bulkRepairDefects}
                >
                  <CheckBoxIcon style={{ marginRight: 5 }} /> Repair all using
                </Button>
              </Grid>
            }
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Buttons for issuing or deleting certificates and adding new indicators */}
      <Grid container direction="row" justifyContent="space-between">
        {/* -------------- Certificate bar -------------- */}
        <Grid item justifyContent="flex-start" alignItems="baseline">
          {certificate == null && !openStatus && completeStatus && (
            <Button
              variant="contained"
              style={{
                marginRight: 5,
                marginTop: 5,
                minWidth: 180,
                fontWeight: "bold",
                backgroundColor: "seagreen",
              }}
              onClick={issueCertificate}
            >
              {`Issue Certificate`}
            </Button>
          )}

          {certificate != null && (
            <FormControl size="small" style={{ marginRight: 5 }}>
              <FormLabel>Certification Date</FormLabel>
              <TextField
                InputLabelProps={{ shrink: true }}
                size="small"
                value={formatDate(certificate.certification_date)}
                InputProps={{
                  readOnly: true,
                }}
              ></TextField>
            </FormControl>
          )}
          {certificate != null && (
            <a
              href={`api/certificate/pdf?esn=${pageEsn}`}
              download={`Certificate-${pageEsn}.pdf`}
              target="_blank"
            >
              <Button
                variant="contained"
                style={{
                  marginRight: 5,
                  marginTop: 25,
                  minWidth: 180,
                  fontWeight: "bold",
                  backgroundColor: "seagreen",
                }}
              >
                <CardMembershipIcon style={{ marginRight: 5 }} />{" "}
                Download Certificate
              </Button>
            </a>
          )}

          {certificate != null && ( // openStatus && (
            <Button
              variant="contained"
              style={{
                marginRight: 5,
                marginTop: 25,
                minWidth: 180,
                fontWeight: "bold",
                backgroundColor: "red",
              }}
              onClick={deleteCurrentCertificate}
            >
              {`Delete Certificate`}
            </Button>
          )}

          {/* 
          <FormControlLabel
            label="Include Open AI Findings"
            control={
              <Checkbox
                style={{ marginLeft:5}}
                checked={showOpenAIFindings}
                onChange={handleShowOpenAIFindings}
              />
            }
          />
          */}
        </Grid>
      </Grid>

      <Grid container direction="row" justifyContent="space-between">
        {/* --------------New indicator button -------------- */}
        <Grid item justifyContent="space-between" alignItems="baseline">
          <Button
            style={{
              marginRight: 5,
              marginTop: 10,
              fontWeight: "bold",
              backgroundColor: "seagreen",
            }}
            variant="contained"
            onClick={newDefectDialog}
          >
            <GpsFixedIcon style={{ marginRight: 5 }} /> New Indicator
          </Button>
          {/* <Button
            style={{
              marginRight: 5,
              marginTop: 25,
              fontWeight: "bold",
              backgroundColor: "blue",
            }}
            variant="contained"
            onClick={() => setFilters(initialFilters)}
          >
            Clear Filters
          </Button> */}
        </Grid>
      </Grid>

      {/* Suspense fallback and table for blade quality */}
      <Suspense fallback={<Loading />}>
        <Box sx={{ width: "100%" }}>
          {showProgressBar && <LinearProgress />}
        </Box>
        <Box sx={{ marginBottom: 10, height: 800, width: "100%" }}>
          <BladeQualityTable
            applyFilters={applyFilters}
            defectList={defectList}
            defectTypeList={defectTypeList}
            bladeCavityOptions={bladeCavityOptions}
            defectDispositionOptions={defectDispositionOptions}
            statusOptions={statusOptions}
            apiRef={apiRef}
            handleProcessRowUpdate={handleProcessRowUpdate}
            handleProcessRowUpdateError={handleProcessRowUpdateError}
            rowsSelected={rowsSelected}
            filters={filters}
            defectSeverityTable={defectSeverityTable}
            handleFilterChange={handleFilterChange}
            setFilters={setFilters}
            initialFilters={initialFilters}
          />
        </Box>
      </Suspense>

      {/* ---------------------------------- Dialog for creating a new indicator ------------------------- */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        aria-labelledby="defect-dialog-title"
        aria-describedby="defect-dialog-description"
      >
        <DialogTitle id="defect-dialog-title">
          {"Select defect location"}
        </DialogTitle>
        <DialogContent>
          <div id="defect-dialog-description">
            <FormControl size="small">
              <FormLabel>Cavity</FormLabel>
              <Select
                defaultValue={bladeCavityOptions[0]}
                id="cavity"
                value={newDefectCavity}
                onChange={(e) => selectNewDefectCavity(e.target.value)}
              >
                {bladeCavityOptions.map((cavity, index) => (
                  <MenuItem key={index} value={cavity}>
                    {" "}
                    {cavity}{" "}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl style={{ marginLeft: 5 }} size="small">
              <FormLabel>Distance</FormLabel>
              <Select
                defaultValue={newDefectDistanceOptions[0]}
                id="distance"
                value={newMeasurementDistance}
                onChange={(e) => selectNewDefectDistance(e.target.value)}
              >
                {newDefectDistanceOptions.map((distance, index) => (
                  <MenuItem key={index} value={distance}>
                    {" "}
                    {distance}{" "}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={newMeasurement}>New Indicator</Button>
          <Button onClick={handleDialogClose} autoFocus>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default BladeQualityPage;
