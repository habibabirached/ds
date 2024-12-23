// Importing necessary React and Material-UI components
import React from "react";
import { IconButton } from "@mui/material";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

/**
 * ImageNavigation component provides navigation controls for image browsing.
 * It includes buttons to go to the first, previous, next, and last image.
 *
 * Props:
 * - onFirst: Function called when the "First" button is clicked.
 * - onPrevious: Function called when the "Previous" button is clicked.
 * - onNext: Function called when the "Next" button is clicked.
 * - onLast: Function called when the "Last" button is clicked.
 */
const ImageNavigation = ({ onFirst, onPrevious, onNext, onLast }) => {
  return (
    <div>
      {/* IconButton for navigating to the first image */}
      <IconButton onClick={onFirst} aria-label="First Image">
        <FirstPageIcon />
      </IconButton>

      {/* IconButton for navigating to the previous image */}
      <IconButton onClick={onPrevious} aria-label="Previous Image">
        <NavigateBeforeIcon />
      </IconButton>

      {/* IconButton for navigating to the next image */}
      <IconButton onClick={onNext} aria-label="Next Image">
        <NavigateNextIcon />
      </IconButton>

      {/* IconButton for navigating to the last image */}
      <IconButton onClick={onLast} aria-label="Last Image">
        <LastPageIcon />
      </IconButton>
    </div>
  );
};

// Exporting ImageNavigation to be used in other parts of the application.
export default ImageNavigation;
