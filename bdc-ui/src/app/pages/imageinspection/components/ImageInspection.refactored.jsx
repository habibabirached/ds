// Importing necessary React hooks and components
import React, { useState } from "react";
import Grid from "@mui/material/Grid";

// Importing the custom components we've created
import ImageListPanel from "./ImageListPanel";
import MeasurementListPanel from "./MeasurementListPanel";
import InspectionForm from "../InspectionForm";
import ThumbnailList from "./ThumbnailList";
import SnapshotToolbar from "./SnapshotToolbar";
import ImageNavigation from "./ImageNavigation";

/**
 * ImageInspection is the main component that orchestrates the image inspection functionality.
 * It integrates various sub-components and manages their interactions and shared state.
 */
const ImageInspection = () => {
  // State to keep track of the selected image and measurement indices
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedMeasurementIndex, setSelectedMeasurementIndex] = useState(0);

  // Sample data for images and measurements (replace with your actual data fetching logic)
  const images = [
    { src: "image1.jpg", alt: "Image 1" },
    { src: "image2.jpg", alt: "Image 2" },
  ];
  const measurements = [
    { description: "Measurement 1" },
    { description: "Measurement 2" },
  ];

  // Handler functions for updating the selected indices
  const handleImageSelect = (index) => setSelectedImageIndex(index);
  const handleMeasurementSelect = (index) => setSelectedMeasurementIndex(index);

  // Placeholder functions for snapshot and annotation actions
  const handleTakeSnapshot = () => console.log("Take Snapshot");
  const handleAnnotate = () => console.log("Annotate");

  // Placeholder function for form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Submitted");
  };

  // Function to handle form field changes (simplified for demonstration)
  const handleFieldChange = (e) =>
    console.log(`${e.target.name}: ${e.target.value}`);

  return (
    <Grid container spacing={2}>
      {/* Image list panel */}
      <Grid item xs={12} sm={6} md={4}>
        <ImageListPanel
          imageList={images}
          selectedImageIndex={selectedImageIndex}
          onSelectImage={handleImageSelect}
        />
      </Grid>

      {/* Measurement list panel */}
      <Grid item xs={12} sm={6} md={4}>
        <MeasurementListPanel
          measurementList={measurements}
          selectedMeasurementIndex={selectedMeasurementIndex}
          onSelectMeasurement={handleMeasurementSelect}
        />
      </Grid>

      {/* Inspection form */}
      <Grid item xs={12} md={4}>
        <InspectionForm
          inspectionData={
            {
              /* Your inspection data here */
            }
          }
          onInspectionDataChange={handleFieldChange}
          onSubmit={handleSubmit}
        />
      </Grid>

      {/* Thumbnail list and snapshot toolbar */}
      <Grid item xs={12} sm={6}>
        <ThumbnailList images={images} onImageSelect={handleImageSelect} />
        <SnapshotToolbar
          onTakeSnapshot={handleTakeSnapshot}
          onAnnotate={handleAnnotate}
        />
      </Grid>

      {/* Image navigation controls */}
      <Grid item xs={12} sm={6}>
        <ImageNavigation
          onFirst={() => handleImageSelect(0)}
          onPrevious={() => handleImageSelect(selectedImageIndex - 1)}
          onNext={() => handleImageSelect(selectedImageIndex + 1)}
          onLast={() => handleImageSelect(images.length - 1)}
        />
      </Grid>
    </Grid>
  );
};

export default ImageInspection;
