import "./MeasurementPage.css";
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
} from "@mui/material";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import ImageListItemBar from "@mui/material/ImageListItemBar";
import DetailedForm from "./DetailedForm";

import NavigateBeforeOutlinedIcon from "@mui/icons-material/NavigateBeforeOutlined";

import dayjs from "dayjs";
import {
  findInspectionImage,
  getInspectionById,
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
  deleteMeasurement,
  deleteMeasurementAnnotationFile,
  emptyMeasurement,
  getDefectSeverity,
  getMeasurement,
  getMeasurementDefectList,
  updateMeasurement,
  uploadImageMeasurementFile,
} from "../../services/measurement_api";
import {
  getSideViewImageUrl,
  getCrossSectionImageUrl,
} from "../../services/blade_api";
import GridOnOutlinedIcon from "@mui/icons-material/GridOnOutlined";
import { BLADE_CAVITIES, DEFECT_DISPOSITION_OPTIONS } from "../../config";

function MeasurementPage() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const routeParams = useParams();

  // ---------------------------------- id ----------------------------
  const id = routeParams.id;
  console.log("Measurement id:", id);


  // ----------------------------- SSO --------------------------------
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

  // We use time here to force the reload of the image upon upload
  const getMeasurementUrl = (id, includeAnnotations = true) => {
    return `/api/measurement/${id}/image_file?includeAnnotations=${includeAnnotations}&ts=${new Date().getTime()}`;
  };

  const getThumbnailUrl = (id) => {
    return `/api/image/${id}/thumbnail`;
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
  const [measurementData, setMeasurementData] = useState(emptyMeasurement);
  const [measurementSeverityTable, setMeasurementSeverityTable] = useState({});
  const [distances, setDistances] = useState([]);

  const [imageError, setImageError] = useState(false);
  const [imageIsLoaded, setImageIsLoaded] = useState(true);

  const [measurementUrl, setMeasurementUrl] = useState(getMeasurementUrl(id));

  const [doIncludeAnnotations, setDoIncludeAnnotations] = useState(true);
  //const [defectId, setDefectId] = useState(-1); // canvas way of detecting image change
  const [redraw, setRedraw] = useState(0);

  const [defectDispositionOptions, setDefectDispositionOptions] = useState(
    autoDefectDispositionOptions
  );

  // Required to implement the prev and next buttons
  const [measurementList, setMeasurementList] = useState([]);
  const [nextId, setNextId] = useState(null);
  const [prevId, setPrevId] = useState(null);

  // -------------------- 360 snapshot -----------------
  const imageRef = useRef(); // 360 image
  const [panoramaImageId, setPanoramaImageId] = useState();
  const [show360Image, setShow360Image] = useState(false);
  //----------------------------------------------------

  const [dataSaved, setDataSaved] = useState(false);

  const areAllRequiredRepairFieldsProvided = (measurementData) => {
    console.log("areAllRequiredRepairFieldsProvided() called", measurementData);

    // cannot close if disposition is not provided
    if (
      measurementData["ge_disposition"] == null ||
      measurementData["ge_disposition"] === ""
    )
      return false;

    if (
      measurementData["repair_report_id"] == null ||
      measurementData["repair_report_id"] === ""
    )
      return false;

    if (
      measurementData["repair_date"] == null ||
      measurementData["repair_date"] === ""
    )
      return false;

    // approver must be present
    if (
      measurementData["repair_approved_by"] == null ||
      measurementData["repair_approved_by"].trim() === ""
    )
      return false;

    return true;
  };

  const setMeasurementProp = (propName, value) => {
    console.log("setMeasurementProp() called with:", propName, value);

    let newMeasurementData = Object.assign({}, measurementData);

    if (propName === "date" || propName === "repair_date") {
      value = value.toString();
    }

    newMeasurementData[propName] = value;

    if (propName === "ge_disposition") {
      if (
        newMeasurementData["sso"] == null ||
        newMeasurementData["sso"].trim() === ""
      ) {
        newMeasurementData["sso"] = loggedUser;
      }
    }

    if (checkDispositionConditions(newMeasurementData) === true) {
      newMeasurementData["status"] = statusOptions[1]; // set to Closed
    } else {
      newMeasurementData["status"] = statusOptions[0]; // set to Open
    }
    console.log("updating measurementData to:", newMeasurementData);
    setMeasurementData(newMeasurementData);
  };

  const getMeasurementProp = (name) => {
    console.log(
      `getMeasurementProp() called with ${name}:`,
      measurementData[name]
    );
    return measurementData[name] || "";
  };

  // Use this method If we want to keep all within a single json object...
  const handleMeasurementDataChange = (event) => {
    const { name, value } = event.target;
    setMeasurementData((measurementData) => ({
      ...measurementData,
      [name]: value,
    }));
  };

  const getDefectId = () => {
    let defectIdStr = inspectionData.esn + "-" + measurementData.id;
    return defectIdStr;
  };

  const getDefectTolerance = () => {
    //TODO: Lookup table by measurementData.finding_type
    return "TBD";
  };

  const getColor = (defectType) => {
    let severity = measurementSeverityTable[defectType];
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

  // --------------------- annotation component props --------------------
  //const [panorama_image_data2, setPanorama_image_data2] = useState([]);
  //const [image3DId, setImage3DId] = useState(-1);
  //const [measurementDefect, setMeasurementDefect] = useState(null);
  // ---------------------------------------------------------------------


 
  // ------------------------------- Handle page back button without saving -----------------------

  window.onpopstate = async e => {
    console.log('browser back button pressed');
    window.onpopstate = null;
    if (window.confirm('Are you sure you want to leave this page without saving?')) {
      await deleteMeasurement(id);
    } else {
      // Do nothing!
      console.log('Cancel back button');
      window.history.forward(); 
    }
  };

  // -----------------------------------------------------------------------------------------------



  // called after the component is created
  useEffect(() => {

    const fetchData = async () => {
      console.log("fetchData() called... distancerefz = ", id);
      try {
        const measurement_data = await getMeasurement(id);
        console.log(
          `refz100 Read Measurement data for id ${id}:`,
          measurement_data
        );
        //setMeasurementDefect(measurement_data);
        if (measurement_data != null && measurement_data.id > 0) {
          const panorama_image_data = await get360ImageData(
            measurement_data.image_id
          );

          // ------ TODO: remove these annotation props ------------------
          // setPanorama_image_data2(panorama_image_data);
          // console.log("panorama_image_data", panorama_image_data);
          // console.log("panorama image id:", panorama_image_data.id);
          // setImage3DId(panorama_image_data.id);
          // --------------------------------------------------------------

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
            measurement_data.root_face_distance === 0 &&
            panorama_image_data.distance !== measurement_data.edge_distance
          ) {
            measurement_data.root_face_distance = panorama_image_data.distance;
          }

          if (measurement_data.location !== inspection_data.sect) {
            measurement_data.location = inspection_data.sect;
          }

          if (measurement_data.location !== inspection_data.sect) {
            measurement_data.location = inspection_data.sect;
          }

          setImageData(panorama_image_data);
          setInspectionData(inspection_data);
          setDistances(distances_data);
          console.log("refz100 panorama_image_data   = ", panorama_image_data);
          // panorama_image_data.distance = 11.0;
          // setPanoramaImageId(panorama_image_data.id);

          // if it is a manual measurement, we start showing the 360 image
          if (measurement_data.is_manual === true) {
            // setShow360Image(true);
            setDefectDispositionOptions(manualDefectDispositionOptions);
            setMeasurementProp("sso", loggedUser);
          }

          fetchMeasurementsListForInspection(inspection_data.esn);

          // this tells the annotation canvas the images have changed.
          //setDefectId(inspection_data.id);
          //setImage3DId(panorama_image_data.id);

          // this should be the last property to change since it depends on the menu options and other properties to be in place.
          setMeasurementData(measurement_data);
        }

        // populates the table correlating defect type and their severity.
        const severity_data = await getDefectSeverity();
        console.log("severity_data:", severity_data);
        setMeasurementSeverityTable(severity_data);
      } catch (error) {
        console.log(error);
      }
    }; // fetchData() helper function


    fetchData();

  }, [id, redraw]);

  useEffect(() => {
    console.log("refz100 inspectionData = ", inspectionData);
    if (Object.keys(inspectionData).length > 0)
      updateRootFaceDistance(measurementData.root_face_distance); //hoho
  }, [inspectionData]);

  // we need to know the other measurements for the current esn so we can set prev and next ids
  const fetchMeasurementsListForInspection = async (esn) => {
    const inspections = await getInspectionList(esn);
    if (inspections != null) {
      // Consolidate the measurements of each inspection under the esn into a single list
      let measList = [];
      for (let inspection of inspections) {
        let inspectionMeasurements = await getInspectionMeasurementList(
          inspection.id
        );
        console.log(
          "inspection id:",
          inspection.id,
          "# measurements: ",
          inspectionMeasurements?.length
        );
        if (inspectionMeasurements != null) {
          measList = measList.concat(inspectionMeasurements);
        }
      }

      measList.sort((a, b) => {
        let x = a["root_face_distance"];
        let y = b["root_face_distance"];
        return x < y ? -1 : x > y ? 1 : 0;
      });

      console.log(`setMeasurementList for ${esn} to:`, measList);
      console.log("current defect id: ", id); // global id var
      setMeasurementList(measList);

      console.log("current defect id: ", id); // global id var

      // update next and previous id based on current location of id in list
      for (let i = 0; i < measList.length; i++) {
        let meas = measList[i];
        if (meas.id.toString() === id?.toString()) {
          if (i > 0) {
            setPrevId(measList[i - 1].id);
          } else {
            setPrevId(null);
          }
          if (i < measList.length - 1) {
            setNextId(measList[i + 1].id);
          } else {
            setNextId(null);
          }
        }
      }
    }
  };

  const reloadMeasurementImage = () => {
    setMeasurementUrl("");
    setMeasurementUrl(getMeasurementUrl(id, doIncludeAnnotations));
  };

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

      reloadMeasurementImage();
      setImageIsLoaded(true);
      console.log("imageIsLoaded:", imageIsLoaded);
      console.log("imageError:", imageError);
      window.location.reload();
    } catch (e) {
      console.log("Error uploading file:", e);
    }
  };

  // called when the user clicks on 'save' button
  const handleSubmit = async (event) => {
    event.preventDefault();

    let message = "";

    if (measurementData.status === "Closed") {
      if (
        measurementData.ge_disposition != null &&
        measurementData.ge_disposition.includes("Out of Tolerance") &&
        !(areAllRequiredRepairFieldsProvided(measurementData) === true)
      ) {
        message +=
          " 'report id' and 'disposition' fields are required in order to close.";
        //message += "All repair fields must be provided including: repair 'date', 'provided by' and 'report id'.";
      }
    }

    if (
      measurementData.ge_disposition != null &&
      measurementData.ge_disposition.includes("Within Tolerance")
    ) {
      if (measurementData.status === "Repaired") {
        message +=
          " Within Tolerance indicators cannot be marked as Repaired. ";
      }
      if (measurementData.repair_date != null) {
        message += " Within Tolerance indicators cannot have 'Repair Date'. ";
      }
      if (
        measurementData.repair_report_id != null &&
        measurementData.repair_report_id.length > 0
      ) {
        message +=
          " Within Tolerance indicators cannot have 'Repair Report Id'.";
      }
      if (
        measurementData.repair_approved_by != null &&
        measurementData.repair_approved_by.length > 0
      ) {
        message += " Within Tolerance indicators cannot have 'Approved By'.";
      }
    }

    if (message.length === 0) {
      console.log("Submitting measurementData:", measurementData);
      // make a copy before submitting it.
      const measurementBody = Object.assign({}, measurementData);
      let measurementResp = await updateMeasurement(id, measurementBody);
      //alert(`Updated measurement record: ${await measurementResp.text()}`);
     
      //navigate(-1); // go to previous page

      let defectList = await getMeasurementDefectList(id);
      let defectId = defectList[0].id;
      let idList = []
      for (let defect of defectList) {
        idList.push( inspectionData.esn + "-" + defect.id);
      }
      alert(`Record saved! \n Parsed: ${defectList.length} defect(s): ${idList}`);
     
      navigate(`/defect/${defectId}`);
      
    } else {
      message += "\n Record not saved.";
      alert("Error: " + message);
    }
  };


  const updateRootFaceDistance = async (value) => {
    //TODO: find the corresponding image from this inspection for the provided distance.
    // then update image_id and root_face_distance properties all together.
    console.log("I came here image_id value = ", value);
    let inspectionId = inspectionData.id;
    let imageList = await findInspectionImage(inspectionId, value);
    console.log("refz100 image_id imageList = ", imageList, inspectionId);
    if (imageList != null && imageList.length > 0) {
      let imageId = imageList[0].id;
      setMeasurementProp("image_id", imageId);
      setMeasurementProp("root_face_distance", value);

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

  const updateDisposition = (value) => {
    console.log("updateDisposition()");
    let newMeasurementData = Object.assign({}, measurementData);

    //let currentStatus = measurementData["status"];
    newMeasurementData["ge_disposition"] = value;

    if (
      newMeasurementData["sso"] == null ||
      newMeasurementData["sso"].trim() === ""
    ) {
      newMeasurementData["sso"] = loggedUser;
    }

    if (
      value != null &&
      (value.includes("No Repair") || value.includes("False"))
    ) {
      newMeasurementData["repair_date"] = null;
      newMeasurementData["repair_report_id"] = "";
      newMeasurementData["repair_approved_by"] = "";

      newMeasurementData["status"] = statusOptions[1]; // set to closed
    }

    if (
      value != null &&
      value.includes("Out of Tolerance") &&
      !areAllRequiredRepairFieldsProvided(newMeasurementData) === true
    ) {
      newMeasurementData["status"] = statusOptions[0]; // set to open
    } else {
      newMeasurementData["status"] = statusOptions[1]; // set to close
    }

    setMeasurementData(newMeasurementData);
  };

  const checkDispositionConditions = (newMeasurementData) => {
    console.log("checkDispositionConditions()");
    let canClose = true;

    console.log("newMeasurementDAta = ", newMeasurementData);

    if (
      newMeasurementData["ge_disposition"] == null ||
      newMeasurementData["ge_disposition"] === ""
    )
      canClose = false; // we need disposition to be present

    // determines whether repair is needed
    let repairNeeded = false;
    if (newMeasurementData["ge_disposition"] != null) {
      if (newMeasurementData["ge_disposition"].includes("Out of")) {
        repairNeeded = true;
      }

      // if repair is needed, then we look for situations when not to close it.
      // if repair needed and not yet closed
      if (
        repairNeeded === true &&
        !areAllRequiredRepairFieldsProvided(newMeasurementData) === true
      ) {
        canClose = false;
      }

      if (newMeasurementData["ge_disposition"].includes("False")) {
        canClose = true;
      }
    }

    return canClose;
  };

  const updateRepairDate = (value) => {
    let status = getMeasurementProp("status");
    setMeasurementProp("repair_date", value.toString());
  };

  const handleIncludeAnnotationsChange = (event) => {
    let includeAnnotations = event.target.checked;
    setDoIncludeAnnotations(includeAnnotations);
    setMeasurementUrl(getMeasurementUrl(id, includeAnnotations));
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
    let distance = getMeasurementProp("root_face_distance");
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
      const updatedMeasurementJson = Object.assign({}, measurementData);
      updatedMeasurementJson.image_pitch = coordinates.pitch;
      updatedMeasurementJson.image_yaw = coordinates.yaw;
      updatedMeasurementJson.image_hfov = coordinates.hfov;
      updatedMeasurementJson.is_manual = true;
      updatedMeasurementJson.sso = loggedUser;

      try {
        let measurementResp = await updateMeasurement(
          id,
          updatedMeasurementJson
        );
        console.log("updated measurement rec:", measurementResp);

        respJson = await uploadImageMeasurementFile(id, imageFile);
        console.log("upload measurementFile resp:", respJson);

        // deletes any previous annotation file associated to this measurement id
        let delRespJson = await deleteMeasurementAnnotationFile(id);
        console.log(
          "delete existing measurement annotation file resp:",
          delRespJson
        );

        reloadMeasurementImage();
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
    window.location.reload();

    // changeShowScreenshots(true);
  };

  const deleteMeasurementAndGoBack = async () => {
    await deleteMeasurement(id);
    navigate(`/bladequality?esn=${inspectionData.esn}`);
  };


  // ====================================== Main Layout ===============================
  return (
    <div className="Inspection">

      <Suspense fallback={<Loading />}>
        <div style={{ fontSize: 25, paddingTop: 20, paddingBottom: 20 }}>
          <NavigateBeforeOutlinedIcon
            onClick={() => deleteMeasurementAndGoBack()}
            style={{ display: "grid", alignItems: "center", fontSize: 30 }}
          />
          New Indicator<br />
        </div>

        {/* <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={2}
        >
          {prevId != null && (
            <Button
              sx={{ m: 2 }}
              variant="contained"
              size="small"
              style={{ fontWeight: "bold", backgroundColor: "seagreen" }}
              onClick={() => navigate(`/defect/${prevId}`)}
            >
              &larr; Previous
            </Button>
          )}

          <Button
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
              sx={{ m: 2 }}
              variant="contained"
              size="small"
              style={{ fontWeight: "bold", backgroundColor: "seagreen" }}
              onClick={() => navigate(`/defect/${nextId}`)}
            >
              Next &rarr;
            </Button>
          )}
        </Grid> */}

        <Grid
          container
          direction="row"
          rowSpacing={4}
          columnSpacing={{ xs: 2, sm: 3, md: 4 }}
        >
           {/* ------------------------------------- CAD figures ------------------------------- */}
           <Grid item md={12} sy={{ m: 2 }}>
            {/* <div
              style={{
                display: "flex",
                justifyContent: "left",
                alignItems: "center",
              }}
            >
              <img
                align="left"
                width="500"
                src={getSideViewImageUrl(
                  measurementData.root_face_distance,
                  measurementData.location,
                  getColor(measurementData.finding_type)
                )}
                loading="lazy"
              />
               <img
                align="left"
                width="250"
                src={getCrossSectionImageUrl(
                  measurementData.root_face_distance,
                  measurementData.location,
                  getColor(measurementData.finding_type)
                )}
                loading="lazy"
              />
            </div> */}
            {/* <br /> */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >

            </div>
          </Grid>

          <Grid item md={12}>
            <form onSubmit={handleSubmit}>
              <DetailedForm
                getDefectId={getDefectId}
                formatDate={formatDate}
                getMeasurementProp={getMeasurementProp}
                setMeasurementProp={setMeasurementProp}
                bladeSections={bladeSections}
                distances={distances}
                updateRootFaceDistance={updateRootFaceDistance}
                measurementSeverityTable={measurementSeverityTable}
                defectDispositionOptions={defectDispositionOptions}
                getDefectTolerance={getDefectTolerance}
                updateDisposition={updateDisposition}
                updateRepairDate={updateRepairDate}
                measurementData={measurementData}
                statusOptions={statusOptions}
              />
              <br/>

              {/* It uses the submit function of the form. it calls handleSubmit */}
              <Button
                className="saveButton"
                variant="contained"
                size="medium"
                style={{ fontWeight: "bold", backgroundColor: "seagreen",padding: "10px 20px", 
                  whiteSpace: "nowrap",minWidth: "250px" }}
                type="submit"
              >
                Submit Data & Review Defects
              </Button>
            </form>

          </Grid>

         
        </Grid>

        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={1}
          md={12}
        >
          <Grid item>
            <label htmlFor="upload-photo">
              <input
                style={{ display: "none" }}
                id="upload-photo"
                name="upload-photo"
                type="file"
                accept="image/png"
                onChange={handleUploadMeasurementImage}
              />
            </label>
            <ToggleButton
              style={{
                marginLeft: 5,
                marginTop: 5,
                marginBottom: 2,
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
                setShow360Image(!show360Image);
              }}
            >
              360 Image to Capture 2D view
            </ToggleButton>
          </Grid>
          <Grid item>
            <label htmlFor="upload-photo">
              <input
                style={{ marginTop: 2, display: "none" }}
                id="upload-photo"
                name="upload-photo"
                type="file"
                accept="image/png"
                onChange={handleUploadMeasurementImage}
              />
              <Button
                style={{ marginTop: 5, marginLeft: 5, marginBottom: 2 }}
                color="secondary"
                variant="outlined"
                component="span"
              >
                Upload New Image
              </Button>
            </label>
          </Grid>
        </Grid>
      </Suspense>

      {show360Image && (
        <Grid container direction="row" md={12}>
          <Pannellum
            height="600px"
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
                let text = `pitch: ${pitch.toFixed(2)},
                                        yaw: ${yaw.toFixed(2)}, 
                                        roll: ${hfov.toFixed(2)},
                                        yawBonds: ${yawBonds}, 
                                        pitchBonds: ${pitchBonds}`;
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
          />
          <Button
            startIcon={<CameraAltIcon />}
            style={{
              right: 2,
              left: 2,
              marginTop: 10,
              marginBottom: 10,
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
        </Grid>
      )}

      <CanvasBodyWrapper
        panorama_image_data={imageData}
        inspectionId={inspectionData.id}
        measurementDefect={measurementData}
        defectId={measurementData.id}
        onCategoryUpdate={(category) => {
          console.log('category:',category);
          setMeasurementProp("finding_type", category)
        }}
      ></CanvasBodyWrapper>
    </div>
  );
}

export default MeasurementPage;
