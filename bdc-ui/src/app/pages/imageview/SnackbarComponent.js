import React from "react";
import { Snackbar } from "@mui/material";

const SnackbarComponent = ({ showSnackbar, snackbarMessage, hideToast }) => (
  <Snackbar
    open={showSnackbar}
    autoHideDuration={6000}
    message={snackbarMessage}
    onClose={hideToast}
  />
);

export default SnackbarComponent;
