import "./ImageInspection2d.css";
import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Loading from "../../components/Loading";
import CameraAltIcon from "@mui/icons-material/Save";
import DrawOutlinedIcon from "@mui/icons-material/DrawOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import DownloadingIcon from "@mui/icons-material/Downloading";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import UpdateIcon from "@mui/icons-material/Update";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ImageAnnotation from "./ImageAnnotation";
import Alert from '@mui/material/Alert';

import { useCustomStateHook } from "../../utils/useCustomState/useCustomStateHook";
import {
  defectLabels,
  emptyMeasurement,
  snapWidth,
  snapHeight,
  getImageUrl,
  getDownloadFilesUrl,
  getDownloadSnapshotsUrl,
  getImageThumbnailUrl,
  getMeasurementImageFileUrl,
  getMeasurementThumbnailUrl,
  getDownloadSnapshotsAnd360ImagesUrl,
} from "../../utils/utils";

import {
  TextField,
  FormControl,
  FormLabel,
  Button,
  Typography,
  Stack,
  Card,
  Grid,
  Checkbox,
  FormControlLabel,
  Paper,
  Select,
  InputLabel,
  Snackbar,
  Slider,
} from "@mui/material";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import ImageListItemBar from "@mui/material/ImageListItemBar";
import MenuItem from "@mui/material/MenuItem";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Divider from "@mui/material/Divider";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import { styled } from "@mui/material/styles";

import dayjs from "dayjs";
import {
  downloadInspectionDataAsync,
  getInspectionById,
  getInspectionImageList,
  updateInspection,
} from "../../services/inspection_api";
import {
  updateImage,
  getMeasurementListForImage,
} from "../../services/image_api";

import { Pannellum, PannellumVideo } from "pannellum-react";
import NavigateBeforeOutlinedIcon from "@mui/icons-material/NavigateBeforeOutlined";

import {
  deleteMeasurement,
  createMeasurement,
  uploadImageMeasurementFile,
  uploadAnnotationMeasurementFile,
  getMeasurementAnnotationFile,
} from "../../services/measurement_api";
import { isUserLoggedIn, getCurrentUser } from "../../services/login_api";
import { createInspectionLogEntry, getInspectionLogBodyObj } from "../../services/inspection_logs_api";

import { logInUser } from "../../services/login_api";
import { BLADE_TYPE_OPTIONS, FACTORY_NAME_OPTIONS, INSPECTION_LOCATION_OPTIONS, MANUFACTURE_STAGE_OPTIONS, SUPPLIER_OPTIONS } from "../../config";

import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import ZoomInIcon from "@material-ui/icons/ZoomIn";
import ZoomOutIcon from "@material-ui/icons/ZoomOut";
import RefreshIcon from "@material-ui/icons/Refresh";
import html2canvas from "html2canvas";

function ImageInspection2d() {

  // useControls from ract-zoom-pan-pinch
  //const { zoomIn, zoomOut, resetTransform } = useControls();

  const routeParams = useParams();
  const id = routeParams.id;
  console.log("Inspection id:", id);

  const emptyInspection = {
    app_type: "",
    customer_name: "",
    date: new Date().toISOString(),
    disp: "",
    engine_type: "",
    esn: "",
    id: id,
    location: "",
    misc: "",
    sect: "",
    sso: "",
    status: "Incomplete",
    annotation_status_comments: "",
    blade_type: "",
    manufacture_date: new Date().toISOString(),
    factory_name: "",
    inspector_name: "",
    manufacture_stage: "",
    certification_status: "",

    upload_date: new Date().toISOString(),
    d3_date: null,
    post_molding_date: null,
  };

  const formatDate = (date) => {
    return dayjs(date).format("YYYY-MM-DD");
  };

  // use state
  const {
    isLoading,
    setIsLoading,
    imageList,
    setImageList,
    measurementList,
    setMeasurementList,
    selectedMeasurementListIndex,
    setSelectedMeasurementListIndex,
    selectedImageIndex,
    setSelectedImageIndex,
    selectedLabelIndex,
    setSelectedLabelIndex,
    annotationPoints,
    setAnnotationPoints,
    annotationPolygons,
    setAnnotationPolygons,
    select2DMeasurement,
    fetchMeasurementListForImage,
    fetchMeasurementAnnotationFile,
    onAnnotationSave,
    getSnapName,
    showThumbnails,
    setShowThumbnails,
    showScreenshots,
    setShowScreenshots,
    showSnackbar,
    setShowSnackbar,
    snackbarMessage,
    setSnackbarMessage,
    firstMeasurementImage,
    prevMeasurementImage,
    nextMeasurementImage,
    lastMeasurementImage,
    changeShowScreenshots,
    defectDesc,
    setDefectDesc,
    defectLocation,
    setDefectLocation,
    defectSeverity,
    setDefectSeverity,
    defectSize,
    setDefectSize,
    distance,
    setDistance,
    grayOutSaveButton,
    setGrayOutSaveButton,
  } = useCustomStateHook(id);

  // const [isLoading, setIsLoading] = useState(false);
  // const [imageList, setImageList] = useState([]); // 360 images
  // const [measurementList, setMeasurementList] = useState([]); // 2d snapshots used for measurement
  // const [selectedMeasurementListIndex, setSelectedMeasurementListIndex] = useState(0);

  // const [selectedLabelIndex, setSelectedLabelIndex] =  useState(defaultLabelIndex); //'Other' is default
  // const [annotationPoints, setAnnotationPoints] = useState([]);
  // const [annotationPolygons, setAnnotationPolygons] = useState([]);
  // const [showThumbnails, setShowThumbnails] = useState(false);
  // const [showScreenshots, setShowScreenshots] = useState(false);
  // const [showSnackbar, setShowSnackbar] = useState(false);
  // const [snackbarMessage, setSnackbarMessage] = useState("");

  const selectLabel = (index) => {
    setSelectedLabelIndex(index);
  };

  // const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [inspectionData, setInspectionData] = useState(emptyInspection);

  // Inspection properties used in the form
  const [appType, setAppType] = useState(emptyInspection.app_type);
  const [customerName, setCustomerName] = useState(
    emptyInspection.customer_name
  );
  const [costumCustomerName, setCostumCustomerName] = useState(
    emptyInspection.customer_name
  );
  const [inspectionDate, setInspectionDate] = useState(formatDate(new Date()));
  const [disp, setDisp] = useState(emptyInspection.disp);
  const [engineType, setEngineType] = useState(emptyInspection.engine_type);
  const [esn, setEsn] = useState(emptyInspection.esn);
  const [location, setLocation] = useState(emptyInspection.location);
  const [customLocation, setCustomLocation] = useState(
    emptyInspection.location
  );
  const [misc, setMisc] = useState(emptyInspection.misc);
  const [sect, setSect] = useState(emptyInspection.sect);
  const [sso, setSso] = useState(emptyInspection.sso);
  const [status, setStatus] = useState(emptyInspection.status);
  const [annotation_status_comments, setAnnotation_status_comments] = useState(emptyInspection.annotation_status_comments);
  const [uploadDate, setUploadDate] = useState(
    formatDate(emptyInspection.upload_date)
  );
  const [d3Date, setD3Date] = useState(formatDate(emptyInspection.d3_date));
  const [postMoldingDate, setPostMoldingDate] = useState(
    formatDate(emptyInspection.post_molding_date)
  );

  // Newly introduced properties
  const [bladeType, setBladeType] = useState(emptyInspection.blade_type);
  const [manufactureDate, setManufactureDate] = useState(
    emptyInspection.manufacture_date
  );
  const [factoryName, setFactoryName] = useState(emptyInspection.factory_name);
  const [customFactoryName, setCustomFactoryName] = useState("");
  const [supplier, setSupplier] = useState(emptyInspection.supplier);
  const [inspectorName, setInspectorName] = useState(
    emptyInspection.inspector_name
  );
  const [manufactureStage, setManufactureStage] = useState(
    emptyInspection.manufacture_stage
  );
  const [customManufactureStage, setCustomManufactureStage] = useState("");

  const [certificationStatus, setCertificationStatus] = useState(
    emptyInspection.certification_status
  );

  const [shotImage, setShotImage] = useState("");
  const [loggedIn, setLoggedIn] = useState("false");

  const [bladeTypeAlert, setBladeTypeAlert] = useState(false);
  const [manufactureStageAllert, setManufactureStageAlert] = useState(false);
  const [supplierAlert, setSupplierAlert] = useState(false);
  const [factoryNameAlert, setFactoryNameAlert] = useState(false);
  const [locationAlert, setLocationAlert] = useState(false);

  const handleShowThumbnailsChange = (event) => {
    //setShowThumbnails(event.target.checked);
    setShowThumbnails(false);
  };
  const loggedUser = localStorage.getItem("loggedSSO");

  const imageRef = useRef(); // 360 image
  const screenshotRef = useRef(); // div surrounding 360 image


  const bladeTypeOptions = BLADE_TYPE_OPTIONS;

  //  The "Other" option should open a text field where you can type in an answer]
  const manufactureStageOptions = MANUFACTURE_STAGE_OPTIONS;

  const supplierOptions = SUPPLIER_OPTIONS;

  const factoryNameOptions = FACTORY_NAME_OPTIONS;

  const inspectionLocationOptions = INSPECTION_LOCATION_OPTIONS;


  const navigate = useNavigate();

  // Use this method If we want to keep all within a single json object...
  const handleInspectionDataChange = (event) => {
    const { name, value } = event.target;
    setInspectionData((inspectionData) => ({
      ...inspectionData,
      [name]: value,
    }));
  };

  const select360Image = async (index) => {
    setIsLoading(true);
    console.log("select360Image() called for:", index);

    if (index >= 0) {
      setSelectedImageIndex(index);
      console.log("imageList:", imageList);

      let selectedImage = imageList[index];
      if (selectedImage != null) {
        setDistance(selectedImage.distance);
        setDefectDesc(selectedImage.defect_desc);
        setDefectLocation(selectedImage.defect_location);
        setDefectSeverity(selectedImage.defect_severity);
        setDefectSize(selectedImage.defect_size);
      }
      console.log("selected image inIMageInspection:", selectedImage);
      if (selectedImage != null) {
        console.log(
          "05 fetchMeasurementListForImage selectedImage = ",
          selectedImage
        );

        await fetchMeasurementListForImage(selectedImage.id);
        console.log("useEffect index that used to be zero = ", index);
        await select2DMeasurement(0);
        console.log(
          "out of the await, and about to rerender select2DMeasurement"
        );
      } else {
        console.log("skip fetch measurement list");
      }
    }
    setIsLoading(false);
  };

  // Added by H, to make sure the component is re-rendered after measurement List change
  useEffect(() => {
    async function doit() {
      console.log(
        "useEffect: about to await the select2DMeasurement in the useEffect"
      );
      await select2DMeasurement(0);
      console.log(
        "useEffect: out of the await, and about to rerender select2DMeasurement"
      );
      setRerender(rerender + 1);
    }
    try {
      doit();
    } catch (error) {
      console.log("there is no select2DMeasurement (0)", error);
    }
  }, [measurementList]);

  // Populates the react props we created for this component
  const unpackInspectionData = (data) => {
    console.log("unpackInspectionData() called with:", data);
    setInspectionData(data);

    setEsn(data["esn"] || "");
    setInspectionDate(data["date"]);
    setCustomerName(data["customer_name"] || "");
    setLocation(data["location"] || "");
    setEngineType(data["engine_type"] || "");
    setAppType(data["app_type"] || "");
    setDisp(data["disp"] || "");
    setMisc(data["misc"] || "");
    setSect(data["sect"] || "");
    setSso(data["sso"] || "");
    setStatus(data["status"] || "Incomplete");
    setAnnotation_status_comments(data["annotation_status_comments"] || "")
    setBladeType(data["blade_type"] || "");
    setManufactureDate(data["manufacture_date"] || "");
    setSupplier(data["supplier"] || "");
    setFactoryName(data["factory_name"] || "");
    setInspectorName(data["inspector_name"] || "");
    setManufactureStage(data["manufacture_stage"] || "");
    setCertificationStatus(data["certification_status"] || "");

    setUploadDate(data["upload_date"]);
    setD3Date(data["d3_date"]);
    setPostMoldingDate(data["post_molding_date"]);


    console.log('bladeType:', bladeType)

  };

  const fetchImageList = async () => {
    console.log("fetchImageList()");
    const imgListData = await getInspectionImageList(id);
    console.log("GET inspection image list:", imgListData);
    if (imgListData != null && imgListData.length > 0) {
      console.log("set image list...");
      sortListByDistance(imgListData);
      console.log("sorted image list:", imgListData);
      setImageList(imgListData);
    }
    // update defect data in UI form
    select360Image(selectedImageIndex);
    let selectedImage = imgListData[selectedImageIndex];
    if (selectedImage != null) {
      console.log(
        "01 fetchMeasurementListForImage selectedImage = ",
        selectedImage
      );
      await fetchMeasurementListForImage(selectedImage.id);
      await select2DMeasurement(0);
    } else {
      console.log("selectedImage is null. Will not fetch measurement data");
    }
  };

  const [rerender, setRerender] = useState(0);

  // in place sort
  const sortListByDistance = (data) => {
    data = data.sort((a, b) => {
      if (!a.distance) a.distance = 0;
      if (!b.distance) b.distance = 0;
      return a.distance - b.distance;
    });
  };

  // called after the component is created
  useEffect(() => {
    const res = isUserLoggedIn(getCurrentUser());

    console.log("In usestate for header, res = ", res);
    if (res) setLoggedIn("true");
    else setLoggedIn("false");

    async function fetchInspectionData() {
      try {
        const data = await getInspectionById(id);
        console.log("Read Inspection data:", data);
        if (data != null && data.id > 0) {
          console.log("set inspection data...");
          unpackInspectionData(data);
          await fetchImageList();
        }

        // Set the url only after receiving the inspection data from the server, to prevent
        // re-rendering
        //setInspectionVideoUrl("/videos/Sample-360-video.mp4");
      } catch (error) {
        console.log(error);
      }
    }

    console.log("useEffect()");
    fetchInspectionData();
    // no return function.
    // we could return a cleanup function here.
  }, [id, loggedUser]);

  const handleInspectionSubmit = async (event) => {
    event.preventDefault();

    console.log(
      `handleInspectionSubmit() called with event.target:`,
      event.target
    );

    if (annotation_status_comments === '' && status === 'Partial') {
      setError(true);
      return; // Prevent the form submission
    } else {
      setError(false);
    }

    const inspectionBody = {
      app_type: appType === "" ? null : appType,
      customer_name: customerName === "" ? null : customerName,
      date: inspectionDate === "" ? null : inspectionDate,
      disp: disp === "" ? null : disp,
      engineType: engineType == "" ? null : engineType,
      esn: esn === "" ? null : esn,
      location: location === "" ? null : location,
      misc: misc === "" ? null : misc,
      sect: sect === "" ? null : sect,
      sso: sso === "" ? null : sso,
      status: status === "" ? null : status,
      annotation_status_comments:
        //  annotation_status_comments === "" ? null 
        annotation_status_comments,
      blade_type: bladeType === "" ? null : bladeType,
      manufacture_date: manufactureDate === "" ? null : manufactureDate,
      factory_name: factoryName === "" ? null : factoryName,
      inspector_name: inspectorName === "" ? null : inspectorName,
      manufacture_stage: manufactureStage === "" ? null : manufactureStage,
      certification_status:
        certificationStatus === "" ? null : certificationStatus,

      upload_date: uploadDate === "" ? null : uploadDate,
      d3_date: d3Date === "" ? null : d3Date,
      post_molding_date: postMoldingDate === "" ? null : postMoldingDate,
    };


    let inspectionResp = await updateInspection(id, inspectionBody);

    if (inspectionResp["message"] != null) {
      alert(`Error updating inspection: ${JSON.stringify(inspectionResp)}`);

      let logBody = getInspectionLogBodyObj(id, null,
        `Error updating inspection id# ${id}`,
        'UPDATE',
        'FAILURE',
        loggedUser);
      let createLogResp = await createInspectionLogEntry(logBody);

    } else {
      toast("Inspection updated.");

      let logBody = getInspectionLogBodyObj(id, null,
        `Updated inspection id# ${id}`,
        'UPDATE',
        'SUCCESS',
        loggedUser);
      let createLogResp = await createInspectionLogEntry(logBody);


    }

    // const selectedImage = imageList[selectedImageIndex];
    // console.log('saving selectedImage: ',selectedImage);
    // const imageBody = {
    //   blade_id: selectedImage.blade_id,
    //   defect_desc: selectedImage.defect_desc,
    //   defect_location: selectedImage.defect_location,
    //   defect_severity: selectedImage.defect_severity,
    //   defect_size: selectedImage.defect_size,
    //   distance: selectedImage.distance,
    //   inspection_id: selectedImage.inspection_id,
    //   timestamp: selectedImage.timestamp,
    // };

    // let imageResp = await updateImage(selectedImage.id, imageBody);
  };

  // const [error, setError] = useState(annotation_status_comments.length===0?true:false);
  const [error, setError] = useState(false);
  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    if (newStatus !== "Partial") {
      setAnnotation_status_comments(""); // Clear comments when status is not "Partial"
    }
  };
  const handleChange = (e) => {
    const value = e.target.value;
    setAnnotation_status_comments(value);
    setError(value.trim() === '');
  };

  const handleImageInfoSubmit = async (event) => {
    event.preventDefault();
    console.log("handleDefectSubmit()");
    const selectedImage = imageList[selectedImageIndex];
    selectedImage.defect_desc = defectDesc;
    selectedImage.defect_loc = defectLocation;
    selectedImage.defect_severity = defectSeverity;
    selectedImage.defect_size = defectSize;
    selectedImage.distance = distance;

    const imageBody = {
      blade_id: inspectionData.blade_id,
      defect_desc: defectDesc,
      defect_location: defectLocation,
      defect_severity: defectSeverity,
      defect_size: defectSize,
      distance: distance,
      inspection_id: inspectionData.id,
    };
    console.log("new image body:", imageBody);
    let imageResp = await updateImage(selectedImage.id, imageBody);

    alert(`Updated inspection image record: ${await imageResp.text()}`);

    await fetchImageList();
  };

  // ============================= Screenshot Helpers =============================

  const pannelloScreenshot = () => {
    let img = getScreenshotImage();
    console.log("img:", img);
    setShotImage(img);
  };

  // const getScreenshotImage = () => {
  //   let panorama = imageRef.current.panorama; // is of Viewer class
  //   console.log("panorama:", panorama);
  //   let pitch = panorama.getPitch();
  //   let yaw = panorama.getYaw();
  //   let hfov = panorama.getHfov();

  //   let img = panorama
  //     .getRenderer()
  //     .render(
  //       (pitch / 180) * Math.PI,
  //       (yaw / 180) * Math.PI,
  //       (hfov / 180) * Math.PI,
  //       { returnImage: true }
  //     );

  //   return img;
  // };

  const getScreenshotImage = async () => {
    let canvas = await html2canvas(imageRef.current, {
      useCORS: true // in case you have images stored in your application
    });
    let img = await canvas.toDataURL();
    //console.log('return img:',img);
    return img;
  };

  // const getImageViewCoordinates = () => {
  //   let panorama = imageRef.current.panorama; // is of Viewer class
  //   let pitch = panorama.getPitch();
  //   let yaw = panorama.getYaw();
  //   let hfov = panorama.getHfov();

  //   return { pitch: pitch, yaw: yaw, hfov: hfov };
  // };

  const getImageViewCoordinates = () => {
    return { pitch: 0, yaw: 0, hfov: 0 };
  };

  const base64ToBytes = (base64) => {
    const binString = atob(base64);
    return Uint8Array.from(binString, (m) => m.codePointAt(0));
  };

  // returns the id of the next stap in the list
  const getNextSnapId = () => {
    //return new Date().getTime();
    return measurementList.length + 1;
  };

  const snapImageScreenshotAndSave = async () => {
    console.log("snapImageScreenshotAndSave() called");

    let selectedImage = imageList[selectedImageIndex];
    let image_id = selectedImage.id;

    let coordinates = getImageViewCoordinates();
    let dataUrlContent = await getScreenshotImage();
    let bareImageContent = dataUrlContent.replace("data:image/png;base64,", "");

    let snapFileName = getSnapName(getNextSnapId());

    let imageFile = new File([base64ToBytes(bareImageContent)], snapFileName, {
      type: "image/png",
      lastModified: new Date(),
    });
    let bladeId = 1;
    let inspectionId = id;
    let filename = imageFile.name;

    let respJson = {};
    if (imageFile != null) {
      let newMeasurementJson = Object.assign({}, emptyMeasurement);
      newMeasurementJson.image_id = image_id;
      newMeasurementJson.image_pitch = coordinates.pitch;
      newMeasurementJson.image_yaw = coordinates.yaw;
      newMeasurementJson.image_hfov = coordinates.hfov;
      newMeasurementJson.root_face_distance = selectedImage.distance;
      newMeasurementJson.location = selectedImage.sect;
      newMeasurementJson.is_manual = true;
      newMeasurementJson.sso = loggedUser;

      let measurementRecJson = await createMeasurement(newMeasurementJson);
      console.log("measurementRec:", measurementRecJson);
      let measurementId = measurementRecJson.id;

      if (measurementRecJson != null && measurementId != null) {
        respJson = await uploadImageMeasurementFile(measurementId, imageFile);
        console.log("measurementFile:", respJson);
      }
    } else {
      console.log("skip upload of: ", filename);
    }

    let measurementImageFileId = respJson["id"];

    if (measurementImageFileId != null) {
      console.log(
        "02 fetchMeasurementListForImage selectedImage = ",
        selectedImage
      );

      await fetchMeasurementListForImage(image_id);
      await select2DMeasurement(measurementList.length - 1); // select last
    } else {
      console.log("could not find new measurement reford for id");
    }

    // changeShowScreenshots(true);
  };

  const getMeasurementImageSubtitle = (item) => {
    let pitch = item.image_pitch?.toFixed(1) || 0;
    let yaw = item.image_yaw?.toFixed(1) || 0;
    let hfov = item.image_hfov?.toFixed(1) || 0;

    return `pitch:${pitch}, yaw:${yaw}, hfov:${hfov}`;
  };

  const deleteMeasurementRecord = async (measurement_id, image_id) => {
    console.log(
      `refz_delete deleteMeasurementImageFile() called with measurement_id = ${measurement_id}`
    );
    let resp = await deleteMeasurement(measurement_id);
    console.log("refz_delete  del response:", resp);
    console.log(
      "refz_delete  fetchMeasurementListForImage image_id = ",
      image_id
    );

    await fetchMeasurementListForImage(image_id);
  };

  const next360Image = () => {
    console.log("next360image()");
    let currIndex = selectedImageIndex;
    if (selectedImageIndex < imageList.length - 1) {
      select360Image(currIndex + 1);
    }
  };

  const prev360Image = () => {
    console.log("prev360image()");
    let currIndex = selectedImageIndex;
    if (selectedImageIndex > 0) {
      select360Image(currIndex - 1);
    }
  };

  const last360Image = () => {
    console.log("last360image()");
    select360Image(imageList.length - 1);
  };

  const first360Image = () => {
    console.log("first360image()");
    select360Image(0);
  };

  const downloadInspection = (inspection, snapshotsOnly = false, snapshotsAnd360 = false) => {
    console.log('downloadInspection() called with:', inspection, snapshotsOnly, snapshotsAnd360);
    downloadInspectionDataAsync(inspection, snapshotsOnly, snapshotsAnd360);
    toast(
      "Generating .zip file with snapshots. Download will start momentarily."
    )
  }


  // =========================== Avatar helper ========================================
  const StyledBadge = styled(Badge)(({ theme }) => ({
    "& .MuiBadge-badge": {
      backgroundColor: "#44b700",
      color: "#44b700",
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
      // '&::after': {
      //   position: 'absolute',
      //   top: 0,
      //   left: 0,
      //   width: '100%',
      //   height: '100%',
      //   borderRadius: '50%',
      //   animation: 'ripple 1.2s infinite ease-in-out',
      //   border: '1px solid currentColor',
      //   content: '""',
      // },
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

  const SmallAvatar = styled(Avatar)(({ theme }) => ({
    width: 22,
    height: 22,
    border: `2px solid ${theme.palette.background.paper}`,
  }));

  // =============================== Snackbar methods ===========================

  const toast = (message) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
  };

  const hideToast = () => {
    setShowSnackbar(false);
  };

  // ================================== Main page ===============================
  const [brightness, setBrightness] = useState(100);
  const handleBrightnessChange = (event, newValue) => {
    setBrightness(newValue);
  };

  // Function to reset brightness, contrast, and saturation to default values
  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  const [contrast, setContrast] = useState(100);
  const handleContrastChange = (event, newValue) => {
    setContrast(newValue);
  };

  const [saturation, setSaturation] = useState(100);
  const handleSaturationChange = (event, newValue) => {
    setSaturation(newValue);
  };

  const pannellumStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
  };

  // // Define pannellumStyle state
  // const [pannellumStyle, setPannellumStyle] = useState({
  //   filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
  // });

  // --------------------------------- Image zoom ----------------------------
  // const zoomIn = () => {
  //   setZoomLevel((prevZoomLevel) => Math.min(prevZoomLevel + 1, 5));
  // };

  // const zoomOut = () => {
  //   setZoomLevel((prevZoomLevel) => Math.max(prevZoomLevel - 1, 1));
  // };

  // const resetZoom = () => {
  //   setZoomLevel(1);
  //   setTransformOrigin("center center");
  //   setIsInitialClick(true);
  // }; 

  const Controls = () => {
    const { zoomIn, zoomOut, resetTransform } = useControls();
  
    return (
      <div className="tools">
        <button onClick={() => zoomIn()}> Zoom IN</button>
        <button onClick={() => zoomOut()}> Zoom OUT</button>
        <button onClick={() => resetTransform()}> RESET </button>
      </div>
    );
  };


  return (
    <Grid container sx={{ m: 2 }} className="Inspection">
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        message={snackbarMessage}
        onClose={(event, reason) => {
          hideToast();
        }}
      />

      {loggedIn === "true" && (
        <div>
          <div style={{ fontSize: 25, paddingTop: 20, paddingBottom: 20 }}>
            <NavigateBeforeOutlinedIcon
              onClick={() => navigate(`/blade?esn=${esn}`)}
              style={{ display: "grid", alignItems: "center", fontSize: 30 }}
            />
            Annotate Blade Images
            <br />
            <div style={{ fontSize: 20 }}>
              Blade: <span style={{ fontWeight: "bold" }}>{esn}</span>, Cavity:{" "}
              <span style={{ fontWeight: "bold" }}>{sect}</span>, Modality:{" "}
              <span style={{ fontWeight: "bold" }}>Blade Crawler</span>
            </div>
          </div>
          <Suspense fallback={<Loading />}>
            <Grid container sx={{ m: 2 }}>
              {/* <a href={getXLSReportUrl(id)} download="report.xlsx" target="_blank">
                <Button variant="contained" size="large" style={{ marginLeft: 16, backgroundColor: "seagreen" }}>
                  Download Indications Report
                </Button>
                </a> */}

              <Button
                variant="contained"
                size="small"
                style={{
                  backgroundColor: "darkslategray",
                  color: "white",
                  marginLeft: 10,
                }}
                onClick={() =>
                  downloadInspection(inspectionData, true, false)
                }
              >
                <DownloadingIcon style={{ marginRight: 5 }} /> 2D Snapshot Images
              </Button>

              <Button
                variant="contained"
                size="small"
                style={{
                  backgroundColor: "darkslategray",
                  color: "white",
                  marginLeft: 10,
                }}
                onClick={() =>
                  downloadInspection(inspectionData, false, true)
                }
              >
                <DownloadingIcon style={{ marginRight: 5 }} /> 2D Snapshots and 360 Images
              </Button>

              <Button
                variant="contained"
                size="small"
                style={{
                  backgroundColor: "darkslategray",
                  color: "white",
                  marginLeft: 10,
                }}
                onClick={() =>
                  downloadInspection(inspectionData, false, false)
                }
              >
                <FileDownloadIcon style={{ marginRight: 5 }} /> Full
                Inspection Data
              </Button>

            </Grid>

            <Grid
              container
              sx={{ m: 2 }}
              rowSpacing={4}
              columnSpacing={{ xs: 2, sm: 3, md: 4 }}
            >
              <form onSubmit={handleInspectionSubmit}>
                <Grid item md={12}>
                  <FormControl sx={{ margin: 0.5 }}>
                    <FormLabel>Blade Type</FormLabel>

                    <Select
                      name="blade_type"
                      size="small"
                      displayEmpty
                      renderValue={(selected) => {
                        if (bladeTypeOptions.includes(selected)) {
                          setBladeTypeAlert(false);
                          return selected;
                        } else {
                          setBladeTypeAlert(true);
                          return bladeType;
                        }
                      }}
                      onChange={(e) => setBladeType(e.target.value)}
                    >
                      {bladeTypeOptions.map((option, index) => (
                        <MenuItem key={index} value={option}>
                          {" "}
                          {option}{" "}
                        </MenuItem>
                      ))}

                    </Select>
                    {bladeTypeAlert && <Alert severity="warning">Non-standard value.</Alert>}
                  </FormControl>
                  <FormControl sx={{ margin: 0.5 }}>
                    <FormLabel>Factory Name</FormLabel>

                    <Select
                      name="factory_name"
                      size="small"
                      displayEmpty
                      renderValue={(selected) => {
                        if (factoryNameOptions.includes(selected)) {
                          setFactoryNameAlert(false);
                          return selected;
                        } else {
                          setFactoryNameAlert(true);
                          return factoryName;
                        }
                      }}
                      onChange={(e) => setFactoryName(e.target.value)}
                    >
                      {factoryNameOptions.map(
                        (option, index) => (
                          <MenuItem key={index} value={option}>
                            {" "}
                            {option}{" "}
                          </MenuItem>
                        )
                      )}
                    </Select>
                    {factoryNameAlert && <Alert severity="warning">Non-standard value.</Alert>}
                    {factoryName === "Other" && (
                      <TextField
                        name="custom_factory_name"
                        size="small"
                        value={customFactoryName || ""}
                        onChange={(e) => setCustomFactoryName(e.target.value)}
                      >
                        {" "}
                      </TextField>
                    )}
                  </FormControl>
                  <FormControl sx={{ margin: 0.5 }}>
                    <FormLabel>Inspection Location</FormLabel>
                    <Select
                      name="inpsection_location"
                      size="small"
                      displayEmpty
                      renderValue={(selected) => {
                        if (inspectionLocationOptions.includes(selected)) {
                          setLocationAlert(false);
                          return selected;
                        } else {
                          setLocationAlert(true)
                          return location;
                        }
                      }}
                      onChange={(e) => setLocation(e.target.value)}
                    >
                      {inspectionLocationOptions.map((option, index) => (
                        <MenuItem key={index} value={option}>
                          {" "}
                          {option}{" "}
                        </MenuItem>
                      ))}
                    </Select>
                    {locationAlert && <Alert severity="warning">Non-standard value.</Alert>}
                    {location === "Other" && (
                      <TextField
                        name="custom_inspection_location"
                        size="small"
                        value={customLocation}
                        onChange={(e) =>
                          setCustomManufactureStage(e.target.value)
                        }
                        placeholder="Enter custom location"
                        fullWidth
                      />
                    )}

                    {/* <TextField
                      name="location"
                      size="small"
                      value={location || ""}
                      onChange={(e) => setLocation(e.target.value)}
                    >
                      {" "}
                    </TextField> */}
                  </FormControl>
                  <FormControl sx={{ margin: 0.5 }}>
                    <FormLabel>Supplier</FormLabel>
                    <Select
                      name="supplier"
                      size="small"
                      displayEmpty
                      renderValue={(selected) => {
                        if (supplierOptions.includes(selected)) {
                          setSupplierAlert(false);
                          return selected;
                        } else {
                          setSupplierAlert(true);
                          return supplier;
                        }
                      }}
                      onChange={(e) => setSupplier(e.target.value)}
                    >
                      {supplierOptions.map((option, index) => (
                        <MenuItem key={index} value={option}>
                          {" "}
                          {option}{" "}
                        </MenuItem>
                      ))}
                    </Select>
                    {supplierAlert && <Alert severity="warning">Non-standard value.</Alert>}
                    {/* <TextField
                      name="factory_name"
                      size="small"
                      value={factoryName || ""}
                      onChange={(e) => setFactoryName(e.target.value)}
                    >
                      {" "}
                    </TextField> */}
                  </FormControl>
                  <FormControl sx={{ margin: 0.5 }}>
                    <FormLabel>Crawler Make</FormLabel>
                    <TextField
                      name="app_type"
                      size="small"
                      value={appType || ""}
                      onChange={(e) => setAppType(e.target.value)}
                    >
                      {" "}
                    </TextField>
                  </FormControl>
                  <FormControl sx={{ margin: 0.5 }}>
                    <FormLabel>Inspection Date</FormLabel>
                    <TextField
                      name="date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      value={formatDate(inspectionDate || new Date())}
                      onChange={(e) => setInspectionDate(e.target.value)}
                    >
                      {" "}
                    </TextField>
                  </FormControl>
                </Grid>

                <Grid item md={12} sy={{ m: 2 }}>
                  <FormControl sx={{ margin: 0.5 }}>
                    <FormLabel>Inspection Stage</FormLabel>
                    <Select
                      name="manufacture_stage"
                      size="small"
                      displayEmpty
                      renderValue={(selected) => {
                        if (manufactureStageOptions.includes(selected)) {
                          setManufactureStageAlert(false);
                          return selected;
                        } else {
                          setManufactureStageAlert(true);
                          return manufactureStage;
                        }
                      }}
                      onChange={(e) => setManufactureStage(e.target.value)}
                    >
                      {manufactureStageOptions.map((option, index) => (
                        <MenuItem key={index} value={option}>
                          {" "}
                          {option}{" "}
                        </MenuItem>
                      ))}
                    </Select>
                    {manufactureStageAllert && <Alert severity="warning">Non-standard value.</Alert>}
                    {manufactureStage === "Other" && (
                      <TextField
                        name="custom_manufacture_stage"
                        size="small"
                        value={customManufactureStage}
                        onChange={(e) =>
                          setCustomManufactureStage(e.target.value)
                        }
                        placeholder="Enter custom stage"
                        fullWidth
                      />
                    )}
                  </FormControl>
                  <FormControl sx={{ margin: 0.5 }}>
                    <FormLabel>Manufacture Date</FormLabel>
                    <TextField
                      name="manufacture_date"
                      type="date"
                      size="small"
                      value={formatDate(manufactureDate) || ""}
                      onChange={(e) => setManufactureDate(e.target.value)}
                    >
                      {" "}
                    </TextField>
                  </FormControl>
                  <FormControl sx={{ margin: 0.5 }}>
                    <FormLabel> Inspector Name</FormLabel>
                    <TextField
                      name="inspector_name"
                      size="small"
                      value={inspectorName || ""}
                      onChange={(e) => setInspectorName(e.target.value)}
                    >
                      {" "}
                    </TextField>
                  </FormControl>

                  <FormControl sx={{ margin: 0.5 }}>
                    <FormLabel>Inspector SSO/ID</FormLabel>
                    <TextField
                      name="sso"
                      size="small"
                      value={sso || ""}
                      onChange={(e) => setSso(e.target.value)}
                    >
                      {" "}
                    </TextField>
                  </FormControl>

                  {/* <FormControl>
                    <FormLabel>Certification Status</FormLabel>
                    <TextField
                      name="certification_status"
                      size="small"
                      value={certificationStatus || ""}
                      onChange={(e) => setCertificationStatus(e.target.value)}
                    >
                      {" "}
                    </TextField>
                  </FormControl> */}

                  <FormControl sx={{ margin: 0.5 }}>
                    <FormLabel>Annotation Status</FormLabel>
                    <Select
                      labelId="demo-simple-select-label"
                      name="status"
                      size="small"
                      value={status || "Incomplete"}
                      label="Status"
                      onChange={handleStatusChange}
                    >
                      <MenuItem value={"Complete"}>Complete</MenuItem>
                      <MenuItem value={"Incomplete"}>Incomplete</MenuItem>
                      <MenuItem value={"Partial"}>Partial</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl sx={{ margin: 0.495 }}>
                        <FormLabel sx={{ marginLeft: '7px' }}>Enter Comments</FormLabel>
                        <TextField
                          // label="Enter Comments"
                          name="annotation_status_comments"
                          variant="outlined"
                          size="small"
                          value={annotation_status_comments}
                          // onChange={(e)=> setAnnotation_status_comments(e.target.value)}
                          onChange={handleChange}
                          sx={{ marginLeft: 1 }}
                          error={error}
                          helperText={error ? 'Comments cannot be empty' : ''}
                        />
                      </FormControl>
                  {/* {status === "Partial" && (
                    <>
                      <FormControl sx={{ margin: 0.495 }}>
                        <FormLabel sx={{ marginLeft: '7px' }}>Enter Comments</FormLabel>
                        <TextField
                          // label="Enter Comments"
                          name="annotation_status_comments"
                          variant="outlined"
                          size="small"
                          value={annotation_status_comments}
                          // onChange={(e)=> setAnnotation_status_comments(e.target.value)}
                          onChange={handleChange}
                          sx={{ marginLeft: 1 }}
                          error={error}
                          helperText={error ? 'Comments cannot be empty' : ''}
                        />
                      </FormControl>
                    </>
                    // <TextField
                    //   // label="Enter Comments"
                    //   variant="outlined"
                    //   size="small"
                    //   value={partialStatus}
                    //   onChange={(e)=> setPartialStatus(e.target.value)}
                    //   sx={{ marginLeft: 1,marginTop:'26px'}}
                    // />
                  )} */}
                </Grid>

                <Grid item md={12}>
                  <FormControl sx={{ margin: 0.5 }}>
                    <FormLabel>Upload Date</FormLabel>
                    <TextField
                      name="upload_date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      value={formatDate(uploadDate || new Date())}
                      onChange={(e) => setUploadDate(e.target.value)}
                    >
                      {" "}
                    </TextField>
                  </FormControl>
                  <FormControl sx={{ margin: 0.5 }}>
                    <FormLabel>Firewall Insp Date</FormLabel>
                    <TextField
                      name="d3_date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      value={formatDate(d3Date || new Date())}
                      onChange={(e) => setD3Date(e.target.value)}
                    >
                      {" "}
                    </TextField>
                  </FormControl>
                  <FormControl sx={{ margin: 0.5 }}>
                    <FormLabel>Post-Molding Date</FormLabel>
                    <TextField
                      name="post_molding_date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      value={formatDate(postMoldingDate || new Date())}
                      onChange={(e) => setPostMoldingDate(e.target.value)}
                    >
                      {" "}
                    </TextField>
                  </FormControl>
                  <FormControl sx={{ margin: 0.5 }}>
                    <FormLabel>.</FormLabel>

                    <a target="_blank">
                      {/*This button calls the submit='' function in the form */}
                      <Button
                        className="saveButton"
                        variant="contained"
                        color="secondary"
                        type="submit"
                        size="medium"
                        style={{
                          marginLeft: 16,
                          backgroundColor: "seagreen",
                          padding: "10px 20px", // Add padding for better spacing
                          minWidth: "250px",
                          whiteSpace: "normal", // Allow text to wrap
                        }}
                      >
                        <UpdateIcon /> Update Inspection
                      </Button>
                    </a>
                  </FormControl>
                </Grid>
              </form>
            </Grid>

            {/* <Grid container>
          <Checkbox
            sx={{ marginTop: -1 }}
            checked={showThumbnails}
            onChange={handleShowThumbnailsChange}
            inputProps={{ "aria-label": "controlled" }}
          />
          <Typography>Show thumbnails</Typography>
              </Grid> */}

            {/* =================================== 360 images roll ============================================ */}

            <Grid
              container
              sx={{ m: 2 }}
              rowSpacing={2}
              columnSpacing={{ xs: 1, sm: 2, md: 3 }}
              style={{
                maxWidth: 1900,
                minWidth: 1900,
                minHeight: 900,
                overflow: "auto",
                backgroundColor: "whitesmoke",
                boxShadow: `2px 2px 2px 2px lightgray`,
              }}
            >
              {/* ---------------- Images side list ---------------------*/}
              {!showThumbnails && (
                <Grid item md={2}>
                  <div
                    align="center"
                    style={{
                      marginTop: -35,
                      fontWeight: "bold",
                      maxWidth: 300,
                    }}
                  >
                    <h3
                      style={{
                        paddingTop: 10,
                        color: "white",
                        backgroundColor: "#003839",
                        paddingBottom: 10,
                      }}
                    >
                      {"360-degree Images Roster"}
                    </h3>
                    <Button
                      variant="contained"
                      size="small"
                      style={{
                        minWidth: 50,
                        marginBottom: 5,
                        marginTop: -15,
                        backgroundColor: "seagreen",
                        color: "white",
                      }}
                      onClick={() => first360Image()}
                    >
                      <FirstPageIcon />
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      style={{
                        marginLeft: 5,
                        marginBottom: 5,
                        marginTop: -15,
                        backgroundColor: "seagreen",
                        color: "white",
                      }}
                      onClick={() => prev360Image()}
                    >
                      <ArrowBackIosIcon />
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      style={{
                        marginLeft: 5,
                        marginTop: -15,
                        marginBottom: 5,
                        backgroundColor: "seagreen",
                        color: "white",
                      }}
                      onClick={() => next360Image()}
                    >
                      <ArrowForwardIosIcon />
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      style={{
                        minWidth: 50,
                        marginLeft: 5,
                        marginTop: -15,
                        marginBottom: 5,
                        backgroundColor: "seagreen",
                        color: "white",
                      }}
                      onClick={() => last360Image()}
                    >
                      <LastPageIcon />
                    </Button>
                  </div>
                  <Paper
                    style={{ maxHeight: 900, maxWidth: 300, overflow: "auto" }}
                  >
                    <List
                      dense
                      sx={{
                        width: "100%",
                        maxWidth: 300,
                        bgcolor: "background.paper",
                      }}
                    >
                      {imageList.map((item, index) => (
                        <MenuItem
                          key={index}
                          selected={selectedImageIndex === index}
                          onClick={() => {
                            select360Image(index);
                          }}
                        >
                          {item.measurement_count === 0 && (
                            <ListItemAvatar>
                              <Avatar
                                src={getImageThumbnailUrl(item.id, true)}
                                alt={`id# ${item.id}`}
                              />
                            </ListItemAvatar>
                          )}

                          {item.measurement_count > 0 && (
                            <ListItemAvatar>
                              <StyledBadge
                                overlap="circular"
                                anchorOrigin={{
                                  vertical: "bottom",
                                  horizontal: "right",
                                }}
                                variant="dot"
                              >
                                <Avatar
                                  src={getImageThumbnailUrl(item.id, true)}
                                  alt={`id# ${item.id}`}
                                />
                              </StyledBadge>
                            </ListItemAvatar>
                          )}

                          <ListItemText
                            primary={item.location}
                            // here
                            secondary={`z = ${item?.distance?.toFixed(1)} m`}
                          />
                        </MenuItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              )}
              {!showScreenshots && (
                <Grid
                  item
                  md={8}
                  align="center"
                  minWidth={1300}
                  marginTop={-2}
                  style={pannellumStyle}
                >
                  <Typography
                    align="center"
                    style={{
                      minWidth: 1600,
                      paddingTop: 10,
                      paddingBottom: 10,
                      marginBottom: 0,
                      fontWeight: "bold",
                      fontSize: 20,
                      color: "white",
                      backgroundColor: "#003839",
                    }}
                  >
                    {" "}
                    360 View @Z ={" "}
                    {imageList[selectedImageIndex]?.distance?.toFixed(1)} m{" "}
                  </Typography>
                  
                  {/* ------------------------ Zoomable image -------------------- */}
                 
                 
                  <TransformWrapper
                    initialScale={1}
                    initialPositionX={200}
                    initialPositionY={100}
                  >
                    {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
                      <>
                        <Controls />
                        <TransformComponent >
                          <div ref={imageRef}>
                            <img src={getImageUrl(imageList[selectedImageIndex]?.id)}
                                width="100%"
                                height="800px"
                            />
                          </div>
                        </TransformComponent>
                      </>
                    )}
                  </TransformWrapper>
                 


                  {/* <Pannellum
                    width="122.5%"
                    height="800px"
                    ref={imageRef}
                    image={getImageUrl(imageList[selectedImageIndex]?.id)}
                    hfov={100}
                    haov={360}
                    yaw={0}
                    roll={30}
                    pitch={0}
                    autoLoad
                    compass
                    style={pannellumStyle}
                    onLoad={() => {
                      console.log(`image ${id} loaded`);
                    }}
                    onMousedown={(evt) => {
                      let button = evt.button;
                      console.log("Mouse Down", evt);
                      console.log("imageRef:", imageRef.current);
                      let viewer = imageRef.current.getViewer();
                      let panorama = imageRef.current.panorama;
                      console.log("panorama:", panorama);
                      let pitch = panorama.getPitch();
                      let yaw = panorama.getYaw();
                      let hfov = panorama.getHfov();

                      let yawBonds = panorama.getYawBounds();
                      let pitchBonds = panorama.getPitchBounds();

                      console.log("pitch:", pitch, "yaw:", yaw, "hfov:", hfov);
                      if (button === 2) {
                        let text = `pitch: ${pitch.toFixed(
                          2
                        )}, yaw: ${yaw.toFixed(2)}, roll: ${hfov.toFixed(
                          2
                        )}, yawBonds: ${yawBonds}, pitchBonds: ${pitchBonds}`;
                        const hotspotClick = (arg) => {
                          console.log("hotspotClick:", arg);
                        };
                        panorama.addHotSpot({
                          pitch: pitch,
                          yaw: yaw,
                          type: "info",
                          text: text,
                          clickHandlerFunc: hotspotClick,
                        });
                      }
                    }}
                    onMouseup={(evt) => {
                      console.log("Mouse Up", evt);
                    }}
                    hotstpotDebug={true}
                  /> */}

                  {/* ---------------------- Button toolbar ----------------------------- */}
                  <Grid item md={12} align="center" minWidth={1500}>
                    <Grid
                      container
                      alignItems="center"
                      justifyContent="center"
                      spacing={2}
                    >
                      <Grid item>
                        <Typography>Brightness</Typography>
                      </Grid>
                      <Grid item>
                        <Slider
                          value={brightness}
                          onChange={handleBrightnessChange}
                          aria-labelledby="brightness-slider"
                          min={0}
                          max={200}
                          style={{ width: 300 }}
                        />
                      </Grid>
                    </Grid>
                    <Grid
                      container
                      alignItems="center"
                      justifyContent="center"
                      spacing={2}
                    >
                      <Grid item>
                        <Typography>Contrast</Typography>
                      </Grid>
                      <Grid item>
                        <Slider
                          value={contrast}
                          onChange={handleContrastChange}
                          aria-labelledby="contrast-slider"
                          min={0}
                          max={200}
                          style={{ width: 300 }}
                        />
                      </Grid>
                    </Grid>
                    <Grid
                      container
                      alignItems="center"
                      justifyContent="center"
                      spacing={2}
                    >
                      <Grid item>
                        <Typography>Saturation</Typography>
                      </Grid>
                      <Grid item>
                        <Slider
                          value={saturation}
                          onChange={handleSaturationChange}
                          aria-labelledby="saturation-slider"
                          min={0}
                          max={200}
                          style={{ width: 300 }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item md={12} align="center" minWidth={1500}>
                    {measurementList[selectedMeasurementListIndex] == null && (
                      <div>
                        <Typography
                          style={{ fontWeight: "bold", fontSize: 25 }}
                        >
                          {" "}
                          <InputLabel
                            style={{
                              fontWeight: "bold",
                              fontSize: 25,
                              right: 350,
                            }}
                          >
                            Count of 2D Snapshots: 0{" "}
                          </InputLabel>
                        </Typography>
                      </div>
                    )}
                    {measurementList[selectedMeasurementListIndex] != null && (
                      <div>
                        <Typography>
                          {" "}
                          <InputLabel
                            style={{
                              fontWeight: "bold",
                              fontSize: 25,
                              right: 350,
                            }}
                          >
                            Count of 2D Snapshots: {measurementList.length}
                          </InputLabel>
                        </Typography>
                      </div>
                    )}
                    <Button
                      startIcon={<CameraAltIcon />}
                      style={{
                        right: 200,
                        marginTop: 10,
                        fontWeight: "bolder",
                        backgroundColor: "#705758",
                        fontSize: 16,
                      }}
                      variant="contained"
                      size="large"
                      onClick={snapImageScreenshotAndSave}
                    >
                      Take 2D Snapshot
                    </Button>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleReset}
                      style={{
                        marginTop: 10,
                        fontWeight: "bolder",
                        backgroundColor: "seagreen",
                        color: "white",
                        fontSize: 16,
                      }}
                    >
                      Reset Sliders
                    </Button>
                    <Button
                      startIcon={<DrawOutlinedIcon />}
                      style={{
                        left: 300,
                        marginTop: 10,
                        fontWeight: "bolder",
                        backgroundColor: "seagreen",
                        color: "white",
                        fontSize: 16,
                      }}
                      variant="contained"
                      size="large"
                      onClick={() => changeShowScreenshots(true)}
                    >
                      Annotate 2D Snapshots
                    </Button>
                  </Grid>
                </Grid>
              )}

              {/* ------------------------ Measurement thumbnails ---------------------- */}
              {showScreenshots && (
                <ImageAnnotation
                  selectedImageIndex={selectedImageIndex}
                  imageList={imageList}
                  getSnapName={getSnapName}
                  select2DMeasurement={select2DMeasurement}
                  changeShowScreenshots={changeShowScreenshots}
                  isLoading={isLoading}
                  getMeasurementImageSubtitle={getMeasurementImageSubtitle}
                  measurementList={measurementList}
                  selectedMeasurementListIndex={selectedMeasurementListIndex}
                  deleteMeasurementRecord={deleteMeasurementRecord}
                  snapWidth={snapWidth}
                  snapHeight={snapHeight}
                  annotationPoints={annotationPoints}
                  annotationPolygons={annotationPolygons}
                  getMeasurementImageFileUrl={getMeasurementImageFileUrl}
                  onAnnotationSave={onAnnotationSave}
                  firstMeasurementImage={firstMeasurementImage}
                  prevMeasurementImage={prevMeasurementImage}
                  nextMeasurementImage={nextMeasurementImage}
                  lastMeasurementImage={lastMeasurementImage}
                  ImageList={ImageList}
                  ImageListItem={ImageListItem}
                  getMeasurementThumbnailUrl={getMeasurementThumbnailUrl}
                  ImageListItemBar={ImageListItemBar}
                  setSelectedMeasurementListIndex={
                    setSelectedMeasurementListIndex
                  }
                  setSelectedLabelIndex={setSelectedLabelIndex}
                  setAnnotationPoints={setAnnotationPoints}
                  setAnnotationPolygons={setAnnotationPolygons}
                  grayOutSaveButton={grayOutSaveButton}
                  setGrayOutSaveButton={setGrayOutSaveButton}
                ></ImageAnnotation>
              )}

              {/* ---------------- Image thumbnails ---------------------*/}
              {showThumbnails && true && (
                <Grid
                  item
                  md={12}
                  sy={{ m: 2 }}
                  rowSpacing={2}
                  columnSpacing={{ xs: 1, sm: 2, md: 3 }}
                  style={{ maxWidth: 1850, overflow: "auto", marginTop: -20 }}
                >
                  <ImageList
                    sx={{
                      alignSelf: "flex-start",
                      flex: "1 0 auto",
                      justifyContent: "start",
                      alignItems: "center",
                      maxWidth: 1850,
                      maxHeight: 180,
                      overflowX: "scroll",
                    }}
                    cols={imageList.length}
                    gap={5}
                    rowHeight={140}
                    align="left"
                  >
                    {imageList.map((item, index) => (
                      <ImageListItem key={item.id}>
                        <img
                          align="left"
                          style={{
                            minWidth: 200,
                            maxWidth: 200,
                            maxHeight: 100,
                            border: "4px solid",
                            borderColor:
                              selectedImageIndex === index
                                ? "royalblue"
                                : "white",
                          }}
                          src={getImageThumbnailUrl(item.id, true)}
                          alt={`id# ${item.id}`}
                          loading="lazy"
                          onClick={() => {
                            setIsLoading(true);
                            console.log("isLoading = ", isLoading);
                            select360Image(index);
                            setIsLoading(false);
                          }}
                        />

                        {item.measurement_count > 0 && (
                          <StyledBadge
                            sx={{ marginTop: 0.5 }}
                            overlap="circular"
                            anchorOrigin={{
                              vertical: "top",
                              horizontal: "center",
                            }}
                            variant="dot"
                          />
                        )}

                        <ImageListItemBar
                          sx={{ marginLeft: 2, marginTop: -0.5 }}
                          align="center"
                          style={{ fontWeight: "bold", fontSize: 50 }}
                          title={item.location}
                          subtitle={`z-distance = ${item?.distance?.toFixed(
                            1
                          )} m`}
                          position="below"
                        />
                      </ImageListItem>
                    ))}
                  </ImageList>
                </Grid>
              )}

              {/* ---------------------- Side measurement details ----------------------------- */}
              <Grid item md={2}>
                {/* <form onSubmit={handleImageInfoSubmit}>
              <Stack>
                <FormControl>
                  <FormLabel>Z Distance</FormLabel>
                  <TextField
                    size="small"
                    value={distance.toFixed(2) || 0.0}
                    onChange={(e) => setDistance(parseFloat(e.target.value))}
                  ></TextField>
                </FormControl>
                <FormControl>
                  <FormLabel>Desc</FormLabel>
                  <TextField
                    size="small"
                    value={defectDesc || ""}
                    onChange={(e) => setDefectDesc(e.target.value)}
                  ></TextField>
                </FormControl>
                <FormControl>
                  <FormLabel>Defect Location</FormLabel>
                  <TextField
                    size="small"
                    value={defectLocation || ""}
                    onChange={(e) => setDefectLocation(e.target.value)}
                  ></TextField>
                </FormControl>
                <FormControl>
                  <FormLabel>Severity</FormLabel>
                  <TextField
                    size="small"
                    value={defectSeverity || ""}
                    onChange={(e) => setDefectSeverity(e.target.value)}
                  ></TextField>
                </FormControl>
                <FormControl>
                  <FormLabel>Size</FormLabel>
                  <TextField
                    size="small"
                    value={defectSize.toFixed(2) || 0.0}
                    onChange={(e) => setDefectSize(parseFloat(e.target.value))}
                  ></TextField>
                </FormControl>
              </Stack>

              <Button
                className="saveButton"
                variant="outlined"
                color="secondary"
                type="submit"
              >
                {" "}
                Save Defect{" "}
              </Button>
            </form> */}
              </Grid>
            </Grid>

            {/* =================================== measurements roll ============================================ */}
            <Grid
              container
              sx={{ m: 2 }}
              rowSpacing={2}
              columnSpacing={{ xs: 1, sm: 2, md: 3 }}
            >
              {/* ---------------- Measurements (2d snapshots) list ---------------------*/}
              {showThumbnails && (
                <Grid item md={2}>
                  <Paper style={{ maxHeight: 950, overflow: "auto" }}>
                    <List
                      dense
                      sx={{
                        width: "100%",
                        maxWidth: 360,
                        bgcolor: "background.paper",
                      }}
                    >
                      {measurementList.map((item, index) => (
                        <MenuItem
                          key={index}
                          selected={selectedMeasurementListIndex === index}
                          onClick={() => {
                            setIsLoading(true);
                            select2DMeasurement(index);
                            setIsLoading(false);
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              src={getMeasurementThumbnailUrl(item.id, true)}
                              alt={`id# ${item.id}`}
                            />
                          </ListItemAvatar>

                          <ListItemText
                            primary={getSnapName(item.id).split(".")[0]}
                            secondary={getMeasurementImageSubtitle(item)}
                          />
                        </MenuItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              )}

              {/* -------------------------------------- Labels bar ------------------------------------- */}
              {measurementList[selectedMeasurementListIndex] != null &&
                false && (
                  <Grid item md={2}>
                    <Paper style={{ maxHeight: 950, overflow: "auto" }}>
                      <List
                        dense
                        sx={{
                          width: "100%",
                          maxWidth: 360,
                          bgcolor: "background.paper",
                        }}
                      >
                        {defectLabels.map((item, index) => (
                          <MenuItem
                            key={item.id}
                            sx={{ selectedBackgroundColor: "blue" }}
                            selected={selectedLabelIndex === index}
                            onClick={() => selectLabel(index)}
                          >
                            <ListItemText primary={defectLabels[index]} />
                          </MenuItem>
                        ))}
                      </List>
                    </Paper>
                  </Grid>
                )}
            </Grid>
          </Suspense>
        </div>
      )}
    </Grid>
  );
}

export default ImageInspection2d;
