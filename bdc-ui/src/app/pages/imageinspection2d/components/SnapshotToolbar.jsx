// Import necessary React and Material-UI components
import React from "react";
import { Button, Stack } from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt"; // Icon for the snapshot button
import EditIcon from "@mui/icons-material/Edit"; // Icon for the annotate button

/**
 * SnapshotToolbar component provides a toolbar with actions related to snapshots,
 * such as taking a new snapshot or annotating an existing one.
 *
 * Props:
 * - onTakeSnapshot: Function called when the user clicks the "Take Snapshot" button.
 * - onAnnotate: Function called when the user clicks the "Annotate" button.
 */
const SnapshotToolbar = ({ onTakeSnapshot, onAnnotate }) => {
  return (
    // Stack component from Material-UI aligns the buttons horizontally.
    <Stack direction="row" spacing={2}>
      {/* "Take Snapshot" button with an icon and an event handler */}
      <Button
        variant="contained"
        color="primary"
        startIcon={<CameraAltIcon />}
        onClick={onTakeSnapshot}
      >
        Take Snapshot
      </Button>

      {/* "Annotate" button with an icon and an event handler */}
      <Button
        variant="contained"
        color="secondary"
        startIcon={<EditIcon />}
        onClick={onAnnotate}
      >
        Annotate
      </Button>
    </Stack>
  );
};

// Exporting SnapshotToolbar for use in other parts of the application.
export default SnapshotToolbar;
