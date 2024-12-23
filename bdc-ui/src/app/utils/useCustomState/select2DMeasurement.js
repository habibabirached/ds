/**
 * The select2DMeasurement_ function asynchronously selects a measurement based on the given
 * index, updates the selected measurement index, and fetches the associated annotation
 * data for visualization and editing. It ensures that the selected measurement's data is
 * actively reflected in the UI, facilitating user interaction and data manipulation.
 */
export const select2DMeasurement_ = async (
  index,
  measurementList,
  setSelectedMeasurementListIndex,
  fetchMeasurementAnnotationFile
) => {
  console.log("select2DMeasurement() called for:", index);

  if (index >= 0) {
    setSelectedMeasurementListIndex(index);

    let selectedMeas = measurementList[index];
    console.log("selected measurement selectedMeas = ", selectedMeas);
    if (selectedMeas != null) {
      console.log("selected measurement id:", selectedMeas.id);
      // Update form properties for measurement meta-data for edit and visualization purposes

      await fetchMeasurementAnnotationFile(selectedMeas.id);
    }
  }
};
