import React, { useState, useEffect } from "react";
import CanvasBody from "../imageinspection/CanvasBody";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import { useCustomStateHook } from "../../utils/useCustomState/useCustomStateHook";
import {
  getMeasurementImageFileUrl,
  snapHeight,
  snapWidth,
} from "../../utils/utils";
import {
  getInspectionById,
  getInspectionImageList,
  updateInspection,
} from "../../services/inspection_api";

import { Snackbar } from "@mui/material";

import { getMeasurementListForImage } from "../../services/image_api";
import { Grid } from "@mui/material";

const deleteMeasurementRecord = () => {
  console.log("do this later");
};

const ValidatedCanvasBodyWrapper = ({
  panorama_image_data, // image DB record
  inspectionId, // inspection.id
  measurementDefect, // measurement DB record
  defectId,
  onUpdate,
  validationInfo,
}) => {
  console.log("panorama_image_data = ", panorama_image_data, inspectionId);
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
  } = useCustomStateHook(inspectionId, true, onUpdate); // set to use validated annotations

  useEffect(() => {
    try {
      console.log(
        "Init canvasBodyWrapper for measurement id: ",
        measurementDefect.id
      );
      // Note: this fetch here is for ValidatedAnnotation file,
      // since it comes from the customStateHook initialized with useValidatedAnnotations=true
      fetchMeasurementAnnotationFile(measurementDefect.id);
    } catch (error) {
      console.log(
        "Error fetching measurement validated annotation file:",
        error
      );
    }

    setMeasurementList([measurementDefect]);
    setSelectedMeasurementListIndex(0);
  }, [inspectionId, measurementDefect]);

  console.log("measruementList = ", measurementList, measurementDefect);
  console.log("measruementList no, imagelist = ", imageList);

  // =============================== Snackbar methods ===========================

  const hideToast = () => {
    setShowSnackbar(false);
  };

  // ==================================== Main layout ================================
  return (
    <Grid container direction="row" alignItems="center" justifyContent="center">
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        message={snackbarMessage}
        onClose={(event, reason) => {
          hideToast();
        }}
      />
      <br />
      <br />
      <CanvasBody
        imageList={[panorama_image_data]}
        selectedImageIndex={0}
        ViewInArOutlinedIcon={ViewInArOutlinedIcon}
        measurementList={[measurementDefect]}
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
        validationInfo={validationInfo}
        defactTab={true}
      />
    </Grid>
  );
};

export default ValidatedCanvasBodyWrapper;
