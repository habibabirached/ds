import "./ImageView.css";
// import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Loading from "../../components/Loading";
import { styled } from "@mui/material/styles";
import CameraAltIcon from "@mui/icons-material/Save";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import SummarizeIcon from "@mui/icons-material/Summarize";

import {
  TextField,
  FormControl,
  FormLabel,
  Button,
  Typography,
  Grid,
  Paper,
  InputLabel,
  Snackbar,
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

import { Pannellum } from "pannellum-react";
import NavigateBeforeOutlinedIcon from "@mui/icons-material/NavigateBeforeOutlined";

import dayjs from "dayjs";
import {
  getInspectionById,
  getInspectionImageList,
} from "../../services/inspection_api";
import {
  getMeasurementListForImage,
  getVTShotListForImage,
} from "../../services/image_api";

import { isUserLoggedIn, getCurrentUser } from "../../services/login_api";

function ImageView() {
  const routeParams = useParams();
  const id = routeParams.id;
  console.log("Inspection id:", id);

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

  const formatDate = (date) => {
    return dayjs(date).format("YYYY-MM-DD");
  };

  const [inspectionData, setInspectionData] = useState(emptyInspection);
  const [imageList, setImageList] = useState([]); // 360 images
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // const [measurementList, setMeasurementList] = useState([]); // 2d snapshots used for measurement
  // const [selectedMeasurementListIndex, setSelectedMeasurementListIndex] = useState(0);

  const [vtshotList, setVTShotList] = useState([]); // 2d snapshots used for measurement
  const [selectedVTShotListIndex, setSelectedVTShotListIndex] = useState(0);

  // Inspection properties used in the form
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

  const imageRef = useRef(); // 360 image

  const [showScreenshots, setShowScreenshots] = useState(false);
  const changeShowScreenshots = (showValue) => {
    setShowScreenshots(showValue);
    console.log("showScreenshotsValue = ", showScreenshots);
  };

  const select360Image = async (index) => {
    console.log("select360Image() called for:", index);

    if (index >= 0) {
      setSelectedImageIndex(index);
      console.log("imageList:", imageList);

      let selectedImage = imageList[index];
      console.log("selected image:", selectedImage);
      if (selectedImage != null) {
        // await fetchMeasurementListForImage(selectedImage.id);
        // await select2DMeasurement(0);
        await fetchVTShotListForImage(selectedImage.id);
        await select2DVTShot(0);
      } else {
        console.log("skip fetch vtshot list");
      }
    }
  };

  // const select2DMeasurement = async (index) => {
  //   console.log("select2DMeasurement() called for:", index);
  //   if (index >= 0) {
  //     setSelectedMeasurementListIndex(index);
  //   }
  // };

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

  const getImageUrl = (image_id) => {
    return `/api/image/${image_id}/file`;
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
      setSelectedImageIndex(0);
    }

    // update defect data in UI form
    select360Image(selectedImageIndex);
    let selectedImage = imgListData[selectedImageIndex];
    if (selectedImage != null) {
      // await fetchMeasurementListForImage(selectedImage.id);
      // await select2DMeasurement(0);
      await fetchVTShotListForImage(selectedImage.id);
      await select2DVTShot(0);
    } else {
      console.log("selectedImage is null. Will not fetch measurement data");
    }
  };

  // const fetchMeasurementListForImage = async (image_id) => {
  //   console.log("fetchMeasurementListForImage() called with: ",image_id);
  //   const measurementListData = await getMeasurementListForImage(image_id);
  //   console.log(
  //     "GET measurement list for image id:",
  //     id,
  //     measurementListData
  //   );
  //   if (measurementListData != null) {
  //     console.log("set image measurement list...");
  //     setMeasurementList(measurementListData);
  //     setSelectedMeasurementListIndex(0);
  //   }
  // };

  const fetchVTShotListForImage = async (image_id) => {
    console.log("fetchVTShotListForImage() called with: ", image_id);
    const vtshotListData = await getVTShotListForImage(image_id);
    console.log("GET vtshot list for image id:", id, vtshotListData);
    if (vtshotListData != null) {
      console.log("set image vtshot list...");
      setVTShotList(vtshotListData); // hoho
      setSelectedVTShotListIndex(0);
    }
  };

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
      } catch (error) {
        console.log(error);
      }
    }

    console.log("useEffect()");
    fetchInspectionData();
    // no return function.
    // we could return a cleanup function here.
  }, [id, loggedUser]);

  const getReportUrl = (inspection_id) => {
    // using / as base path will do localhost:port/
    // if we ommit the / we will get a relative path to current path /imageview/api which is wrong
    return `/api/virtualtour/pdf?esn=${inspection_id}`;
  };

  const getThumbnailUrl = (image_id) => {
    return `/api/image/${image_id}/thumbnail`;
  };

  // const getMeasurementImageFileUrl = (measurement_id) => {
  //   return `/api/measurement/${measurement_id}/image_file`;
  // };

  // const getMeasurementThumbnailUrl = (measurement_id) => {
  //   return `/api/measurement/${measurement_id}/thumbnail`;
  // };

  const getVTShotImageFileUrl = (vtshot_id) => {
    return `/api/vtshot/${vtshot_id}/image_file`;
  };

  const getVTShotThumbnailUrl = (vtshot_id) => {
    return `/api/vtshot/${vtshot_id}/thumbnail`;
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

  // const firstMeasurementImage = () => {
  //   console.log('firstMeasurementimage()');
  //   select2DMeasurement(0);
  // }

  const firstVTShotImage = () => {
    console.log("firstVTShotImage()");
    select2DVTShot(0);
  };

  // const prevMeasurementImage = () => {
  //   console.log('prevMeasurementimage()');
  //   let currMeasurementIndex = selectedMeasurementListIndex;
  //   if (selectedMeasurementListIndex > 0) {
  //     select2DMeasurement(currMeasurementIndex-1);
  //   }
  // }

  const prevVTShotImage = () => {
    console.log("prevVTShotImage()");
    let currVTShotIndex = selectedVTShotListIndex;
    if (selectedVTShotListIndex > 0) {
      select2DVTShot(currVTShotIndex - 1);
    }
  };

  // const nextMeasurementImage = () => {
  //   console.log('nextMeasurementimage()');
  //   let currMeasurementIndex = selectedMeasurementListIndex;
  //   if (selectedMeasurementListIndex < measurementList.length-1) {
  //     select2DMeasurement(currMeasurementIndex+1);
  //   }
  // }

  const nextVTShotImage = () => {
    console.log("nextVTShotImage()");
    let currVTShotIndex = selectedVTShotListIndex;
    if (selectedVTShotListIndex < vtshotList.length - 1) {
      select2DVTShot(currVTShotIndex + 1);
    }
  };

  // const lastMeasurementImage = () => {
  //   console.log('lastMeasurementimage()');
  //   select2DMeasurement(measurementList.length-1);
  // }

  const lastVTShotImage = () => {
    console.log("lastVTshotImage()");
    select2DVTShot(vtshotList.length - 1);
  };

  // const getMeasurementImageSubtitle = (item) => {
  //   let pitch = item.image_pitch?.toFixed(1) || 0;
  //   let yaw = item.image_yaw?.toFixed(1) || 0;
  //   let hfov = item.image_hfov?.toFixed(1) || 0;

  //   return `{${pitch}, ${yaw},  ${hfov}}`
  // }

  const getVTShotImageSubtitle = (item) => {
    let pitch = item.image_pitch?.toFixed(1) || 0;
    let yaw = item.image_yaw?.toFixed(1) || 0;
    let hfov = item.image_hfov?.toFixed(1) || 0;

    return `{${pitch}, ${yaw},  ${hfov}}`;
  };

  // =========================== Avatar helper ========================================
  const StyledBadge = styled(Badge)(({ theme }) => ({
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

  const snapWidth = 1024;
  const snapHeight = 768;

  // =============================== Snackbar methods ===========================

  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const toast = (message) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
  };

  const hideToast = () => {
    setShowSnackbar(false);
  };

  // ================================== Main page ===============================

  return (
    <Grid container sx={{ m: 0 }} className="Inspection">
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
              <form>
                <Grid item md={12} sy={{ m: 2 }}>
                  <FormControl>
                    <FormLabel>Factory Name</FormLabel>
                    <TextField
                      name="customer_name"
                      size="small"
                      value={customerName || ""}
                      onChange={(e) => setCustomerName(e.target.value)}
                    >
                      {" "}
                    </TextField>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Location</FormLabel>
                    <TextField
                      name="location"
                      size="small"
                      value={location || ""}
                      onChange={(e) => setLocation(e.target.value)}
                    >
                      {" "}
                    </TextField>
                  </FormControl>
                  <FormControl>
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

                  <FormControl>
                    <FormLabel>SSO</FormLabel>
                    <TextField
                      name="sso"
                      size="small"
                      value={sso || ""}
                      onChange={(e) => setSso(e.target.value)}
                    >
                      {" "}
                    </TextField>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Status</FormLabel>
                    <TextField
                      size="small"
                      value={status || "Incomplete"}
                      onChange={(e) => setStatus(e.target.value)}
                    ></TextField>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Inspection Date</FormLabel>
                    <TextField
                      name="date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      value={inspectionDate || new Date()}
                      onChange={(e) =>
                        setInspectionDate(formatDate(e.target.value))
                      }
                    >
                      {" "}
                    </TextField>
                  </FormControl>
                  <FormControl>
                    <FormLabel>.</FormLabel>
                    <div style={{ margin: "auto 0" }}>
                      <a
                        href={getReportUrl(esn)}
                        download={`${esn}_virtualtour.pdf`}
                        target="_blank"
                      >
                        <Button
                          variant="contained"
                          size="large"
                          style={{
                            marginLeft: 16,
                            backgroundColor: "seagreen",
                          }}
                          onClick={() =>
                            toast(
                              "Generating report. Download will start momentarely."
                            )
                          }
                        >
                          <SummarizeIcon /> Virtual Tour Report
                        </Button>
                      </a>
                    </div>
                  </FormControl>
                </Grid>
              </form>
            </Grid>

            {/* =================================== 360 images roll ============================================ */}

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
              {/* ---------------- Images side list ---------------------*/}
              {
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
                        maxWidth: 360,
                        bgcolor: "background.paper",
                      }}
                    >
                      {imageList.map((item, index) => (
                        <MenuItem
                          alignitems="flex-start"
                          key={index}
                          selected={selectedImageIndex === index}
                          onClick={() => select360Image(index)}
                        >
                          {item.vtshot_count === 0 && (
                            <ListItemAvatar>
                              <Avatar
                                src={getThumbnailUrl(item.id)}
                                alt={`id# ${item.id}`}
                              />
                            </ListItemAvatar>
                          )}

                          {item.vtshot_count > 0 && (
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
                                  src={getThumbnailUrl(item.id)}
                                  alt={`id# ${item.id}`}
                                />
                              </StyledBadge>
                            </ListItemAvatar>
                          )}

                          <ListItemText
                            primary={item.location}
                            fontWeight="bold"
                            secondary={` ${item?.distance?.toFixed(1)} m`}
                          />
                        </MenuItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              }

              <Grid item md={8} align="center">
                {!showScreenshots && (
                  <Grid
                    item
                    md={8}
                    align="center"
                    minWidth={1300}
                    maxWidth={1600}
                    marginTop={-2}
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
                      {imageList[selectedImageIndex]?.distance?.toFixed(
                        1
                      )} m{" "}
                    </Typography>
                    <Pannellum
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

                        console.log(
                          "pitch:",
                          pitch,
                          "yaw:",
                          yaw,
                          "hfov:",
                          hfov
                        );
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
                    />

                    {/* ---------------------- Button toolbar ----------------------------- */}
                    <Grid item md={12} align="center" minWidth={1500}>
                      <Button
                        startIcon={<CameraAltIcon />}
                        style={{
                          marginTop: 50,
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
                    </Grid>
                  </Grid>
                )}
                {showScreenshots && (
                  <Grid
                    item
                    md={12}
                    sy={{ m: 2 }}
                    rowSpacing={2}
                    columnSpacing={{ xs: 1, sm: 2, md: 3 }}
                    marginTop={-2}
                    style={{
                      minWidth: 1600,
                      maxWidth: 1600,
                      minHeight: 1090,
                      maxHeight: 1090,
                      overflow: "auto",
                      backgroundColor: "whitesmoke",
                      boxShadow: `0 0 0 2px lightgray`,
                    }}
                  >
                    <Typography
                      align="center"
                      style={{
                        paddingTop: 10,
                        paddingBottom: 10,
                        marginBottom: 5,
                        fontWeight: "bold",
                        fontSize: 20,
                        color: "white",
                        backgroundColor: "#003839",
                      }}
                    >
                      {" "}
                      View 2D Snapshots @Z ={" "}
                      {imageList[selectedImageIndex]?.distance?.toFixed(
                        1
                      )} m{" "}
                    </Typography>

                    {vtshotList[selectedVTShotListIndex] == null && (
                      <div>
                        <Typography>
                          <InputLabel
                            style={{ fontWeight: "bold", fontSize: 25 }}
                          >
                            {" "}
                            No 2D Snapshots for this 360 image{" "}
                          </InputLabel>
                        </Typography>
                        <Button
                          startIcon={<ViewInArOutlinedIcon />}
                          style={{
                            top: 150,
                            fontWeight: "bolder",
                            backgroundColor: "seagreen",
                            color: "white",
                            fontSize: 16,
                          }}
                          variant="contained"
                          size="large"
                          onClick={() => changeShowScreenshots(false)}
                        >
                          View 360
                        </Button>
                      </div>
                    )}

                    {vtshotList[selectedVTShotListIndex] != null && (
                      <div>
                        <img
                          width={snapWidth}
                          height={snapHeight}
                          src={getVTShotImageFileUrl(
                            vtshotList[selectedVTShotListIndex]?.id
                          )}
                        />

                        {/* ---------------------- Button toolbar ----------------------------- */}
                        <Grid item md={12} align="center">
                          <Button
                            variant="contained"
                            size="large"
                            style={{
                              right: 490,
                              marginTop: -750,
                              backgroundColor: "seagreen",
                            }}
                            onClick={() => firstVTShotImage()}
                          >
                            <FirstPageIcon /> First
                          </Button>
                          <Button
                            variant="contained"
                            size="large"
                            style={{
                              right: 480,
                              marginTop: -750,
                              backgroundColor: "seagreen",
                            }}
                            onClick={() => prevVTShotImage()}
                          >
                            <ArrowBackIosIcon />
                          </Button>
                          <Button
                            variant="contained"
                            size="large"
                            style={{
                              left: 600,
                              marginTop: -750,
                              backgroundColor: "seagreen",
                            }}
                            onClick={() => nextVTShotImage()}
                          >
                            <ArrowForwardIosIcon />
                          </Button>
                          <Button
                            variant="contained"
                            size="large"
                            style={{
                              left: 610,
                              marginTop: -750,
                              backgroundColor: "seagreen",
                            }}
                            onClick={() => lastVTShotImage()}
                          >
                            Last <LastPageIcon />
                          </Button>
                          <Button
                            startIcon={<ViewInArOutlinedIcon />}
                            style={{
                              left: 480,
                              marginTop: -100,
                              fontWeight: "bolder",
                              backgroundColor: "seagreen",
                              color: "white",
                              fontSize: 16,
                            }}
                            variant="contained"
                            size="large"
                            onClick={() => changeShowScreenshots(false)}
                          >
                            View 360
                          </Button>
                        </Grid>
                      </div>
                    )}
                    <ImageList
                      align="left"
                      cols={vtshotList.length}
                      gap={5}
                      rowHeight={180}
                      style={{ marginTop: -15 }}
                    >
                      {vtshotList.map((item, index) => (
                        <ImageListItem key={item.id} align="center">
                          <div>
                            <img
                              style={{
                                maxWidth: 200,
                                maxHeight: 100,
                                border: "4px solid",
                                borderColor:
                                  selectedVTShotListIndex === index
                                    ? "royalblue"
                                    : "white",
                              }}
                              className="roll"
                              src={getVTShotThumbnailUrl(item.id)}
                              alt={`id# ${item.id}`}
                              loading="lazy"
                              onClick={() => select2DVTShot(index)}
                            />
                            <ImageListItemBar
                              title={getVTShotImageSubtitle(item)}
                              subtitle={"{pitch, yaw, hfov}"}
                              position="below"
                            />
                          </div>
                        </ImageListItem>
                      ))}
                    </ImageList>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Suspense>
        </div>
      )}
    </Grid>
  );
}

export default ImageView;
