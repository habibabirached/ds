import {
  getLabelIndex,
  defaultLabelIndex,
  defectLabels,
  ANNOTATION_FILE_TEMPLATE,
} from "../utils.js";
import {
  deleteMeasurement,
  createMeasurement,
  uploadImageMeasurementFile,
  uploadAnnotationMeasurementFile,
  getMeasurementAnnotationFile,
  uploadValidatedAnnotationMeasurementFile,
  getMeasurementValidatedAnnotationFile,
} from "../../services/measurement_api.js";

import { scalePointsToNewSize } from "../scale.js";

/**
 * The `fetchMeasurementAnnotationFile_` function asynchronously retrieves annotation data for a specific measurement
 * identified by `measurement_id`. It updates the application state with the fetched annotation points, selected label index,
 * and annotation polygons. The function checks if the retrieved annotation content contains AI-generated data (`annotationContent.AI`)
 * and applies scaling if necessary. It sets the appropriate label index based on the annotation's label and updates the state
 * with the annotation points and polygons. This function plays a crucial role in integrating the annotation data into the UI,
 * allowing for the visualization and interaction with annotated measurement data within the application.
 */
export const fetchMeasurementAnnotationFile_ = async (
  measurement_id,
  setAnnotationPoints,
  setSelectedLabelIndex,
  setAnnotationPolygons,
  setGrayOutSaveButton
) => {
  return await fetchMeasurementAnnotationFile(
    measurement_id,
    setAnnotationPoints,
    setSelectedLabelIndex,
    setAnnotationPolygons,
    setGrayOutSaveButton,
    false
  );
};

export const fetchMeasurementValidatedAnnotationFile_ = async (
  measurement_id,
  setAnnotationPoints,
  setSelectedLabelIndex,
  setAnnotationPolygons,
  setGrayOutSaveButton
) => {
  return await fetchMeasurementAnnotationFile(
    measurement_id,
    setAnnotationPoints,
    setSelectedLabelIndex,
    setAnnotationPolygons,
    setGrayOutSaveButton,
    true
  );
};

function addAreaToPolygons(annotationContent) {
  const { shapes, polygons } = annotationContent;

  try {
    // Iterate over each polygon
    polygons.forEach((polygon, index) => {
      // Ensure there's a corresponding shape at the same index
      if (shapes[index]) {
        // Add the area from the corresponding shape to the polygon
        polygon.area = shapes[index].area;
        polygon.area2 = 3.1415;
      } else {
        console.warn(`No matching shape found for polygon at index: ${index}`);
      }
    });
  } catch (error) {
    console.error("An error occurred while adding areas to polygons:", error);
  }

  return annotationContent;
}

const fetchMeasurementAnnotationFile = async (
  measurement_id,
  setAnnotationPoints,
  setSelectedLabelIndex,
  setAnnotationPolygons,
  setGrayOutSaveButton,
  isValidatedAnnotation = false
) => {
  console.log("fetchMeasurementAnnotationFile() called with: ", measurement_id);

  let annotationContent = null;
  if (isValidatedAnnotation) {
    annotationContent = await getMeasurementValidatedAnnotationFile(
      measurement_id
    );
    console.log("refz_annotationContent = ", annotationContent);
  } else {
    annotationContent = await getMeasurementAnnotationFile(measurement_id);
    console.log("refz_annotationContent = ", annotationContent);
  }

  console.log("refz111 GET annotation for measurement_id = ", measurement_id);
  annotationContent = addAreaToPolygons(annotationContent);
  console.log("refz111 GET annotation annotationContent = ", annotationContent);
  setGrayOutSaveButton(false);

  if (
    annotationContent != null &&
    annotationContent.polygons &&
    annotationContent.polygons.length > 0
  ) {
    console.log("refz11111111111111 ==> ", annotationContent.polygons.length);
    setGrayOutSaveButton(true);
  }

  if (
    annotationContent != null &&
    annotationContent.shapes != null &&
    annotationContent.shapes[0]?.label != null
  ) {
    // We should always scale to UI size....
    scalePointsToNewSize(annotationContent);

    // if there is the AI label, fix the shapes.
    // if (annotationContent.AI !== undefined && annotationContent.AI == true) {
    //   console.log("this is an annotation that happened in AI!! ");
    //   scalePointsToNewSize(annotationContent); // import { scalePointsToNewSize } from "./scale.js";
    // }

    console.log("set label");
    let annoLabel = annotationContent.shapes[0].label;
    let idx = getLabelIndex(annoLabel);
    if (idx >= 0) {
      setSelectedLabelIndex(idx);
    } else {
      console.log(
        "could not find label:",
        annoLabel,
        "in the list of valid labels. Using default."
      );
      setSelectedLabelIndex(defaultLabelIndex);
    }
  } else {
    console.log("No annotation label for measurement_id:", measurement_id);
  }
  if (
    annotationContent != null &&
    annotationContent.shapes != null &&
    annotationContent.shapes[0]?.points != null
  ) {
    // toto
    let pointsList = annotationContent.shapes[0].points;
    let polygonList;
    if (annotationContent.polygons) {
      polygonList = annotationContent.polygons;
      console.log("refz_nonAI ??? , polygonList = ", polygonList);
    } else {
      polygonList = annotationContent.shapes.map((shape) => {
        console.log("shape = ", shape);
        return {
          category: shape.label,
          defectName: shape.label,
          area: shape.area,
          area2: shape.area,
          width: shape.width,
          length: shape.length,
          AI: true,
          color: "#FF0000",
          points: shape.points,
          isComplete: true,
          flattenedPoints: shape.points.flat(),
        };
      });
      annotationContent.polygons = polygonList;
    }

    console.log(
      "refz112: setAnnotationPoints(pointsList) pointsList =",
      pointsList
    );
    console.log(
      "refz113: setAnnotationPolygons(polygonList) polygonList =",
      polygonList
    );
    setAnnotationPoints(pointsList);
    setAnnotationPolygons(polygonList);
    console.log("measurementIddd on load = ", measurement_id);
  } else {
    console.log("No annotations for measurement_id:", measurement_id);
    console.log("set annotation points to: []");
    setAnnotationPoints([]);
    setAnnotationPolygons([]);
  }
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
export const onAnnotationSave_ = async (
  data,
  getSnapName,
  selectedMeasurementListIndex,
  measurementList,
  toast
) => {
  await onAnnotationSave(
    data,
    getSnapName,
    selectedMeasurementListIndex,
    measurementList,
    toast,
    false
  );
};

export const onValidatedAnnotationSave_ = async (
  data,
  getSnapName,
  selectedMeasurementListIndex,
  measurementList,
  toast
) => {
  await onAnnotationSave(
    data,
    getSnapName,
    selectedMeasurementListIndex,
    measurementList,
    toast,
    true
  );
};

// varies according to the annotation type: regular or validated
const onAnnotationSave = async (
  data,
  getSnapName,
  selectedMeasurementListIndex,
  measurementList,
  toast,
  isValidatedAnnotation = false
) => {
  console.log(
    "onAnnotationSave() called with isValidatedAnnotation:",
    isValidatedAnnotation
  );

  let imageFilename = getSnapName(selectedMeasurementListIndex);
  let annotationFileContent = JSON.parse(
    JSON.stringify(ANNOTATION_FILE_TEMPLATE)
  );

  data.polygons.forEach((el, idx) => {
    console.log(" el = ", el, idx);
    let shape_idx = {
      label: el.category,
      points: el.points,
      description: el.category,
      shape_type: "polygon",
      group_id: null,
      flags: {},
    };
    if (idx == 0) {
      annotationFileContent.shapes[0] = shape_idx;
    } else {
      annotationFileContent.shapes.push(shape_idx);
    }
  });

  console.log("annotationFile = ", annotationFileContent);

  annotationFileContent.shapes.forEach((shapeEl) => {
    console.log("shapeEl = ", shapeEl);
  });

  annotationFileContent.imagePath = imageFilename;
  annotationFileContent.polygons = data.polygons;

  console.log("annotationFile content:", annotationFileContent);

  let annoFilename = imageFilename.split(".")[0] + ".json";
  console.log("annoFilename = ", annoFilename);
  console.log("data = ", data);

  if (data.validationInfo) {
    if (data.validationInfo["validationStatus"] != null) {
      annotationFileContent["validationStatus"] =
        data.validationInfo["validationStatus"];
    }
    if (data.validationInfo["validatedBy"] != null) {
      annotationFileContent["validatedBy"] = data.validationInfo["validatedBy"];
    }
    if (data.validationInfo["validationTimestamp"] != null) {
      annotationFileContent["validationTimestamp"] =
        data.validationInfo["validationTimestamp"];
    }
    if (data.validationInfo["imageHfov"] != null) {
      annotationFileContent["imageHfovr"] = data.validationInfo["imageHfov"];
    }
    if (data.validationInfo["imagePitch"] != null) {
      annotationFileContent["imagePitch"] = data.validationInfo["imagePitch"];
    }
    if (data.validationInfo["imageYaw"] != null) {
      annotationFileContent["imageYaw"] = data.validationInfo["imageYaw"];
    }
  }

  let annoFile = new File(
    [JSON.stringify(annotationFileContent)],
    annoFilename,
    { type: "application/json", lastModified: new Date() }
  );

  let measurementId = measurementList[selectedMeasurementListIndex]?.id;
  console.log("measurementIddd on save = ", measurementList, measurementId);

  let resp = null;
  if (isValidatedAnnotation === true) {
    // the validation props will go inside the annoFile content
    resp = await uploadValidatedAnnotationMeasurementFile(
      measurementId,
      null,
      null,
      null,
      annoFile
    );
  } else {
    resp = await uploadAnnotationMeasurementFile(measurementId, annoFile);
  }

  console.log("save resp:", resp, measurementId);
  if (resp.message != null && resp.message.includes("success")) {
    toast(`Annotation ${annoFilename} Saved`);
  }
};
