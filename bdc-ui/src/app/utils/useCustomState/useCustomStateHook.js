import { useState } from "react";

import {
  deleteMeasurement,
  createMeasurement,
  uploadImageMeasurementFile,
  uploadAnnotationMeasurementFile,
  getMeasurementAnnotationFile,
} from "../../services/measurement_api.js";

import {
  getLabelIndex,
  defaultLabelIndex,
  defectLabels,
  ANNOTATION_FILE_TEMPLATE,
} from "../utils.js";

import {
  updateImage,
  getMeasurementListForImage,
} from "../../services/image_api.js";

import { select2DMeasurement_ } from "./select2DMeasurement";
import {
  fetchMeasurementAnnotationFile_,
  fetchMeasurementValidatedAnnotationFile_,
  onAnnotationSave_,
  onValidatedAnnotationSave_,
} from "./AnnotationFetchSave";

/**
 * This custom React hook, `useCustomStateHook`, is designed to manage and manipulate the state
 * of image and measurement data within a component. It initializes various state variables, such as
 * loading status, image and measurement lists, selected indices, annotation data, and UI control flags.
 * The hook provides a structured way to handle the asynchronous fetching and updating of measurement
 * data related to specific images, as well as managing annotations and their respective UI interactions.
 * Functions within the hook facilitate the selection of measurements, fetching and saving of annotation
 * data, navigation through measurement images, and UI feedback through toasts. The hook is intended to be
 * used in components where detailed interaction with a dataset of images and their associated measurements
 * is required, ensuring a reactive and user-responsive interface.
 
 * Input:
 *  - id (Number): Unique identifier for the inspection, used to initialize `inspection_id` within `emptyImage`.
 * 
 * State Variables:
 *  - isLoading (Boolean): Tracks the loading status of data.
 *  - imageList (Array): Stores a list of image objects.
 *  - measurementList (Array): Contains measurement data associated with images.
 *  - selectedMeasurementListIndex, selectedImageIndex, selectedLabelIndex (Number): Indices for currently selected measurement, image, and label.
 *  - annotationPoints, annotationPolygons (Array): Store annotation details for the selected measurement.
 *  - showThumbnails, showScreenshots, showSnackbar (Boolean): UI flags for displaying thumbnails, screenshots, and snackbars.
 *  - snackbarMessage (String): Message content for the snackbar.
 *  - defectDesc, defectLocation, defectSeverity, defectSize, distance (Various Types): State variables to manage defect properties in the form.
 * 
 * Functions:
 *  - Provides a suite of functions to select measurements, fetch and update measurement lists, handle annotation data,
 *    navigate through images, and manage UI feedback mechanisms.
 * 
 * Output:
 *  - Returns an object containing all the state setters and operational functions, allowing the consuming component to interact with
 *    the hook's internal state and trigger its functionalities.
 */

export const useCustomStateHook = (
  id,
  useValidatedAnnotations = false,
  onUpdate = null
) => {
  const emptyImage = {
    blade_id: 1,
    defect_desc: "",
    defect_location: "",
    defect_severity: "",
    defect_size: 0,
    distance: 0,
    id: -1,
    inspection_id: id,
    timestamp: new Date().toISOString(),
  };

  const useValidated = useValidatedAnnotations;

  const [isLoading, setIsLoading] = useState(false);
  const [imageList, setImageList] = useState([]);
  const [measurementList, setMeasurementList] = useState([]);
  const [selectedMeasurementListIndex, setSelectedMeasurementListIndex] =
    useState(0);
  const [selectedLabelIndex, setSelectedLabelIndex] =
    useState(defaultLabelIndex);
  const [grayOutSaveButton, setGrayOutSaveButton] = useState(false);
  const [annotationPoints, setAnnotationPoints] = useState([]); // added by H.
  const [annotationPolygons, setAnnotationPolygons] = useState([]); // added by H.
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showScreenshots, setShowScreenshots] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Defect properties used in the form
  const [defectDesc, setDefectDesc] = useState(emptyImage.defect_desc);
  const [defectLocation, setDefectLocation] = useState(
    emptyImage.defect_location
  );
  const [defectSeverity, setDefectSeverity] = useState(
    emptyImage.defect_severity
  );
  const [defectSize, setDefectSize] = useState(emptyImage.defect_size);
  const [distance, setDistance] = useState(emptyImage.distance);

  /**
   * The select2DMeasurement function selects a 2D measurement from the measurementList based on the provided index.
   * It updates the currently selected measurement index and triggers the fetching of its associated annotation data.
   * This function is key in handling user interactions with the list of 2D measurements.
   */
  const select2DMeasurement = (index) => {
    select2DMeasurement_(
      index,
      measurementList,
      setSelectedMeasurementListIndex,
      fetchMeasurementAnnotationFile
    );
  };

  /**
   * The fetchMeasurementListForImage function asynchronously retrieves a list of measurements for a given image ID
   * and updates the state with this data. It also updates the measurement count for the respective image, aiding
   * in UI indicators such as showing a green dot to signify the availability of measurements.
   */
  const fetchMeasurementListForImage = async (image_id) => {
    console.log("fetchMeasurementListForImage() called with: ", image_id);
    const measurementListData = await getMeasurementListForImage(image_id);
    if (measurementListData != null) {
      console.log("set image measurement list...");
      setMeasurementList(measurementListData);

      // update count so the green dot can be shown
      for (let image of imageList) {
        if (image.id === image_id) {
          image["measurement_count"] = measurementListData.length;
        }
      }
    }
  };

  /**
   * The `fetchMeasurementAnnotationFile_` function asynchronously retrieves annotation data for a specific measurement
   * identified by `measurement_id`. It updates the application state with the fetched annotation points, selected label index,
   * and annotation polygons. The function checks if the retrieved annotation content contains AI-generated data (`annotationContent.AI`)
   * and applies scaling if necessary. It sets the appropriate label index based on the annotation's label and updates the state
   * with the annotation points and polygons. This function plays a crucial role in integrating the annotation data into the UI,
   * allowing for the visualization and interaction with annotated measurement data within the application.
   */
  const fetchMeasurementAnnotationFile = async (measurement_id) => {
    if (useValidated === true) {
      await fetchMeasurementValidatedAnnotationFile_(
        measurement_id,
        setAnnotationPoints,
        setSelectedLabelIndex,
        setAnnotationPolygons,
        setGrayOutSaveButton
      );
    } else {
      await fetchMeasurementAnnotationFile_(
        measurement_id,
        setAnnotationPoints,
        setSelectedLabelIndex,
        setAnnotationPolygons,
        setGrayOutSaveButton
      );
    }
  };

  /**
   * The getSnapName function constructs a unique filename for an image snapshot, incorporating the image's distance and a provided
   *  index into the naming convention. It ensures the filename reflects the image's contextual data, aiding in organized storage
   * and retrieval.
   */
  const getSnapName = (index) => {
    let selectedImage = imageList[selectedImageIndex];
    let distance = "unknown";
    if (selectedImage != null) {
      distance = selectedImage.distance.toFixed(1);
    }
    return `snap-z${distance}-s${index + 1}`.replace(".", "_") + ".png";
  };

  /**
   * The `toast` function is a utility for displaying a snackbar notification within the UI.
   * It accepts a single argument, `message`, which is the text to be displayed in the snackbar.
   * Upon invocation, it sets the `snackbarMessage` state to the provided message and
   * activates the snackbar's visibility by setting `showSnackbar` to true. This function
   * is integral for providing feedback or information to the user, enhancing the interactive
   * user experience by delivering timely notifications.
   */
  const toast = (message) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
  };

  /**
   * The `onAnnotationSave` function is responsible for processing and saving the annotation data associated with a measurement.
   * When a user completes annotating an image, this function is invoked with the annotation data, including the points and the label.
   * It generates a filename based on the measurement index and constructs a new annotation file content object from the template,
   * updating it with the current annotation data. Each polygon from the data is processed and added to the annotation content.
   * This updated annotation content is then serialized into a JSON file, which is uploaded to the server using the
   * `uploadAnnotationMeasurementFile` function, linking it to the corresponding measurement ID. If the upload is successful,
   * a confirmation message is displayed to the user. This function is integral to ensuring that user-generated annotations are
   * accurately captured and stored, allowing for subsequent retrieval and analysis.
   */
  const onAnnotationSave = async (data) => {
    setGrayOutSaveButton(true);
    if (useValidated === true) {
      await onValidatedAnnotationSave_(
        data,
        getSnapName,
        selectedMeasurementListIndex,
        measurementList,
        toast
      );
    } else {
      await onAnnotationSave_(
        data,
        getSnapName,
        selectedMeasurementListIndex,
        measurementList,
        toast
      );
    }
    if (onUpdate != null) onUpdate(data); // callback used to notify listeners of annotation update
  };

  /**
   * The `firstMeasurementImage` function is responsible for navigating to the first measurement in the measurement list.
   * It does this by invoking the `select2DMeasurement` function with an index of 0, ensuring that the user interface
   * reflects the first measurement's data.
   */
  const firstMeasurementImage = () => {
    console.log("firstMeasurementImage()");
    select2DMeasurement(0);
  };

  /**
* The `prevMeasurementImage` function allows navigation to the previous measurement image. It calculates the current
 measurement's index and decrements it by one to navigate backwards in the measurement list, provided the current
  index is not the first item.
*/
  const prevMeasurementImage = () => {
    console.log("prevMeasurementimage()");
    let currMeasurementIndex = selectedMeasurementListIndex;
    if (selectedMeasurementListIndex > 0) {
      select2DMeasurement(currMeasurementIndex - 1);
    }
  };

  /**
* The `nextMeasurementImage` function facilitates navigation to the next measurement image.
 It increments the current measurement index by one, allowing the user to move forward in the measurement list, 
 as long as the current index is not the last item.
*/
  const nextMeasurementImage = () => {
    console.log("nextMeasurementimage()");
    let currMeasurementIndex = selectedMeasurementListIndex;
    if (selectedMeasurementListIndex < measurementList.length - 1) {
      select2DMeasurement(currMeasurementIndex + 1);
    }
  };

  /**
* The `lastMeasurementImage` function navigates directly to the last measurement in the list. 
It sets the current measurement index to the last index in the measurement list, ensuring the user 
is taken to the final measurement.
*/
  const lastMeasurementImage = () => {
    console.log("lastMeasurementimage()");
    select2DMeasurement(measurementList.length - 1);
  };

  /**
* The `changeShowScreenshots` function controls the visibility of screenshots based on a given boolean value. 
It updates the state to show or hide the screenshots in the user interface, enhancing the interactivity of the application.
*/
  const changeShowScreenshots = (showValue) => {
    console.log("showValue = ", showValue);
    setShowScreenshots(showValue);
    console.log("showScreenshotsValue = ", showScreenshots);
  };

  return {
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
  };
};
