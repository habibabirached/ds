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

const deleteMeasurementRecord = () => {
  console.log("do this later");
};

const CanvasBodyWrapper = ({
  panorama_image_data,
  inspectionId,
  measurementDefect,
  defectId,
}) => {
  // in place sort
  // const sortListByDistance = (data) => {
  //   data = data.sort((a, b) => {
  //     if (!a.distance) a.distance = 0;
  //     if (!b.distance) b.distance = 0;
  //     return a.distance - b.distance;
  //   });
  // };

  // const select360Image = async (index) => {
  //   setIsLoading(true);
  //   console.log("select360Image() called for:", index);

  //   if (index >= 0) {
  //     setSelectedImageIndex(index);
  //     console.log("imageList:", imageList);

  //     let selectedImage = imageList[index];
  //     if (selectedImage != null) {
  //       setDistance(selectedImage.distance);
  //       setDefectDesc(selectedImage.defect_desc);
  //       setDefectLocation(selectedImage.defect_location);
  //       setDefectSeverity(selectedImage.defect_severity);
  //       setDefectSize(selectedImage.defect_size);
  //     }
  //     console.log("selected imageeee:", selectedImage);
  //     if (selectedImage != null) {
  //       await fetchMeasurementListForImage(selectedImage.id);
  //       console.log("useEffect index that used to be zero = ", index);
  //       await select2DMeasurement(0);
  //       console.log(
  //         "out of the await, and about to rerender select2DMeasurement"
  //       );
  //     } else {
  //       console.log("skip fetch measurement list");
  //     }
  //   }
  //   setIsLoading(false);
  // };

  // const fetchImageList = async () => {
  //   console.log("fetchImageList()");
  //   const imgListData = await getInspectionImageList(image3DId);
  //   console.log("GET inspection image list:", imgListData);
  //   if (imgListData != null && imgListData.length > 0) {
  //     console.log("set image list...");
  //     sortListByDistance(imgListData);
  //     console.log("sorted image list:", imgListData);
  //     setImageList(imgListData);
  //   }
  //   // update defect data in UI form
  //   select360Image(selectedImageIndex);
  //   let selectedImage = imgListData[selectedImageIndex];
  //   if (selectedImage != null) {
  //     await fetchMeasurementListForImage(selectedImage.id);
  //     await select2DMeasurement(0);
  //   } else {
  //     console.log("selectedImage is null. Will not fetch measurement data");
  //   }
  // };

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
    grayOutSaveButton,
  } = useCustomStateHook(inspectionId);

  //   useEffect(() => {
  //     const fetchData = async () => {
  //       try {
  //         setImageList([panorama_image_data]);
  //         setMeasurementList(getMeasurementListForImage(id));
  //         // added by Habib to be able to edit that image
  //         fetchMeasurementListForImage(id); // added by H.
  //         setSelectedMeasurementListIndex(id); // since there should be one image only.
  //         await select2DMeasurement(id);
  //       } catch (error) {
  //         console.log("error123 = ", error);
  //       }
  //       console.log("measurementData = ", measurementList);
  //     };

  //     fetchData();
  //   }, [id]);

  // called after the component is created
  useEffect(() => {
    //fetchMeasurementListForImage(image3DId);

    // async function fetchInspectionData() {
    //   try {
    //     const data = await getInspectionById(image3DId);
    //     console.log("Read Inspection data:", data);
    //     if (data != null && data.id > 0) {
    //       await fetchImageList();
    //       setMeasurementList([measurementDefect]);
    //     }
    //   } catch (error) {
    //     console.log(error);
    //   }
    // }

    // fetchInspectionData();

    try {
      console.log(
        "measurementId from canvasBodyWrapper = ",
        measurementDefect.id
      );
      fetchMeasurementAnnotationFile(measurementDefect.id);
    } catch (error) {
      console.log("maco ");
    }

    setSelectedMeasurementListIndex(0);
    setMeasurementList([measurementDefect]);
  }, [inspectionId, measurementDefect]);

  console.log("measruementList = ", measurementList, measurementDefect);
  console.log("measruementList no, imagelist = ", imageList);

  // =============================== Snackbar methods ===========================

  const hideToast = () => {
    setShowSnackbar(false);
  };

  // ================================ Layout ==============================
  return (
    <div>
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
        defactTab={true}
        grayOutSaveButton={grayOutSaveButton}
      />
    </div>
  );
};

export default CanvasBodyWrapper;
