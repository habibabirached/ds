import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import CanvasBody from "./CanvasBody";
import { Button, Typography, Grid, InputLabel } from "@mui/material";

function ImageAnnotation({
  selectedImageIndex,
  imageList,
  getSnapName,
  select2DMeasurement,
  changeShowScreenshots,
  isLoading,
  getMeasurementImageSubtitle,
  measurementList,
  selectedMeasurementListIndex,
  deleteMeasurementRecord,
  snapWidth,
  snapHeight,
  annotationPoints,
  annotationPolygons,
  getMeasurementImageFileUrl,
  onAnnotationSave,
  firstMeasurementImage,
  prevMeasurementImage,
  nextMeasurementImage,
  lastMeasurementImage,
  ImageList,
  ImageListItem,
  getMeasurementThumbnailUrl,
  ImageListItemBar,
  setSelectedMeasurementListIndex,
  setSelectedLabelIndex,
  setAnnotationPoints,
  setAnnotationPolygons,
  grayOutSaveButton,
  setGrayOutSaveButton,
}) {
  console.log("imageListCanvas = ", imageList);
  console.log("measurementListOriginal = ", measurementList);
  return (
    <Grid item md={8} align="center" minWidth={1580} marginTop={-2}>
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
        Annotate 2D Snapshots @Z ={" "}
        {imageList[selectedImageIndex]?.distance?.toFixed(1)} m{" "}
      </Typography>

      {measurementList[selectedMeasurementListIndex] == null && (
        <div>
          <Typography>
            {" "}
            <InputLabel style={{ fontWeight: "bold", fontSize: 25 }}>
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

      <CanvasBody
        imageList={imageList}
        selectedImageIndex={selectedImageIndex}
        ViewInArOutlinedIcon={ViewInArOutlinedIcon}
        measurementList={measurementList}
        selectedMeasurementListIndex={selectedMeasurementListIndex}
        deleteMeasurementRecord={deleteMeasurementRecord}
        snapWidth={snapWidth}
        snapHeight={snapHeight}
        annotationPoints={annotationPoints}
        annotationPolygons={annotationPolygons}
        isLoading={isLoading}
        getMeasurementImageFileUrl={getMeasurementImageFileUrl}
        onAnnotationSave={onAnnotationSave}
        firstMeasurementImage={firstMeasurementImage}
        prevMeasurementImage={prevMeasurementImage}
        nextMeasurementImage={nextMeasurementImage}
        lastMeasurementImage={lastMeasurementImage}
        changeShowScreenshots={changeShowScreenshots}
        defactTab={false}
        grayOutSaveButton={grayOutSaveButton}
        setGrayOutSaveButton={setGrayOutSaveButton}
      ></CanvasBody>

      <ImageList
        sx={{ m: 2 }}
        align="left"
        cols={measurementList.length}
        gap={5}
        rowHeight={180}
        style={{ marginTop: -15 }}
      >
        {measurementList.map((item, index) => (
          <ImageListItem key={item.id} align="center">
            <div>
              <img
                style={{
                  maxWidth: 200,
                  maxHeight: 100,
                  border: "4px solid",
                  borderColor:
                    selectedMeasurementListIndex === index
                      ? "royalblue"
                      : "white",
                }}
                className="roll"
                src={getMeasurementThumbnailUrl(item.id, true)}
                alt={`id# ${item.id}`}
                loading="lazy"
                onClick={() =>
                  select2DMeasurement(
                    index,
                    measurementList,
                    setSelectedMeasurementListIndex,
                    setSelectedLabelIndex,
                    setAnnotationPoints,
                    setAnnotationPolygons
                  )
                }
              />

              <ImageListItemBar
                title={getSnapName(item.id).split('.')[0]}
                subtitle={getMeasurementImageSubtitle(item)}
                position="below"
              />
            </div>
          </ImageListItem>
        ))}
      </ImageList>
    </Grid>
  );
}
export default ImageAnnotation;
