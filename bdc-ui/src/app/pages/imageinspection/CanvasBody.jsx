// Import necessary components and icons
import { Button, Grid, Paper, Typography } from "@mui/material";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import React, { useState } from "react";

import Canvas from "../../components/Canvas";

/* ------------------------ Selected measurement snapshot ---------------------- */
function CanvasBody({
  imageList,
  selectedImageIndex,
  ViewInArOutlinedIcon,
  measurementList,
  selectedMeasurementListIndex,
  deleteMeasurementRecord,
  snapWidth,
  snapHeight,
  annotationPoints,
  annotationPolygons,
  isLoading,
  getMeasurementImageFileUrl,
  onAnnotationSave,
  firstMeasurementImage,
  prevMeasurementImage,
  nextMeasurementImage,
  lastMeasurementImage,
  changeShowScreenshots,
  defactTab,
  grayOutSaveButton,
  setGrayOutSaveButton,
  validationInfo,
}) {
  console.log(
    "\n\n\n\n\n\n refz_112233 measurementList measurementList in CanvasBody = ",
    measurementList,
    defactTab,
    selectedMeasurementListIndex
  );

  console.log("refz_112233_imageList:", imageList);
  console.log("refz_112233_selectedImageIndex:", selectedImageIndex);
  console.log("refz_112233_ViewInArOutlinedIcon:", ViewInArOutlinedIcon);
  console.log("refz_112233_measurementList:", measurementList);
  console.log(
    "refz_112233_selectedMeasurementListIndex:",
    selectedMeasurementListIndex
  );
  console.log("refz_112233_deleteMeasurementRecord:", deleteMeasurementRecord);
  console.log("refz_112233_snapWidth:", snapWidth);
  console.log("refz_112233_snapHeight:", snapHeight);
  console.log("refz_112233_annotationPoints:", annotationPoints);
  console.log("refz_112233_annotationPolygons:", annotationPolygons);
  console.log("refz_112233_isLoading:", isLoading);
  console.log(
    "refz_112233_getMeasurementImageFileUrl:",
    getMeasurementImageFileUrl
  );
  console.log("refz_112233_onAnnotationSave:", onAnnotationSave);
  console.log("refz_112233_firstMeasurementImage:", firstMeasurementImage);
  console.log("refz_112233_prevMeasurementImage:", prevMeasurementImage);
  console.log("refz_112233_nextMeasurementImage:", nextMeasurementImage);
  console.log("refz_112233_lastMeasurementImage:", lastMeasurementImage);
  console.log("refz_112233_changeShowScreenshots:", changeShowScreenshots);
  console.log("refz_112233_defactTab:", defactTab);
  console.log("refz_graoutSave = ", grayOutSaveButton);

  const [selectedPolygon, setSelectedPolygon] = useState(null);

  const handlePolygonSelect = (polygon, index) => {
    console.log(
      "index = measurement =",
      index,
      annotationPolygons,
      annotationPolygons[index]
    );
    annotationPolygons[index]
      ? (polygon.area = annotationPolygons[index].area)
      : (polygon.area = "noArea");

    annotationPolygons[index]
      ? (polygon.id = annotationPolygons[index].id)
      : (polygon.id = "noId");
    setSelectedPolygon(polygon);
  };

  return (
    <div>
      {measurementList[selectedMeasurementListIndex] != null && (
        <Grid item md={8} style={{ marginTop: -50 }}>
          {/* {!defactTab && !grayOutSaveButton && (
            <Button
              variant="contained"
              size="medium"
              style={{ left: 420, top: 65, backgroundColor: "red" }}
              onClick={() =>
                deleteMeasurementRecord(
                  measurementList[selectedMeasurementListIndex]?.id,
                  imageList[selectedImageIndex]?.id
                )
              }
            >
              <DeleteForeverIcon />
              Delete snapshot
            </Button>
          )} */}
          {
            <>
              {" "}
              <br></br>
            </>
          }
          {/* The width and height must match that used in the annotation file Habib*/}
          <Canvas
            width={snapWidth}
            height={snapHeight}
            loadPoints={annotationPoints}
            loadPolygons={annotationPolygons}
            isLoading={isLoading}
            src={getMeasurementImageFileUrl(
              false
                ? measurementList[selectedMeasurementListIndex]?.image_id
                : measurementList[selectedMeasurementListIndex]?.id
            )}
            alt={"measurement image"}
            onSave={onAnnotationSave}
            validationInfo={validationInfo}
            onPolygonSelect={handlePolygonSelect}
          />

          <div align="center" style={{ marginTop: 5 }}>
            {!defactTab && (
              <Grid item md={12} align="center">
                <Button
                  variant="contained"
                  size="large"
                  style={{
                    right: 480,
                    marginTop: -750,
                    backgroundColor: "seagreen",
                  }}
                  onClick={() => firstMeasurementImage()}
                >
                  <FirstPageIcon /> First
                </Button>

                <Button
                  variant="contained"
                  size="large"
                  style={{
                    right: 470,
                    marginTop: -750,
                    backgroundColor: "seagreen",
                  }}
                  onClick={() => prevMeasurementImage()}
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
                  onClick={() => nextMeasurementImage()}
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
                  onClick={() => lastMeasurementImage()}
                >
                  Last <LastPageIcon />
                </Button>
                <Button
                  startIcon={<ViewInArOutlinedIcon />}
                  style={{
                    left: 520,
                    marginTop: -1600,
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
            )}
          </div>
        </Grid>
      )}
      {measurementList[selectedMeasurementListIndex] != null && (
        <>
          <Grid item md={12} align="left">
            <Paper
              elevation={3}
              style={{
                padding: 20,

                marginLeft: 1310,
                marginTop: -600,
                backgroundColor: "seagreen",
                color: "white",

                border: "1px solid #ccc",
                width: "200px",
                textAlign: "left",
              }}
            >
              <Typography variant="h6">
                {selectedPolygon ? selectedPolygon.category : "select defect"}
              </Typography>
              {/* <Typography variant="body1">
                Id:{" "}
                {selectedPolygon
                  ? selectedPolygon.id
                    ? selectedPolygon.id
                    : "no id"
                  : "no id_"}
              </Typography> */}

              <Typography variant="body1">
                Area:{" "}
                {selectedPolygon
                  ? selectedPolygon.area
                    ? `${(selectedPolygon.area * 10000).toFixed(2)} cm`
                    : "no A"
                  : "no A_"}
                {selectedPolygon && selectedPolygon.area ? <sup>2</sup> : ""}
              </Typography>

              <Typography variant="body1">
                Width:{" "}
                {selectedPolygon
                  ? selectedPolygon.width
                    ? `${(selectedPolygon.width * 100).toFixed(2)} cm`
                    : "no W"
                  : "no W_"}
              </Typography>

              <Typography variant="body1">
                Length:{" "}
                {selectedPolygon
                  ? selectedPolygon.length
                    ? `${(selectedPolygon.length * 100).toFixed(2)} cm`
                    : "no L"
                  : "no L_"}
              </Typography>
            </Paper>
          </Grid>
          <Grid item md={12} align="left">
            <Paper
              elevation={3}
              style={{
                padding: 0,

                marginLeft: 1300,
                marginTop: 515,
                backgroundColor: "seagreen",
                color: "white",

                border: "1px solid #ccc",
                width: "0px",
                textAlign: "left",
              }}
            ></Paper>
          </Grid>
        </>
      )}
    </div>
  );
}
export default CanvasBody;
