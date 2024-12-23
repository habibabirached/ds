import React from "react";
import { TextField, FormControl, FormLabel, Button } from "@mui/material";
import SummarizeIcon from "@mui/icons-material/Summarize";

const InspectionForm = ({
  customerName,
  setCustomerName,
  location,
  setLocation,
  appType,
  setAppType,
  sso,
  setSso,
  status,
  setStatus,
  inspectionDate,
  setInspectionDate,
  esn,
  getReportUrl,
  toast,
}) => (
  <form>
    <FormControl>
      <FormLabel>Factory Name</FormLabel>
      <TextField
        name="customer_name"
        size="small"
        value={customerName || ""}
        onChange={(e) => setCustomerName(e.target.value)}
      />
    </FormControl>
    <FormControl>
      <FormLabel>Location</FormLabel>
      <TextField
        name="location"
        size="small"
        value={location || ""}
        onChange={(e) => setLocation(e.target.value)}
      />
    </FormControl>
    <FormControl>
      <FormLabel>Crawler Make</FormLabel>
      <TextField
        name="app_type"
        size="small"
        value={appType || ""}
        onChange={(e) => setAppType(e.target.value)}
      />
    </FormControl>
    <FormControl>
      <FormLabel>SSO</FormLabel>
      <TextField
        name="sso"
        size="small"
        value={sso || ""}
        onChange={(e) => setSso(e.target.value)}
      />
    </FormControl>
    <FormControl>
      <FormLabel>Status</FormLabel>
      <TextField
        size="small"
        value={status || "Incomplete"}
        onChange={(e) => setStatus(e.target.value)}
      />
    </FormControl>
    <FormControl>
      <FormLabel>Inspection Date</FormLabel>
      <TextField
        name="date"
        type="date"
        InputLabelProps={{ shrink: true }}
        size="small"
        value={inspectionDate || new Date()}
        onChange={(e) => setInspectionDate(e.target.value)}
      />
    </FormControl>
    <FormControl>
      <FormLabel>.</FormLabel>
      <div style={{ margin: "auto 0" }}>
        <a
          href={getReportUrl(esn)}
          download={`${esn}_virtualtour.pdf`}
          target="_blank"
        >
          <Button
            variant="contained"
            size="large"
            style={{ marginLeft: 16, backgroundColor: "seagreen" }}
            onClick={() =>
              toast("Generating report. Download will start momentarily.")
            }
          >
            <SummarizeIcon /> Virtual Tour Report
          </Button>
        </a>
      </div>
    </FormControl>
  </form>
);

export default InspectionForm;
