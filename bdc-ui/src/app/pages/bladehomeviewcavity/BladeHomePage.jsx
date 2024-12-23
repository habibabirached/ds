import "./BladeHomePage.css";
import { useEffect, useState, Suspense } from "react";
import {
  Box,
  LinearProgress,
  Button,
  Tooltip,
  Grid,
  Typography,
  Snackbar,
  IconButton,
} from "@mui/material";
import { useSearchParams, useNavigate,useLocation } from "react-router-dom";
import Loading from "../../components/Loading";
import React from "react";
import {
  createInspection,
  deleteInspection,
  downloadInspectionDataAsync,
  getInspectionList,
  getInspectionMeasurementList,
  uploadImageFileAndMetadata,
} from "../../services/inspection_api";
import {
  uploadAnnotationMeasurementFile,
  updateMeasurement,
  getComputeMeasurementsForMeasurementAnnotationFile,
} from "../../services/measurement_api";

import CalculateIcon from '@mui/icons-material/Calculate';

import InputButton from "../../components/InputButton";
import LinearProgressWithLabel from "../../components/LinearProgressWithLabel";
import { isUserLoggedIn, getCurrentUser } from "../../services/login_api";
//import Bottleneck from "bottleneck";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Fade from "@mui/material/Fade";
import InspectionReportButton from "../../components/InspectionReportButton";
import PhotoAlbumReportButton from "../../components/PhotoAlbumReportButton";
import useFilters from "../../components/Filter/useFilters2";
import BladeHomeTable from "./BladeHomeTable";
import WindPowerOutlinedIcon from "@mui/icons-material/WindPowerOutlined";

import DrawOutlinedIcon from "@mui/icons-material/DrawOutlined";
import GridOnOutlinedIcon from "@mui/icons-material/GridOnOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import NavigateBeforeOutlinedIcon from "@mui/icons-material/NavigateBeforeOutlined";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import CloseIcon from "@mui/icons-material/Close";
import ArticleIcon from "@mui/icons-material/Article";
import DownloadingIcon from "@mui/icons-material/Downloading";
import { jsonrepair } from "jsonrepair";
import { BASE_URL } from "../../services/api_config";

import Bottleneck from "bottleneck";

function BladeHomePage() {
  const initialFilters = {
    id: { value: "", type: "contains" },
    date: { value: "", type: "contains" },
    customer_name: { value: "", type: "contains" },
    location: { value: "", type: "contains" },
    sect: { value: "", type: "contains" },
    manufacture_stage: { value: "", type: "contains" },
    manufacture_date: { value: "", type: "contains" },
    modality: { value: "", type: "contains" },
    sso: { value: "", type: "contains" },
    status: { value: "", type: "contains" },
  };



  const [filters, handleFilterChange, clearFilters, setFilters, applyFilters] =
    useFilters(initialFilters, "BladeFilters");

  const [inspectionList, setInspectionList] = useState([]);
  const [selectedIdList, setSelectedIdList] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showProgressBar, setShowProgressBar] = useState(false);

  const [computeProgress, setComputeProgress] = useState(0);

  const [searchParams] = useSearchParams();
  const [showDownloadSnack, setShowDownloadSnack] = useState(false);

  const navigate = useNavigate();
  const location=useLocation();

  const [loggedIn, setLoggedIn] = useState("false");
  const [isAdmin, setIsAdmin] = useState(false); // New state for admin check
  const loggedUser = localStorage.getItem("loggedSSO");

  const [manufactureStageOptions, setManufactureStageOptions] = useState([]);

  const fetchInspectionList = async (esn) => {
    try {
      const data = await getInspectionList(esn);
      if (data != null) {
        setInspectionList(data);
        updateManufactureStageOptions(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const userIsAdmin = async () => {
    console.log('userIdAdmin()');
    
    // For localhost development and for the GRC host that does not have sso authentication, we use admin mode.
    const currentURL = window.location.href;
    console.log("currentURL:", currentURL);
    if (currentURL.includes("localhost") || currentURL.includes("crd.ge.com")) {
      console.log('Entering developer mode');
      setIsAdmin(true);
      return;
    }
    
    const inputSSO = getCurrentUser();
    const data = await fetch(`${BASE_URL}/usergroup/${inputSSO}`);
    const res = await data.json();
    console.log("user group is ", res);
    if (res === "ADM") {
      setIsAdmin(true);
      console.log("user group is inside ");
    }
  };

  const updateManufactureStageOptions = (inspectionList) => {
    let optionSet = new Set();
    for (let inspection of inspectionList) {
      optionSet.add(inspection.manufacture_stage);
    }
    let optionList = Array.from(optionSet);
    setManufactureStageOptions(optionList);
  };

  useEffect(() => {
    const res = isUserLoggedIn(getCurrentUser());
    // setLoggedIn(res ? "true" : "false");
    if (res) {
      setLoggedIn("true");
      if (loggedUser === "admin") {
        setIsAdmin(true);
      }
    } else {
      setLoggedIn("false");
    }

    const fetchData = async () => {
      const esn = searchParams.get("esn");
      await userIsAdmin();
      await fetchInspectionList(esn);
    };
    
    fetchData();

  }, [loggedUser, searchParams]);

  const getReportUrl = (inspection_id) => {
    return `api/inspection/${inspection_id}/xls`;
  };

  const rowsSelected = (indexList) => {
    setSelectedIdList(indexList);
  };

  const delSelected = async () => {
    setShowProgressBar(true);
    const esn = searchParams.get("esn");
    console.log('ESN on delete - ', esn);
    for (let id of selectedIdList) {
      await deleteInspection(id);
      fetchInspectionList(esn);
    }
    setShowProgressBar(false);
  };

  const handleCloseSnack = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setShowDownloadSnack(false);
  };

  const downloadSnackLayout = (
    <React.Fragment>
      <Button color="secondary" size="small" onClick={handleCloseSnack}>
        Close
      </Button>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleCloseSnack}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </React.Fragment>
  );

  const downloadSnapshotsAnd360Images = () => {
    console.log("downloadSnapshotsAnd360Images()");
    let i = 0;
    for (let inspection of inspectionList) {
      window.setTimeout(
        () => downloadInspectionDataAsync(inspection),
        i * 1000
      );
      i++;
    }
    setShowDownloadSnack(true);
  };


  const NUMBER_PARALLEL_TASKS = 2;
  const computeMeasurementsLimiter = new Bottleneck({
      maxConcurrent: NUMBER_PARALLEL_TASKS,
  });

  let totalMeasurements = 0;
  let doneMeasurementsSet = new Set();
  const updateComputeProgress = (id) => {
    doneMeasurementsSet.add(id);
    let progress = Math.round(100 * (doneMeasurementsSet.size / totalMeasurements));
    setComputeProgress(progress);
  }

  const recalculateMeasurementsForAllCavities = async () => {
    let measurementIdList = []
    setComputeProgress(1);

    console.log('recalculateMeasurementsForAllCavities() called');
    for (let inspection of inspectionList) {
      let measurementList = await getInspectionMeasurementList(inspection.id);
      for (let measurement of measurementList) {
        measurementIdList.push(measurement.id);
      }   
    }

    if (measurementIdList.length === 0) {
      alert('Nothing to do. No measurements found in current blade.');
    }

    totalMeasurements = measurementIdList.length;
    doneMeasurementsSet.clear();
    
    let callList = [];
    for (let id of measurementIdList) {
      callList.push(
        computeMeasurementsLimiter.schedule(
        () => getComputeMeasurementsForMeasurementAnnotationFile(id))
        .then((resp) => {console.log('compute measurement resp:',resp); updateComputeProgress(id); })
        .catch((err) => {console.log('err:',err)})
        .finally(() => {/* console.log(`done processing: ${filename}...`); */ })
      ); // push
    }
    // wait all measurements are re-calculated
    await Promise.all(callList);
    setComputeProgress(0);
  }

  const downloadInspectionData = (inspection) => {
    let esn = inspection.esn;
    let inspectionId = inspection.id;
    let cavity = inspection.sect;
    console.log("downloadInspectionData() called for:", esn, inspectionId);

    const link = document.createElement("a");
    link.href = `/api/inspection/${inspectionId}/zip`;
    link.download = `${esn}_${cavity}_${inspectionId}.zip`;
    console.log("link.href:", link.href);
    link.click();
  };

  // this only works for a single file at a time since it opens a new page. Not good.
  const downloadInspectionDataAlternative = (inspection) => {
    let esn = inspection.esn;
    let inspectionId = inspection.id;
    let cavity = inspection.sect;
    console.log("downloadInspectionData() called for:", esn, inspectionId);

    let href = `/api/inspection/${inspectionId}/zip`;
    window.open(href, "_blank");
  };

  return (
    <div className="HomePage">
      {loggedIn === "true" && (
        <div>
          <Typography
            style={{ fontSize: 25, paddingTop: 2, paddingBottom: 20 }}
          >
            <div
              style={{
                fontSize: 25,
                paddingTop: 2,
                paddingBottom: 2,
                display: "flex",
                alignItems: "center",
                backgroundColor: "seagreen",
                color: "white",
                padding: "2px",
                borderRadius: "5px",
              }}
            >
              <NavigateBeforeOutlinedIcon
                onClick={() => navigate("/bladeslist")}
                style={{ display: "grid", alignItems: "center", fontSize: 30 }}
              />
              <WindPowerOutlinedIcon style={{ marginRight: 5 }} />
              VIEW CAVITIES
            </div>
            Inspections List <br />
            <span style={{ fontSize: 20 }}>
              Blade Serial Number:{" "}
              <span style={{ fontWeight: "bold" }}>
                {searchParams.get("esn")}
              </span>
            </span>
          </Typography>
          <Grid container justifyContent="space-between">
            <div>
              <Button
                style={{
                  marginRight: 5,
                  backgroundColor: "#808000",
                  color: "white",
                  marginLeft: 0,
                  marginBottom: 5,
                }}
                onClick={() =>{
                  const currentPath = `${location.pathname}?esn=${searchParams.get("esn")}`
                  navigate(`/bladequality?esn=${searchParams.get("esn")}`,{ 
                    state: { from: currentPath } })
                }
                }
              >
                <GridOnOutlinedIcon style={{ marginRight: 5 }} /> Review
                Findings
              </Button>

              <PhotoAlbumReportButton
                esn={searchParams.get("esn")}
                manufactureStageOptions={manufactureStageOptions}
                onClick={() => setShowDownloadSnack(true)}
              />
              <InspectionReportButton
                esn={searchParams.get("esn")}
                manufactureStageOptions={manufactureStageOptions}
                onClick={() => setShowDownloadSnack(true)}
              />
              <Tooltip
                placement="top"
                title="Download .zip files with images and annotations for each inspection below"
              >
                <Button
                  variant="contained"
                  size="small"
                  style={{
                    backgroundColor: "darkslategray",
                    color: "white",
                    marginLeft: 5,
                    marginBottom: 5,
                  }}
                  onClick={() => downloadSnapshotsAnd360Images()}
                >
                  <DownloadingIcon style={{ marginRight: 5 }} /> 2D Snapshots
                  and 360 Images
                </Button>
              </Tooltip>

              <Tooltip
                placement="top"
                title="Recalculate measurements for all cavities"
              >
                <Button
                  variant="contained"
                  size="small"
                  style={{
                    backgroundColor: "darkslategray",
                    color: "white",
                    marginLeft: 5,
                    marginBottom: 5,
                  }}
                  onClick={() => recalculateMeasurementsForAllCavities()}
                >
                  <CalculateIcon style={{ marginRight: 5 }} /> Recalculate Measurements
                </Button>
              </Tooltip>
            </div>

            {/* <div> */}
              {/* <Button
                onClick={clearFilters}
                style={{
                  backgroundColor: "blue",
                  color: "white",
                  marginLeft: 10,
                }}
              >
                Clear Filters
              </Button> */}

              {isAdmin && (
              <div style={{ marginLeft: "auto" }}>
                {inspectionList && selectedIdList.length > 0 && (
                   <Button
                   style={{
                     backgroundColor: "red",
                     color: "white",
                     margin: 10,
                   }}
                   disabled={selectedIdList.length === 0}
                   onClick={delSelected}
                 >
                   <DeleteForeverIcon style={{ marginRight: 5 }} /> Delete
                   Selected
                 </Button>
                )}  
                </div>
              )}
            {/* </div> */}
          </Grid>
          
          
          <Box sx={{ width: "100%" }}>
                  {computeProgress > 0 && (
                    <LinearProgressWithLabel value={computeProgress} />
                  )}
          </Box>
            
          <Suspense fallback={<Loading />}>
            <Box sx={{ width: "100%" }}>
              {uploadProgress > 0 && (
                <LinearProgressWithLabel value={uploadProgress} />
              )}
            </Box>
            <Box sx={{ width: "100%" }}>
              {showProgressBar && <LinearProgress />}
            </Box>
            <Box sx={{ marginBottom: 10, height: 800, width: "100%" }}>
              <BladeHomeTable
                inspectionList={inspectionList}
                rowsSelected={rowsSelected}
                filters={filters}
                setFilters={setFilters}
                initialFilters={initialFilters}
                handleFilterChange={handleFilterChange}
                setShowDownloadSnack={setShowDownloadSnack}
                applyFilters={applyFilters}
              />
            </Box>
            <Snackbar
              open={showDownloadSnack}
              autoHideDuration={6000}
              onClose={handleCloseSnack}
              message="Generating report... The file download will start momentarily."
              action={downloadSnackLayout}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}

export default BladeHomePage;
