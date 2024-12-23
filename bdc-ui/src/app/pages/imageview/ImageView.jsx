import "./ImageView.css";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Loading from "../../components/Loading";
import {
  getInspectionById,
  getInspectionImageList,
} from "../../services/inspection_api";
import { getVTShotListForImage } from "../../services/image_api";
import { isUserLoggedIn, getCurrentUser } from "../../services/login_api";
import { formatDate } from "./utility";
import SnackbarComponent from "./SnackbarComponent";
import InspectionForm from "./InspectionForm";
import ImageListComponent from "./ImageListComponent";
import VTShotListComponent from "./VTShotListComponent";
import { Pannellum } from "pannellum-react";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import { Grid, Button, Typography } from "@mui/material";
import NavigateBeforeOutlinedIcon from "@mui/icons-material/NavigateBeforeOutlined";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { Slider } from "@mui/material";

function ImageView() {
  const routeParams = useParams();
  const id = routeParams.id;
  const navigate = useNavigate();

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
  };

  const [inspectionData, setInspectionData] = useState(emptyInspection);
  const [imageList, setImageList] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [vtshotList, setVTShotList] = useState([]);
  const [selectedVTShotListIndex, setSelectedVTShotListIndex] = useState(0);

  const [appType, setAppType] = useState(emptyInspection.app_type);
  const [customerName, setCustomerName] = useState(
    emptyInspection.customer_name
  );
  const [inspectionDate, setInspectionDate] = useState(formatDate(new Date()));
  const [disp, setDisp] = useState(emptyInspection.disp);
  const [engineType, setEngineType] = useState(emptyInspection.engine_type);
  const [esn, setEsn] = useState(emptyInspection.esn);
  const [location, setLocation] = useState(emptyInspection.location);
  const [misc, setMisc] = useState(emptyInspection.misc);
  const [sect, setSect] = useState(emptyInspection.sect);
  const [sso, setSso] = useState(emptyInspection.sso);
  const [status, setStatus] = useState(emptyInspection.status);

  const [loggedIn, setLoggedIn] = useState("false");
  const loggedUser = localStorage.getItem("loggedSSO");

  const imageRef = useRef();

  // addition to the brightness, contrast, and saturation
  const [brightness, setBrightness] = useState(100); // Default brightness 100%
  const [contrast, setContrast] = useState(100); // Default contrast 100%
  const [saturation, setSaturation] = useState(100); // Default saturation 100%

  const handleBrightnessChange = (event, newValue) => {
    setBrightness(newValue);
  };

  const handleContrastChange = (event, newValue) => {
    setContrast(newValue);
  };

  const handleSaturationChange = (event, newValue) => {
    setSaturation(newValue);
  };
  // Function to reset brightness, contrast, and saturation to default values
  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  const pannellumStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
  };

  const [showScreenshots, setShowScreenshots] = useState(false);
  const changeShowScreenshots = (showValue) => {
    setShowScreenshots(showValue);
    console.log("showScreenshotsValue = ", showScreenshots);
  };

  const select360Image = async (index) => {
    console.log("select360Image() called for:", index);
    if (index >= 0) {
      setSelectedImageIndex(index);
      let selectedImage = imageList[index];
      if (selectedImage != null) {
        await fetchVTShotListForImage(selectedImage.id);
        await select2DVTShot(0);
      } else {
        console.log("skip fetch vtshot list");
      }
    }
  };

  const select2DVTShot = async (index) => {
    console.log("select2DVTShot() called for:", index);
    if (index >= 0) {
      setSelectedVTShotListIndex(index);
    }
  };

  const unpackInspectionData = (data) => {
    setInspectionData(data);
    setEsn(data["esn"] || "");
    setInspectionDate(formatDate(data["date"] || new Date()));
    setCustomerName(data["customer_name"] || "");
    setLocation(data["location"] || "");
    setEngineType(data["engine_type"] || "");
    setAppType(data["app_type"] || "");
    setDisp(data["disp"] || "");
    setMisc(data["misc"] || "");
    setSect(data["sect"] || "");
    setSso(data["sso"] || "");
    setStatus(data["status"] || "Incomplete");
  };

  const getImageUrl = (image_id) => `/api/image/${image_id}/file`;

  const fetchImageList = async () => {
    console.log("fetchImageList()");
    const imgListData = await getInspectionImageList(id);
    if (imgListData != null && imgListData.length > 0) {
      sortListByDistance(imgListData);
      setImageList(imgListData);
      setSelectedImageIndex(0);
    }
    select360Image(selectedImageIndex);
    let selectedImage = imgListData[selectedImageIndex];
    if (selectedImage != null) {
      await fetchVTShotListForImage(selectedImage.id);
      await select2DVTShot(0);
    } else {
      console.log("selectedImage is null. Will not fetch measurement data");
    }
  };

  const fetchVTShotListForImage = async (image_id) => {
    console.log("fetchVTShotListForImage() called with: ", image_id);
    const vtshotListData = await getVTShotListForImage(image_id);
    if (vtshotListData != null) {
      setVTShotList(vtshotListData);
      setSelectedVTShotListIndex(0);
    }
  };

  const sortListByDistance = (data) => {
    data.sort((a, b) => {
      if (!a.distance) a.distance = 0;
      if (!b.distance) b.distance = 0;
      return a.distance - b.distance;
    });
  };

  useEffect(() => {
    const res = isUserLoggedIn(getCurrentUser());
    setLoggedIn(res ? "true" : "false");

    async function fetchInspectionData() {
      try {
        const data = await getInspectionById(id);
        if (data != null && data.id > 0) {
          unpackInspectionData(data);
          await fetchImageList();
        }
      } catch (error) {
        console.log(error);
      }
    }

    fetchInspectionData();
  }, [id, loggedUser]);

  const getReportUrl = (inspection_id) =>
    `/api/virtualtour/pdf?esn=${inspection_id}`;
  const getThumbnailUrl = (image_id) => `/api/image/${image_id}/thumbnail`;
  const getVTShotImageFileUrl = (vtshot_id) =>
    `/api/vtshot/${vtshot_id}/image_file`;
  const getVTShotThumbnailUrl = (vtshot_id) =>
    `/api/vtshot/${vtshot_id}/thumbnail`;

  const next360Image = () => {
    let currIndex = selectedImageIndex;
    if (selectedImageIndex < imageList.length - 1) {
      select360Image(currIndex + 1);
    }
  };

  const prev360Image = () => {
    let currIndex = selectedImageIndex;
    if (selectedImageIndex > 0) {
      select360Image(currIndex - 1);
    }
  };

  const last360Image = () => select360Image(imageList.length - 1);
  const first360Image = () => select360Image(0);
  const firstVTShotImage = () => select2DVTShot(0);
  const prevVTShotImage = () => {
    let currVTShotIndex = selectedVTShotListIndex;
    if (selectedVTShotListIndex > 0) {
      select2DVTShot(currVTShotIndex - 1);
    }
  };

  const nextVTShotImage = () => {
    let currVTShotIndex = selectedVTShotListIndex;
    if (selectedVTShotListIndex < vtshotList.length - 1) {
      select2DVTShot(currVTShotIndex + 1);
    }
  };

  const lastVTShotImage = () => select2DVTShot(vtshotList.length - 1);

  const getVTShotImageSubtitle = (item) => {
    let pitch = item.image_pitch?.toFixed(1) || 0;
    let yaw = item.image_yaw?.toFixed(1) || 0;
    let hfov = item.image_hfov?.toFixed(1) || 0;
    return `{${pitch}, ${yaw},  ${hfov}}`;
  };

  const snapWidth = 1024;
  const snapHeight = 768;

  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const toast = (message) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
  };

  const hideToast = () => {
    setShowSnackbar(false);
  };

  return (
    <Grid container sx={{ m: 0 }} className="Inspection">
      <SnackbarComponent
        showSnackbar={showSnackbar}
        snackbarMessage={snackbarMessage}
        hideToast={hideToast}
      />
      {loggedIn === "true" && (
        <div>
          <div
            style={{
              fontSize: 25,
              paddingTop: 2,
              paddingBottom: 2,
              display: "flex",
              alignItems: "center",
              backgroundColor: "#679267",
              color: "white",
              padding: "2px",
              borderRadius: "5px",
            }}
          >
            <NavigateBeforeOutlinedIcon
              onClick={() => navigate(`/blade?esn=${esn}`)}
              style={{ display: "grid", alignItems: "center", fontSize: 30 }}
            />
            <div style={{ marginLeft: 10, alignItems: "center" }}>
              <ViewInArOutlinedIcon
                style={{ marginRight: 10, marginTop: 10, alignItems: "center" }}
              />
              Virtual Tour
              <br />
            </div>
          </div>
          <div style={{ fontSize: 20, paddingTop: 20 }}>
            Blade: <span style={{ fontWeight: "bold" }}>{esn}</span>, Cavity:{" "}
            <span style={{ fontWeight: "bold" }}>{sect}</span>, Modality:{" "}
            <span style={{ fontWeight: "bold" }}>Blade Crawler</span>
          </div>
          <Suspense fallback={<Loading />}>
            <Grid
              container
              spacing={2}
              sx={{ m: 1 }}
              columnSpacing={{ xs: 2, sm: 3, md: 0 }}
            >
              <InspectionForm
                customerName={customerName}
                setCustomerName={setCustomerName}
                location={location}
                setLocation={setLocation}
                appType={appType}
                setAppType={setAppType}
                sso={sso}
                setSso={setSso}
                status={status}
                setStatus={setStatus}
                inspectionDate={inspectionDate}
                setInspectionDate={setInspectionDate}
                esn={esn}
                getReportUrl={getReportUrl}
                toast={toast}
              />
            </Grid>
            <Grid
              container
              sx={{ m: 2 }}
              rowSpacing={2}
              columnSpacing={{ xs: 1, sm: 2, md: 3 }}
              style={{
                maxWidth: 1900,
                minWidth: 1900,
                minHeight: 1090,
                maxheight: 1090,
                overflow: "auto",
                backgroundColor: "whitesmoke",
                boxShadow: `2px 2px 2px 2px lightgray`,
              }}
            >
              <ImageListComponent
                imageList={imageList}
                selectedImageIndex={selectedImageIndex}
                select360Image={select360Image}
                getThumbnailUrl={getThumbnailUrl}
                first360Image={first360Image}
                prev360Image={prev360Image}
                next360Image={next360Image}
                last360Image={last360Image}
              />
              <Grid item md={8} align="center">
                {!showScreenshots && (
                  <Grid
                    item
                    md={8}
                    align="center"
                    minWidth={1300}
                    maxWidth={1600}
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
                      360 View @Z ={" "}
                      {imageList[selectedImageIndex]?.distance?.toFixed(1)} m
                    </Typography>
                    <Pannellum
                      style={pannellumStyle}
                      width="120%"
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
                      onLoad={() => console.log(`image ${id} loaded`)}
                      onMousedown={(evt) => {
                        let button = evt.button;
                        let panorama = imageRef.current.panorama;
                        let pitch = panorama.getPitch();
                        let yaw = panorama.getYaw();
                        let hfov = panorama.getHfov();
                        if (button === 2) {
                          let text = `pitch: ${pitch.toFixed(
                            2
                          )}, yaw: ${yaw.toFixed(2)}, roll: ${hfov.toFixed(2)}`;
                          panorama.addHotSpot({
                            pitch: pitch,
                            yaw: yaw,
                            type: "info",
                            text: text,
                          });
                        }
                      }}
                      hotstpotDebug
                    />
                    <Grid item md={12} align="center" minWidth={1500}>
                      <Grid
                        container
                        alignItems="center"
                        justifyContent="center"
                        spacing={2}
                      >
                        <Grid item>
                          <Typography variant="body1">Brightness</Typography>
                        </Grid>
                        <Grid item>
                          <Slider
                            value={brightness}
                            onChange={handleBrightnessChange}
                            aria-labelledby="brightness-slider"
                            min={0}
                            max={200}
                            style={{ width: 300, marginTop: 20 }}
                          />
                        </Grid>
                      </Grid>

                      <Grid
                        container
                        alignItems="center"
                        justifyContent="center"
                        spacing={2}
                        style={{ marginTop: 20 }}
                      >
                        <Grid item>
                          <Typography variant="body1">Contrast</Typography>
                        </Grid>
                        <Grid item>
                          <Slider
                            value={contrast}
                            onChange={handleContrastChange}
                            aria-labelledby="contrast-slider"
                            min={0}
                            max={200}
                            style={{ width: 300, marginTop: 20 }}
                          />
                        </Grid>
                      </Grid>

                      <Grid
                        container
                        alignItems="center"
                        justifyContent="center"
                        spacing={2}
                        style={{ marginTop: 20 }}
                      >
                        <Grid item>
                          <Typography variant="body1">Saturation</Typography>
                        </Grid>
                        <Grid item>
                          <Slider
                            value={saturation}
                            onChange={handleSaturationChange}
                            aria-labelledby="saturation-slider"
                            min={0}
                            max={200}
                            style={{ width: 300, marginTop: 20 }}
                          />
                        </Grid>
                      </Grid>
                    </Grid>

                    <Button
                      startIcon={<CameraAltIcon />}
                      style={{
                        marginTop: 50,
                        marginRight:10,
                        fontWeight: "bolder",
                        backgroundColor: "seagreen",
                        color: "white",
                        fontSize: 16,
                      }}
                      variant="contained"
                      size="large"
                      onClick={() => changeShowScreenshots(true)}
                    >
                      View 2D Snapshots
                    </Button>

                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleReset}
                      style={{
                        marginTop: 50,
                        fontWeight: "bolder",
                        backgroundColor: "seagreen",
                        color: "white",
                        fontSize: 16,
                      }}
                    >
                      Reset Sliders
                    </Button>
                  </Grid>
                )}
                <VTShotListComponent
                  showScreenshots={showScreenshots}
                  vtshotList={vtshotList}
                  selectedVTShotListIndex={selectedVTShotListIndex}
                  snapWidth={snapWidth}
                  snapHeight={snapHeight}
                  getVTShotImageFileUrl={getVTShotImageFileUrl}
                  getVTShotThumbnailUrl={getVTShotThumbnailUrl}
                  select2DVTShot={select2DVTShot}
                  firstVTShotImage={firstVTShotImage}
                  prevVTShotImage={prevVTShotImage}
                  nextVTShotImage={nextVTShotImage}
                  lastVTShotImage={lastVTShotImage}
                  getVTShotImageSubtitle={getVTShotImageSubtitle}
                  changeShowScreenshots={changeShowScreenshots}
                />
              </Grid>
            </Grid>
          </Suspense>
        </div>
      )}
    </Grid>
  );
}

export default ImageView;
