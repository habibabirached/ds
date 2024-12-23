import "./DefectPage.css";
import React, { useState, useEffect, Suspense, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Loading from "../../components/Loading";
import CanvasBodyWrapper from "./CanvasBodyWrapper";
import {
  TextField,
  FormControl,
  FormLabel,
  Button,
  Typography,
  Stack,
  Card,
  Grid,
  Divider,
  Select,
  MenuItem,
  Checkbox,
  ToggleButton,
  Stepper, Step, StepLabel, StepConnector 

} from "@mui/material";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import ImageListItemBar from "@mui/material/ImageListItemBar";
import DetailedForm from "./DetailedForm";

import NavigateBeforeOutlinedIcon from "@mui/icons-material/NavigateBeforeOutlined";

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { styled } from '@mui/system';

import useFilters from "../../components/Filter/useFilters2";

import dayjs from "dayjs";
import {
  findInspectionImage,
  getInspectionById,
  getInspectionDefectList,
  getInspectionImageDistances,
  getInspectionImageList,
  getInspectionList,
  getInspectionMeasurementList,
  updateInspection,
  uploadImageFileAndMetadata,
} from "../../services/inspection_api";
import {
  getImage as get360ImageData,
  getMeasurementListForImage,
  updateImage,
} from "../../services/image_api";

import CameraAltIcon from "@mui/icons-material/Save";
import { Pannellum } from "pannellum-react";
import {
  deleteMeasurementAnnotationFile,
  emptyMeasurement,
  getDefectSeverity,
  getMeasurement,
  updateMeasurement,
  uploadImageMeasurementFile,
} from "../../services/measurement_api";
import {
  getSideViewImageUrl,
  getCrossSectionImageUrl,
} from "../../services/blade_api";
import GridOnOutlinedIcon from "@mui/icons-material/GridOnOutlined";
import {
  deleteDefectEvidenceFile,
  emptyDefect,
  getDefect,
  getDefectEvidenceFileList,
  getDefectEvidenceFileUrl,
  readSearchDefectListCsv,
  searchDefectList,
  updateDefect,
  uploadDefectRepairEvidenceFile,
} from "../../services/defect_api";
import { BLADE_CAVITIES, DEFECT_DISPOSITION_OPTIONS } from "../../config";
import { csv2JSON, getMeasurementLocation } from "../../utils/utils";

// import {
//   Box,
//   Button,
//   Flex,
//   Icon,
//   Text,
//   useColorModeValue,
// } from "@chakra-ui/react";
// import { MdUpload } from "react-icons/md";

import ZoomInIcon from "@material-ui/icons/ZoomIn";
import ZoomOutIcon from "@material-ui/icons/ZoomOut";
import RefreshIcon from "@material-ui/icons/Refresh";

import Accordion from "@mui/material/Accordion";
import AccordionActions from "@mui/material/AccordionActions";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";


import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import FolderIcon from '@mui/icons-material/Folder';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import { downloadFileUrl } from "../../services/DownloadFunctions";
import { Camera, X, RefreshCw, Save } from 'lucide-react';
import DebouncedCommentsField from "../../components/DebouncedCommentsField";

function DefectPage() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const routeParams = useParams();

  // ------------------------ id & edit mode----------------------------
  const id = routeParams.id;
  //const edit = searchParams.get('edit') || false;

  console.log("Defect id:", id);

  // Edit mode allow users to take screenshots of defects and place annotations on them.
  //console.log("Edit mode:", edit);
  
  // -------------------------- Filters --------------------------------

  const describeFilters = (filters) => {
    console.log('describeFilters()');
    let message = "";
    let keysList = Object.keys(filters);
    for (let key of keysList) {
      let filter = filters[key];
      if (key != 'is_manual' && filter['value'] != "") {
        if (message.length > 0) message += ', ';
        message +=  key+" "+filter['type']+" '"+filter['value']+"'"
      } else if (key == 'is_manual' && filter['value'] == 'all') {
        if (message.length > 0) { message += ' and'}
        message += ' Defects are produced by AI or human inspectors'
      }
    }
    return message;
  }

  // default value does not filter anything. this will be overwritten
  let inputFilters  = {
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
  
  const filtersQuery = searchParams.get('filters');
  console.log(`filtersQuery: ${filtersQuery}`);

  let filtersMessage = null; // what the user will see

  if (filtersQuery != null) {
    let decodedFiltersStr = atob(filtersQuery)
    console.log('decodedFiltersStr:', decodedFiltersStr);
    let filtersJson = JSON.parse(decodedFiltersStr);
    inputFilters = filtersJson;
    filtersMessage = describeFilters(inputFilters);
  }
  
  const [filters, handleFilterChange, clearFilters, setFilters, applyFilters] = 
    useFilters(inputFilters, "DefectFilters");

  // ----------------------------- Image Zoom ----------------------------------------

  const defectImageContainerRef = useRef(null);
  const repairImageContainerRef = useRef(null);
  const [zoomLevels, setZoomLevels] = useState({ defect: 1, repair: 1 });
  const [transformOrigins, setTransformOrigins] = useState({
    defect: "center center",
    repair: "center center",
  });
  const [isInitialClick, setIsInitialClick] = useState({
    defect: true,
    repair: true,
  });

  const handleWheel = (event, refType) => {
    const ref =
      refType === "defect" ? defectImageContainerRef : repairImageContainerRef;

    if (ref.current && ref.current.contains(event.target)) {
      event.preventDefault();
      setZoomLevels((prevZoomLevels) => {
        const newZoomLevel = prevZoomLevels[refType] + event.deltaY * -0.01;
        return {
          ...prevZoomLevels,
          [refType]: Math.min(Math.max(1, newZoomLevel), 5),
        };
      });
    }
  };

  const handleImageClick = (event, refType) => {
    const ref =
      refType === "defect" ? defectImageContainerRef : repairImageContainerRef;

    if (isInitialClick[refType] && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const x = (event.clientX - rect.left) / zoomLevels[refType];
      const y = (event.clientY - rect.top) / zoomLevels[refType];

      setTransformOrigins((prevOrigins) => ({
        ...prevOrigins,
        [refType]: `${x}px ${y}px`,
      }));

      setIsInitialClick((prevState) => ({
        ...prevState,
        [refType]: false,
      }));

      setZoomLevels((prevZoomLevels) => ({
        ...prevZoomLevels,
        [refType]: Math.min(prevZoomLevels[refType] + 1, 5),
      })); // Slightly zoom in on first click
    }
  };

  const zoomIn = (refType) => {
    setZoomLevels((prevZoomLevels) => ({
      ...prevZoomLevels,
      [refType]: Math.min(prevZoomLevels[refType] + 1, 5),
    }));
  };

  const zoomOut = (refType) => {
    setZoomLevels((prevZoomLevels) => ({
      ...prevZoomLevels,
      [refType]: Math.max(prevZoomLevels[refType] - 1, 1),
    }));
  };

  const resetZoom = (refType) => {
    setZoomLevels((prevZoomLevels) => ({
      ...prevZoomLevels,
      [refType]: 1,
    }));
    setTransformOrigins((prevOrigins) => ({
      ...prevOrigins,
      [refType]: "center center",
    }));
    setIsInitialClick((prevState) => ({
      ...prevState,
      [refType]: true,
    }));
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        zoomIn("defect");
        zoomIn("repair");
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        zoomOut("defect");
        zoomOut("repair");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  
  // -----------------------------------------------------------------


  const loggedUser = localStorage.getItem("loggedSSO");
  console.log("loggedUser:", loggedUser);

  // all supported distances for a drop down
  // const distances = [];
  // for (let i=0; i< 70.5; i+=0.5) {
  //     distances.push(i);
  // }

  const formatDate = (date) => {
    console.log("formatDate:", date);
    if (date != null && date !== "") {
      //return dayjs(date).format('YYYY-MM-DD');
      return new Date(date).toISOString().split("T")[0];
    }
    return date;
  };

  // 360 image url
  const getImageUrl = (id) => {
    return `/api/image/${id}/file`;
  };

  const getThumbnailUrl = (id) => {
    return `/api/image/${id}/thumbnail`;
  };

  // We use time here to force the reload of the image upon upload
  const getMeasurementImageUrl = (id, includeAnnotations = true) => {
    return `/api/measurement/${id}/image_file?includeAnnotations=${includeAnnotations}&ts=${new Date().getTime()}`;
  };

  const getDefectImageUrl = (id, includeAnnotations = true) => {
    return `/api/defect/${id}/image_file?includeAnnotations=${includeAnnotations}&ts=${new Date().getTime()}`;
  };

  //const statusOptions = ["Open", "Closed", "Repaired"];
  const statusOptions = ["Open", "Closed"];

  const autoDefectDispositionOptions = DEFECT_DISPOSITION_OPTIONS;

  // manual defects have no AI false Positive
  const manualDefectDispositionOptions = DEFECT_DISPOSITION_OPTIONS;

  const bladeSections = BLADE_CAVITIES;

  const defectSeverityColor = {
    "(?)": "black",
    HIGH: "maroon",
    LOW: "orange",
    SAFETY: "purple",
    NONE: "silver",
  };

  const [inspectionData, setInspectionData] = useState({});
  const [imageData, setImageData] = useState({});

  const [defectData, setDefectData] = useState(emptyDefect);
  const [measurementData, setMeasurementData] = useState(emptyMeasurement);

  const [defectSeverityTable, setDefectSeverityTable] = useState({});
  const [distances, setDistances] = useState([]);

  const [imageError, setImageError] = useState(false);
  const [imageIsLoaded, setImageIsLoaded] = useState(true);

  const [measurementUrl, setMeasurementUrl] = useState(
    getMeasurementImageUrl(id)
  );
  const [defectUrl, setDefectUrl] = useState(getDefectImageUrl(id));

  const [doIncludeAnnotations, setDoIncludeAnnotations] = useState(true);
  //const [defectId, setDefectId] = useState(-1); // canvas way of detecting image change
  const [redraw, setRedraw] = useState(0);

  const [defectDispositionOptions, setDefectDispositionOptions] = useState(
    autoDefectDispositionOptions
  );

  // Required to implement the prev and next buttons
  const [defectList, setDefectList] = useState([]);
  const [nextId, setNextId] = useState(null);
  const [prevId, setPrevId] = useState(null);
  const [currentDefectIndex, setCurrentDefectIndex] = useState(0);

  // -------------------- 360 snapshot -----------------
  const imageRef = useRef(); // 360 image
  const [panoramaImageId, setPanoramaImageId] = useState();
  const [show360Image, setShow360Image] = useState(false);
  const [showFlat360Image, setShowFlat360Image] = useState(false);
  const [show360ImageLabel, setShow360ImageLabel] = useState('Show 360 Image');
  const [showFlat360ImageLabel, setShowFlat360ImageLabel] = useState('Show Flat 360 Image');
  //----------------------------------------------------

  const [evidenceFileList, setEvidenceFileList] = useState([]);

  const showCadFigures = false;

  const areAllRequiredRepairFieldsProvided = (defectData) => {
    console.log("areAllRequiredRepairFieldsProvided() called", defectData);

    // cannot close if disposition is not provided
    if (
      defectData["ge_disposition"] == null ||
      defectData["ge_disposition"] === ""
    )
      return false;

    if (
      defectData["repair_report_id"] == null ||
      defectData["repair_report_id"] === ""
    )
      return false;

    if (defectData["repair_date"] == null || defectData["repair_date"] === "")
      return false;

    // approver must be present
    if (
      defectData["repair_approved_by"] == null ||
      defectData["repair_approved_by"].trim() === ""
    )
      return false;

    return true;
  };

  const setDefectProp = (propName, value) => {
    console.log("setDefectProp() called with:", propName, value);

    let newDefectData = Object.assign({}, defectData);

    if (propName === "date" || propName === "repair_date") {
      value = value.toString();
    }

    newDefectData[propName] = value;

    // if the user sets a disposition, the system records its sso
    if (propName === "ge_disposition") {
      if (newDefectData["sso"] == null || newDefectData["sso"].trim() === "") {
        newDefectData["sso"] = loggedUser;
      }
    }

    if (checkDispositionConditions(newDefectData) === true) {
      newDefectData["status"] = statusOptions[1]; // set to Closed
    } else {
      newDefectData["status"] = statusOptions[0]; // set to Open
    }
    console.log("updating defectData to:", newDefectData);
    setDefectData(newDefectData);
  };

  const getDefectProp = (name) => {
    console.log(`getDefectProp() called with ${name}:`, defectData[name]);
    return defectData[name] || "";
  };

  // Use this method If we want to keep all within a single json object...
  const handleDefectDataChange = (event) => {
    const { name, value } = event.target;
    setDefectData((measurementData) => ({
      ...measurementData,
      [name]: value,
    }));
  };

  // human readable unique id for the defect
  const getDefectId = () => {
    let defectIdStr = inspectionData.esn + "-" + defectData.id;
    return defectIdStr;
  };

  const getDefectTolerance = () => {
    //TODO: Lookup table by measurementData.finding_type
    return "TBD";
  };

  const getColor = (defectType) => {
    let severity = defectSeverityTable[defectType];
    let color = defectSeverityColor[severity];
    console.log(
      "defectType:",
      defectType,
      "severity:",
      severity,
      "color:",
      color
    );
    if (color != null) {
      return color;
    }

    return defectSeverityColor["(?)"];
  };

  const fetchDefectEvidenceFileList = async () => {
    let evidenceList = await getDefectEvidenceFileList(id);
    setEvidenceFileList(evidenceList);
    setDefectRepairImageComments(evidenceList[0]?.repairEvidenceComments)
    console.log('evidence file list:', evidenceList);
  }

  // called after the component is created
  useEffect(() => {

    const fetchData = async () => {
      console.log("fetchData() called for defect id#", id);
      try {
        const defect_data = await getDefect(id);
        console.log(`refz100 Read Measurement data for id ${id}:`, defect_data);

        setPanoramaImageId(defect_data.image_id);

        if (defect_data != null && defect_data.id > 0) {
          const panorama_image_data = await get360ImageData(
            defect_data.image_id
          );

          const distances_data = await getInspectionImageDistances(
            panorama_image_data.inspection_id
          );
          console.log("distances_data:", distances_data);

          const inspection_data = await getInspectionById(
            panorama_image_data.inspection_id
          );
          console.log("inspection_data:", inspection_data);
          console.log("inspection id:", inspection_data.id);

          // distance is stored in the image table, here we propagate that to the defect.
          // TODO: if the user uploads a new defect, we need to find the image based on its distance
          if (
            defect_data.root_face_distance === 0 &&
            panorama_image_data.distance !== defect_data.edge_distance
          ) {
            defect_data.root_face_distance = panorama_image_data.distance;
          }

          if (defect_data.location !== inspection_data.sect) {
            defect_data.location = inspection_data.sect;
          }

          if (defect_data.location !== inspection_data.sect) {
            defect_data.location = inspection_data.sect;
          }

          setImageData(panorama_image_data);
          setInspectionData(inspection_data);
          setDistances(distances_data);
          console.log("refz100 panorama_image_data   = ", panorama_image_data);
          // panorama_image_data.distance = 11.0;
          // setPanoramaImageId(panorama_image_data.id);

          // if it is a manual measurement, we start showing the 360 image
          if (defect_data.is_manual === true) {
            // setShow360Image(true);
            setDefectDispositionOptions(manualDefectDispositionOptions);
            setDefectProp("sso", loggedUser);
          }

          // Need defect list info to build the navigation bar
          fetchDefectListForEsn(inspection_data.esn);

          // this should be the last property to change since it depends on the menu options and other properties to be in place.
          setDefectData(defect_data);
          //setMeasurementData(measurement_data);

          await fetchDefectEvidenceFileList();

          handleFetchDefectImageComments();
          handleFetchRepairEvidenceComments();

        }

        // populates the table correlating defect type and their severity.
        const severity_data = await getDefectSeverity();
        console.log("severity_data:", severity_data);
        setDefectSeverityTable(severity_data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();

    // no return function.
    // we could return a cleanup function here.
  }, [id, redraw]);

  // we need to know the other measurements for the current esn so we can set prev and next ids
  const fetchDefectListForEsn = async (esn) => {
    let defList = await searchDefectList(esn);

    for (let defect of defList) {
      // since we will filter data by this, we need to adopt human-readable standard locations
      defect.location = getMeasurementLocation(defect.location);
    }
    const filteredList = applyFilters(defList, inputFilters);
    

    filteredList.sort((a, b) => {
      let x = a["root_face_distance"];
      let y = b["root_face_distance"];
      return x < y ? -1 : x > y ? 1 : 0;
    });

    console.log("current defect id: ", id); // global id var

    // update next and previous id based on current location of id in list
    for (let i = 0; i < filteredList.length; i++) {
      let def = filteredList[i];
      if (def.id.toString() === id?.toString()) {
        setCurrentDefectIndex(i);
        if (i > 0) {
          setPrevId(filteredList[i - 1].id);
        } else {
          setPrevId(null);
        }
        if (i < filteredList.length - 1) {
          setNextId(filteredList[i + 1].id);
        } else {
          setNextId(null);
        }
      }
    }
    console.log(`setDefectList for ${esn} to:`, filteredList);
    setDefectList(filteredList);
  };

  const reloadDefectImage = () => {
    setDefectUrl("");
    setDefectUrl(getDefectImageUrl(id, doIncludeAnnotations));
  };

  // The defect shares the file with measurement, so there is no upload defect file equivalent.
  // All modifications are done in the measurement level. So a new shot will replace the measurement_file
  // and eliminate all other defects from that measurement.
  const handleUploadMeasurementImage = async (event) => {
    console.log("handleUploadMeasurementImage() called with:", event);

    const imageFile = event.target.files[0];
    console.log("imageFile:", imageFile);

    try {
      let respJson = await uploadImageMeasurementFile(id, imageFile);
      console.log("upload measurementFile resp:", respJson);

      let delRespJson = await deleteMeasurementAnnotationFile(id);
      console.log(
        "delete existing measurement annotation file resp:",
        delRespJson
      );

      reloadDefectImage();
      setImageIsLoaded(true);
      console.log("imageIsLoaded:", imageIsLoaded);
      console.log("imageError:", imageError);
      window.location.reload();
    } catch (e) {
      console.log("Error uploading file:", e);
    }
  };


  const handleUploadEvidenceFile = async (event) => {
    console.log("handleUploadEvidenceFile() called with:", event);

    const evidenceFile = event.target.files[0];
    console.log("evidenceFile:", evidenceFile);

    try {
      let respJson = await uploadDefectRepairEvidenceFile(id, evidenceFile);
      console.log("upload defect repair evidence file resp:", respJson);
      await fetchDefectEvidenceFileList();
    } catch (e) {
      console.log("Error uploading file:", e);
    }
  };

  const handleUploadEvidenceFiles = async (event) => {
    console.log("handleUploadEvidenceFiles() called with:", event);

    const evidenceFiles = event.target.files;
    const repairEvidenceComments = defectRepairImageComments ? defectRepairImageComments : "";
    for (let evidenceFile of evidenceFiles) {
      console.log("evidenceFile:", evidenceFile);

      try {
        let respJson = await uploadDefectRepairEvidenceFile(id, evidenceFile, repairEvidenceComments);
        console.log("upload defect repair evidence file resp:", respJson);

      } catch (e) {
        console.log("Error uploading file:", e);
      }
    }
    await fetchDefectEvidenceFileList(); 
  };

  // called when the user clicks on 'save' button
  const handleSubmit = async (event) => {
    event.preventDefault();

    let message = "";

    if (defectData.status === "Closed") {
      if (
        defectData.ge_disposition != null &&
        defectData.ge_disposition.includes("Out of Tolerance") &&
        !(areAllRequiredRepairFieldsProvided(defectData) === true)
      ) {
        message +=
          " 'report id' and 'disposition' fields are required in order to close.";
        //message += "All repair fields must be provided including: repair 'date', 'provided by' and 'report id'.";
      }
    }

    if (
      defectData.ge_disposition != null &&
      defectData.ge_disposition.includes("Within Tolerance")
    ) {
      if (defectData.status === "Repaired") {
        message +=
          " Within Tolerance indicators cannot be marked as Repaired. ";
      }
      if (defectData.repair_date != null && defectData.repair_date !== '') {
        message += " Within Tolerance indicators cannot have 'Repair Date'. ";
      }
      if (
        defectData.repair_report_id != null &&
        defectData.repair_report_id.length > 0
      ) {
        message +=
          " Within Tolerance indicators cannot have 'Repair Report Id'.";
      }
      if (
        defectData.repair_approved_by != null &&
        defectData.repair_approved_by.length > 0
      ) {
        message += " Within Tolerance indicators cannot have 'Approved By'.";
      }
    }

    if (message.length === 0) {
      console.log("Submitting defectData:", defectData);
      // make a copy before submitting it.
      const defectBody = Object.assign({}, defectData);
      let defectResp = await updateDefect(id, defectBody);
      //alert(`Updated measurement record: ${await measurementResp.text()}`);
      alert("Record saved!");
      //navigate(-1); // go to previous page
    } else {
      message += "\n Record not saved.";
      alert("Error: " + message);
    }
  };

  // const getMeasurementLocation = (location) => {
  //   console.log("getDefectLocation() called. with location: ", location);
  //   if (location != null) {
  //     if (location.trim() === "cw" || location.toLowerCase().includes("cent")) {
  //       return "Center Web";
  //     }
  //     if (
  //       location.trim() === "te" ||
  //       location.toLowerCase().includes("trail")
  //     ) {
  //       return "Trailing Edge";
  //     }
  //     if (location.trim() === "le" || location.toLowerCase().includes("lead")) {
  //       return "Leading Edge";
  //     }
  //   }
  //   return location;
  // };

  const updateRootFaceDistance = async (value) => {
    //TODO: find the corresponding image from this inspection for the provided distance.
    // then update image_id and root_face_distance properties all together.
    console.log("I came here image_id value = ", value);
    let inspectionId = inspectionData.id;
    let imageList = await findInspectionImage(inspectionId, value);
    console.log("refz100 image_id imageList = ", imageList, inspectionId);
    if (imageList != null && imageList.length > 0) {
      let imageId = imageList[0].id;
      setDefectProp("image_id", imageId);
      setDefectProp("root_face_distance", value);

      // setImageData(panorama_image_data);
      // setInspectionData(inspection_data);
      // setDistances(value);

      setPanoramaImageId(imageId);
      console.log("refz100 imageId=", imageId);
    } else {
      alert(
        `Error. A defect should match an existing 360 image. \n Could not find 360 image for inspection ${inspectionId} at distance: ${value}`
      );
    }
  };

  // User selects a new disposition, and validate the inputs in the process.
  const updateDisposition = (value) => {
    console.log("updateDisposition()");
    let newDefectData = Object.assign({}, defectData);

    //let currentStatus = measurementData["status"];
    newDefectData["ge_disposition"] = value;

    if (newDefectData["sso"] == null || newDefectData["sso"].trim() === "") {
      newDefectData["sso"] = loggedUser;
    }

    if (
      value != null &&
      (value.includes("No Repair") || value.includes("False"))
    ) {
      newDefectData["repair_date"] = "";
      newDefectData["repair_report_id"] = "";
      newDefectData["repair_approved_by"] = "";

      newDefectData["status"] = statusOptions[1]; // set to closed
    }

    if (
      value != null &&
      value.includes("Out of Tolerance") &&
      !areAllRequiredRepairFieldsProvided(newDefectData) === true
    ) {
      newDefectData["status"] = statusOptions[0]; // set to open
    } else {
      newDefectData["status"] = statusOptions[1]; // set to close
    }

    console.log('newDefectData:',newDefectData);
    setDefectData(newDefectData);
  };

  // determines whether we can close a defect given its properties
  const checkDispositionConditions = (newDefectData) => {
    console.log("checkDispositionConditions()");
    let canClose = true;

    console.log("newMeasurementDAta = ", newDefectData);

    if (
      newDefectData["ge_disposition"] == null ||
      newDefectData["ge_disposition"] === ""
    ) {
      canClose = false; // we need disposition to be present
    }

    // determines whether repair is needed
    let repairNeeded = false;
    if (newDefectData["ge_disposition"] != null) {
      if (newDefectData["ge_disposition"].includes("Out of")) {
        repairNeeded = true;
      }

      // if repair is needed, then we look for situations when not to close it.
      // if repair needed and not yet closed
      if (
        repairNeeded === true &&
        !areAllRequiredRepairFieldsProvided(newDefectData) === true
      ) {
        canClose = false;
      }

      if (newDefectData["ge_disposition"].includes("False")) {
        canClose = true;
      }
    }

    return canClose;
  };

  const updateRepairDate = (value) => {
    let status = getDefectProp("status");
    setDefectProp("repair_date", value.toString());
  };

  const handleIncludeAnnotationsChange = (event) => {
    let includeAnnotations = event.target.checked;
    setDoIncludeAnnotations(includeAnnotations);
    setMeasurementUrl(getMeasurementImageUrl(id, includeAnnotations));
  };

  // -------------------------------- 360 Image Snapshot functions -------------------------

  const getImageViewCoordinates = () => {
    let panorama = imageRef.current.panorama; // is of Viewer class
    let pitch = panorama.getPitch();
    let yaw = panorama.getYaw();
    let hfov = panorama.getHfov();

    return { pitch: pitch, yaw: yaw, hfov: hfov };
  };

  const getScreenshotImage = () => {
    let panorama = imageRef.current.panorama; // is of Viewer class
    console.log("getScreenshotImage() for panorama:", panorama);
    let pitch = panorama.getPitch();
    let yaw = panorama.getYaw();
    let hfov = panorama.getHfov();

    let img = panorama
      .getRenderer()
      .render(
        (pitch / 180) * Math.PI,
        (yaw / 180) * Math.PI,
        (hfov / 180) * Math.PI,
        { returnImage: true }
      );

    return img;
  };

  const getSnapName = (index) => {
    let distance = getDefectProp("root_face_distance");
    return (
      `snap-z${distance.toFixed(1)}-s${index + 1}`.replace(".", "_") + ".png"
    );
  };

  const getNextSnapId = () => {
    return id;
  };

  const base64ToBytes = (base64) => {
    const binString = atob(base64);
    return Uint8Array.from(binString, (m) => m.codePointAt(0));
  };

  const snapImageScreenshotAndSave = async () => {
    console.log("snapImageScreenshotAndSave() called");

    let image_id = panoramaImageId;

    let coordinates = getImageViewCoordinates();
    let dataUrlContent = getScreenshotImage();
    let bareImageContent = dataUrlContent.replace("data:image/png;base64,", "");

    let snapFileName = getSnapName(getNextSnapId());

    let imageFile = new File([base64ToBytes(bareImageContent)], snapFileName, {
      type: "image/png",
      lastModified: new Date(),
    });

    let filename = imageFile.name;

    let respJson = {};
    if (imageFile != null) {
      // the defect itself
      const updatedDefectJson = Object.assign({}, defectData);
      updatedDefectJson.image_pitch = coordinates.pitch;
      updatedDefectJson.image_yaw = coordinates.yaw;
      updatedDefectJson.image_hfov = coordinates.hfov;
      updatedDefectJson.is_manual = true;
      updatedDefectJson.sso = loggedUser;

      // the parent of the defect
      const updatedMeasurementJson = Object.assign({}, measurementData);
      updatedMeasurementJson.image_pitch = coordinates.pitch;
      updatedMeasurementJson.image_yaw = coordinates.yaw;
      updatedMeasurementJson.image_hfov = coordinates.hfov;
      updatedMeasurementJson.is_manual = true;
      updatedMeasurementJson.sso = loggedUser;

      try {
        // the defect is a child of measurement
        let defectResp = await updateDefect(id, updatedDefectJson);
        console.log("updated defect rec:", defectResp);

        let measurementId = measurementData.id;
        let measurementResp = await updateMeasurement(
          measurementId,
          updatedMeasurementJson
        );
        console.log("updated measurement rec:", defectResp);

        // the measurement_file is attached to the measurement via the measurement_id
        respJson = await uploadImageMeasurementFile(measurementId, imageFile);
        console.log("upload measurementFile resp:", respJson);

        // deletes any previous annotation file associated to this measurement id
        let delRespJson = await deleteMeasurementAnnotationFile(id);
        console.log(
          "delete existing measurement annotation file resp:",
          delRespJson
        );

        reloadDefectImage();
        setImageIsLoaded(true);
        console.log("imageIsLoaded:", imageIsLoaded);
        console.log("imageError:", imageError);
      } catch (e) {
        console.log("Error uploading file:", e);
      }
    } else {
      console.log("skip upload of: ", filename);
    }
    setRedraw(redraw + 1 * 2);
    setShow360Image(false);
    //setShow360ImageLabel("Show 360 Image");
    window.location.reload();

    // changeShowScreenshots(true);
  };

// ====================================== process map ===============================
    // const CustomConnector = styled(StepConnector)(({ theme }) => ({
    //   '& .MuiStepConnector-line': {
    //     borderColor: theme.palette.divider,
    //   },
    // }));
    
    // const steps = [
    //   'Initiated',
    //   'Disposition Review',
    //   'Repair Process',
    //   'Repair Review',
    //   'Closed',
    // ];

  // ===================================== Evidence Files ================================

  const handleDeleteEvidenceFile = async (id) => {
    console.log(`handleDeleteEvidenceFile() called for id: ${id}`);
    let resp = await deleteDefectEvidenceFile(id);
    await fetchDefectEvidenceFileList();
  }

  const handleDownloadEvidenceFile = async (id, filename) => {
    console.log(`handleDownloadEvidenceFile() called for id: ${id}`);
    let url = getDefectEvidenceFileUrl(id);
    await downloadFileUrl(url, filename);
  }

  const getDefectRepairedImageUrl = (id) => {
    return `/api/defect/${id}/defect_repair_evidence_file?`;
  };

  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [defectRepairImageComments, setDefectRepairImageComments] = useState('');
  const [defectImageComments, setDefectImageComments] = useState('');
  const cameraRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (showCamera && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          streamRef.current = stream;
          if (cameraRef.current) {
            cameraRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Error accessing camera:", err);
          setShowCamera(false);
        });
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [showCamera]);

  const handleCapture = () => {
    const video = cameraRef.current;
    const canvas = document.createElement("canvas");

    if (video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        setCapturedBlob(blob);
      }, 'image/jpeg', 0.8);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setShowCamera(false);
    }
  };

  const handleSaveCapture = () => {
    if (capturedBlob) {
      const file = new File([capturedBlob], `repaired_image_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      
      const event = {
        target: {
          files: dataTransfer.files
        }
      };
      
      handleUploadEvidenceFiles(event);
      handleClear();
    }
  };

  const handleClear = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
      setCapturedBlob(null);
    }
  };

  // {/* Fetch defect image comments */}
  // useEffect(() => {
  //   handleFetchDefectImageComments();
  // }, []);

  {/* Save defect image comments */}
  const handleSaveDefectImageComments = async () => {
    try {
      const response = await fetch(
        `/api/defect/${id}/defect_image_file_comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comments: defectImageComments,
          }),
        }
      );
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };

  {/* Fetch defect image comments */}
  const handleFetchDefectImageComments = async () => {
    try {
      const response = await fetch(
        `/api/defect/${id}/defect_image_file_comments`
      );
      const data = await response.json();
      if (typeof data === "string") {
        setDefectImageComments(data);
      } else if (typeof data === "object" && data !== null) {
        setDefectImageComments("");
      } else {
        console.error("Unexpected data type received", data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  {/* Save repaired evidence comments */}
  const handleSaveRepairEvidenceComments = async () => {
    try {
      const response = await fetch(
        `/api/defect/${id}/defect_repair_evidence_comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comments: defectRepairImageComments,
          }),
        }
      );
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };

  {/* Fetch repair evidence comments */}
  const handleFetchRepairEvidenceComments = async () => {
    try {
      defectRepairImageComments = "";
      const response = await fetch(
        `/api/defect/${id}/defect_repair_evidence_comments`
      );
      const data = await response.json();
      if (typeof data === "string") {
        setDefectRepairImageComments(data);
      } else if (typeof data === "object" && data !== null) {
        setDefectRepairImageComments("");
      } else {
        console.error("Unexpected data type received", data);
      }
    } catch (error) {
      console.error(error);
    }
  };
  
  return (
    <div className="Inspection">
      <Suspense fallback={<Loading />}>
        <div className="indicatorReviewTitle" style={{ fontSize: 20 }}>
          <NavigateBeforeOutlinedIcon
            className="backButton"
            onClick={() => navigate(`/bladequality?esn=${inspectionData.esn}`)}
            style={{
              display: "grid",
              alignItems: "center",
              fontSize: 30,
              margin: 5,
              color: "seagreen",
              borderColor: "seagreen",
              fontWeight: "bold",
            }}
          />
          Indicator Review ({currentDefectIndex + 1} of {defectList.length}){" "}
          <br />
        </div>

        {filtersMessage != null && (
          <div style={{ fontSize: 20 }}>
            <span> Browsing defects where: </span> {filtersMessage}
            <br />
            <br />
          </div>
        )}

        {/* ------------------------- Navigation bar ------------------------ */}
        <Grid
          container
          direction="row"
          justifyContent="flex-start" // align buttons to left
          alignItems="center"
          spacing={2}
          className="buttonContainer"
        >
          {prevId != null && (
            <Button
              className="navButton"
              sx={{ m: 2 }}
              variant="contained"
              size="small"
              style={{ fontWeight: "light", backgroundColor: "seagreen" }}
              onClick={() => {
                let url = `/defect/${prevId}`;
                if (filtersQuery != null) {
                  url += `?filters=${filtersQuery}`;
                }
                navigate(url);
              }}
            >
              &larr; Previous
            </Button>
          )}

          <Button
            className="findingButton"
            sx={{ m: 2 }}
            variant="contained"
            size="small"
            style={{ fontWeight: "bold", backgroundColor: "seagreen" }}
            onClick={() => navigate(`/bladequality?esn=${inspectionData.esn}`)}
          >
            <GridOnOutlinedIcon style={{ marginRight: 5 }} />
            Review -{inspectionData.esn}- Findings
          </Button>

          {nextId != null && (
            <Button
              className="navButton"
              sx={{ m: 2 }}
              variant="contained"
              size="small"
              style={{ fontWeight: "bold", backgroundColor: "seagreen" }}
              onClick={() => {
                let url = `/defect/${nextId}`;
                if (filtersQuery != null) {
                  url += `?filters=${filtersQuery}`;
                }
                navigate(url);
              }}
            >
              Next &rarr;
            </Button>
          )}

          {/* <Button
              className="saveButton"
              variant="contained"
              size="medium"
              style={{ fontWeight: "bold" }}
              type="submit"
              >
              Save
            </Button> */}
          <Button
            className="saveButton"
            variant="contained"
            size="medium"
            style={{ fontWeight: "bold" }}
            onClick={handleSubmit}
          >
            Save
          </Button>
        </Grid>

        {/* ---------------------------- PROCESS MAP -------------------------- */}
        {/* <Stepper alternativeLabel connector={<CustomConnector />} className='processMap'>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel
                StepIconComponent={() =>
                  index < steps.length - 1 ? (
                    <CheckCircleIcon style={{ color: 'seagreen' }} />
                  ) : (
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: 'gold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {index + 1}
                    </div>
                  )
                }
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper> */}

        {/* ---------------------------- BEGIN FORM -------------------------- */}
        {/* <form onSubmit={handleSubmit} className="form"> */}
        <form className="form">
          <Grid
            container
            direction="row"
            rowSpacing={4}
            columnSpacing={{ xs: 2, sm: 3, md: 4 }}
          >
            {/* ---------------------------------- Form body ---------------------------------- */}
            <Grid item md={8} className="inputContainer">
              <DetailedForm
                getDefectId={getDefectId}
                formatDate={formatDate}
                getDefectProp={getDefectProp}
                setDefectProp={setDefectProp}
                bladeSections={bladeSections}
                distances={distances}
                updateRootFaceDistance={updateRootFaceDistance}
                measurementSeverityTable={defectSeverityTable}
                defectDispositionOptions={defectDispositionOptions}
                getDefectTolerance={getDefectTolerance}
                updateDisposition={updateDisposition}
                updateRepairDate={updateRepairDate}
                defectData={defectData}
                statusOptions={statusOptions}
              />
            </Grid>

            {/* Moved the save button up in Navigation Bar */}
            {/* ---------------------------- Save -------------------------- */}
            {/* It uses the submit function of the form. it calls handleSubmit */}
            {/* <Grid
              container
              md={12}
              direction="row"
              justifyContent="center"
              alignItems="center"
            >
              
              <Button
              className="saveButton"
              variant="contained"
              size="medium"
              style={{ fontWeight: "bold", backgroundColor: "seagreen" }}
              type="submit"
              >
              Save
            </Button>
             
            </Grid> */}
          </Grid>
        </form>
        {/* ---------------------------- END FORM -------------------------- */}

        {/* Since defects are derived form measurement, they are read-only by default */}
        <Grid
          sx={{ flexGrow: 1 }}
          container
          spacing={2}
          style={{ margin: 5 }}
          className="formField"
        >
          {/* ---------------------------------- Defect image -------------------------------- */}

          {/* Defect Image Section */}
          <Grid item xs={6}>
            {/* <img style={{margin:0, maxwidth:"100%"}} src={getDefectImageUrl(id)}  className="defectImage"></img> */}

            <div
              style={{
                position: "relative",
                width: "600px",
                overflow: "hidden",
              }}
            >
              <div
                ref={defectImageContainerRef}
                style={{
                  overflow: "hidden",
                  width: "600px",
                }}
                onWheel={(event) => handleWheel(event, "defect")}
                onClick={(event) => handleImageClick(event, "defect")}
              >
                <img
                  style={{
                    width: "600px",
                    height: "auto",
                    transition: "transform 0.3s ease",
                    transform: `scale(${zoomLevels.defect})`,
                    transformOrigin: transformOrigins.defect,
                  }}
                  src={getDefectImageUrl(id)}
                  alt="Zoomable"
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => zoomIn("defect")}
                >
                  <ZoomInIcon />
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => zoomOut("defect")}
                >
                  <ZoomOutIcon />
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => resetZoom("defect")}
                >
                  <RefreshIcon />
                </Button>
              </div>
            </div>
          </Grid>

          {/* ---------------------------------- CAD figures -------------------------------- */}
          {showCadFigures && (
            <Grid item xs={6}>
              <Grid container justifyContent="center">
                <img
                  style={{ margin: 5 }}
                  align="center"
                  width="500"
                  objectFit="contain"
                  height="100%"
                  src={getSideViewImageUrl(
                    defectData.root_face_distance,
                    defectData.location,
                    getColor(defectData.finding_type)
                  )}
                  loading="lazy"
                />

                <br />

                <img
                  style={{ margin: 5 }}
                  align="center"
                  width="250"
                  objectFit="contain"
                  height="100%"
                  src={getCrossSectionImageUrl(
                    defectData.root_face_distance,
                    defectData.location,
                    getColor(defectData.finding_type)
                  )}
                  loading="lazy"
                />
              </Grid>
            </Grid>
          )}

          {/* ---------------------------------- Repair Evidence Files -------------------------------- */}
          {/* Repair Evidence Section */}
          <Grid item xs={6}>
            <Accordion defaultExpanded={true}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1-content"
                id="panel1-header"
                sx={{ fontWeight: "bold" }}
              >
                Repair Evidence Files
              </AccordionSummary>
              <AccordionDetails>
                <List dense={true}>
                  {evidenceFileList.map((item) => (
                    <ListItem
                      key={item.id}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteEvidenceFile(item.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar>
                          <IconButton
                            onClick={() =>
                              handleDownloadEvidenceFile(item.id, item.filename)
                            }
                          >
                            <CloudDownloadIcon />
                          </IconButton>
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={item.filename} />
                    </ListItem>
                  ))}
                </List>
                {(() => {
                  const imageFile = evidenceFileList.find(
                    (item) =>
                      item.filename.endsWith(".jpg") ||
                      item.filename.endsWith(".png")
                  );
                  return (
                    imageFile && (
                      <div
                        style={{
                          position: "relative",
                          width: "600px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          ref={repairImageContainerRef}
                          style={{
                            overflow: "hidden",
                            width: "600px",
                          }}
                          onWheel={(event) => handleWheel(event, "repair")}
                          onClick={(event) => handleImageClick(event, "repair")}
                        >
                          <img
                            style={{
                              width: "600px",
                              height: "auto",
                              transition: "transform 0.3s ease",
                              transform: `scale(${zoomLevels.repair})`,
                              transformOrigin: transformOrigins.repair,
                            }}
                            src={getDefectRepairedImageUrl(imageFile.id)}
                            alt="Zoomable"
                          />
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                          }}
                        >
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => zoomIn("repair")}
                          >
                            <ZoomInIcon />
                          </Button>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => zoomOut("repair")}
                          >
                            <ZoomOutIcon />
                          </Button>
                          <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => resetZoom("repair")}
                          >
                            <RefreshIcon />
                          </Button>
                        </div>
                      </div>
                    )
                  );
                })()}
              </AccordionDetails>
            </Accordion>
            {/* Camera Preview Section */}
            {showCamera && (
              <div className="relative grid border border-gray-300 rounded-lg p-4 bg-gray-100">
                <div className="absolute top-2 left-2 flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleCapture}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Capture
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setShowCamera(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <video
                  ref={cameraRef}
                  autoPlay
                  className="w-full h-auto border border-blue-500"
                />
              </div>
            )}

            {capturedImage && !showCamera && (
              <div className="relative grid border border-gray-300 rounded-lg p-4 bg-gray-100">
                <div className="absolute top-2 left-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleSaveCapture();
                    }}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleClear();
                      setShowCamera(true);
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Retake
                  </Button>
                </div>
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-auto border border-blue-500"
                />
              </div>
            )}
          </Grid>
          <Grid item xs={6}>
            <>
              <Button
                style={{ marginTop: 5, marginLeft: 5, marginBottom: 2 }}
                color="secondary"
                variant="outlined"
                onClick={handleSaveDefectImageComments}
              >
                Save Defect Image Notes
              </Button>
              {/* Defect Image Comments Section */}
              <div style={{ marginTop: 10 }}>
                <DebouncedCommentsField
                  imageComments={defectImageComments || ""}
                  setImageComments={setDefectImageComments}
                  label="Defect Image Notes"
                  placeholder="Add notes related to the above defect image and press Save Defect Image Notes."
                />
              </div>
            </>
          </Grid>
          <Grid item xs={6}>
            <>
              <label htmlFor="upload-evidence">
                <input
                  style={{ marginTop: 2, display: "none" }}
                  id="upload-evidence"
                  name="upload-evidence"
                  type="file"
                  multiple
                  onChange={handleUploadEvidenceFiles}
                />
                <Button
                  style={{ marginTop: 5, marginLeft: 5, marginBottom: 2 }}
                  color="secondary"
                  variant="outlined"
                  component="span"
                >
                  Upload Repair Evidence Files
                </Button>
              </label>
              {!showCamera && !capturedImage && (
                <Button
                  style={{ marginTop: 5, marginLeft: 5, marginBottom: 2 }}
                  color="primary"
                  variant="outlined"
                  onClick={() => setShowCamera(true)}
                >
                  <Camera className="h-4 w-4" />
                  Capture with Camera
                </Button>
              )}
              {evidenceFileList && (
                <Button
                  style={{ marginTop: 5, marginLeft: 5, marginBottom: 2 }}
                  color="secondary"
                  variant="outlined"
                  onClick={handleSaveRepairEvidenceComments}
                >
                  Save Repair Closing Remarks
                </Button>
              )}
              {/* Review Comments Section */}
              <div style={{ marginTop: 10 }}>
                <DebouncedCommentsField
                  imageComments={defectRepairImageComments || ""}
                  setImageComments={setDefectRepairImageComments}
                  label="Closing Remarks/Comments"
                  placeholder="Enter comments to be saved along with the repair evidence file"
                />
              </div>
            </>
          </Grid>
        </Grid>

        {/* ---------------------------------- 360 image -------------------------------- */}
        <Grid
          container
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start"
          md={12}
        >
          <ToggleButton
            className="imageButton"
            style={{
              margin: 5,
              color: "seagreen", //
              borderColor: "seagreen",
              fontWeight: "bold",
            }}
            size="small"
            variant="outlined"
            color="secondary"
            value="check"
            selected={show360Image}
            onChange={() => {
              if (!show360Image) setShow360ImageLabel("Hide 360 Image");
              else setShow360ImageLabel("Show 360 Image");

              setShow360Image(!show360Image);
            }}
          >
            {show360ImageLabel}
          </ToggleButton>
          {/* <ToggleButton
              className="imageButton"
              style={{
                margin: 5,
                color: "seagreen", //
                borderColor: "seagreen",
                fontWeight: "bold",
              }}
              size="small"
              variant="outlined"
              color="secondary"
              value="check"
              
              selected={showFlat360Image}
              onChange={() => {
                if (! showFlat360Image) setShowFlat360ImageLabel("Hide Flat 360 Image");
                else setShowFlat360ImageLabel("Show Flat 360 Image");
                
                setShowFlat360Image(!showFlat360Image);
              }}
            >
            {showFlat360ImageLabel}
          </ToggleButton> */}
        </Grid>

        {show360Image && (
          <Grid container direction="row" md={12}>
            <Pannellum
              className="cubemapImage"
              height="800px"
              ref={imageRef}
              image={getImageUrl(panoramaImageId)}
              hfov={100}
              haov={360}
              yaw={0}
              roll={30}
              pitch={0}
              autoLoad
              compass
              onLoad={() => {
                console.log(`image ${id} loaded`);

                let panorama = imageRef.current.panorama;
                const hotspotClick = (arg) => {
                  console.log("hotspotClick:", arg);
                };
                panorama.addHotSpot({
                  pitch: defectData.image_pitch,
                  yaw: defectData.image_yaw,
                  type: "info",
                  text: defectData.finding_type,
                  clickHandlerFunc: hotspotClick,
                });
              }}
              onMousedown={(evt) => {
                let button = evt.button;
                console.log("Mouse Down", evt);
              }}
              onMouseup={(evt) => {
                console.log("Mouse Up", evt);
              }}
              hotstpotDebug={true}
            />
          </Grid>
        )}

        {showFlat360Image && (
          <Grid container direction="row" md={12}>
            <img
              src={getImageUrl(panoramaImageId)}
              className="cubemapImage"
              height="800px"
            ></img>
          </Grid>
        )}
      </Suspense>
    </div>
  );
}

export default DefectPage;
