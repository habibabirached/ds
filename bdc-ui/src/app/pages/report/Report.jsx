import React, { useState } from "react";
import dayjs from "dayjs";
import {
  Grid,
  Typography,
  Button,
  CircularProgress,
  Backdrop,
  TextField,
  Stack,
  Autocomplete
} from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import NavigateBeforeOutlinedIcon from "@mui/icons-material/NavigateBeforeOutlined";
import { useNavigate } from "react-router-dom";
import {
  BLADE_TYPE_OPTIONS,
  FACTORY_NAME_OPTIONS,
  INSPECTION_LOCATION_OPTIONS,
  MANUFACTURE_STAGE_OPTIONS,
  SUPPLIER_OPTIONS,
  BLADE_CAVITIES,
  DEFECT_DISPOSITION_OPTIONS,
  defectLabels,
} from "../../config";
import "./Report.css";
import { generateInspectionDefectStatsReport, generateInspectionListReport, generateInspectionDefectListCsv } from "../../services/inspection_api";

function Report() {
  const navigate = useNavigate();

  const bladeTypeOptions = BLADE_TYPE_OPTIONS;
  const manufactureStageOptions = MANUFACTURE_STAGE_OPTIONS;
  const supplierOptions = SUPPLIER_OPTIONS;
  const factoryNameOptions = FACTORY_NAME_OPTIONS;
  const inspectionLocationOptions = INSPECTION_LOCATION_OPTIONS;
  const bladeCavityTypeOptions = BLADE_CAVITIES;
  const defectDispositionOptions = DEFECT_DISPOSITION_OPTIONS;
  const defectLabelTypeOptions = defectLabels;

  // State for filters
  const [bladeType, setBladeType] = useState(null);
  const [manufactureStage, setManufactureStage] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [factoryName, setFactoryName] = useState(null);
  const [inspectionLocation, setInspectionLocation] = useState(null);
  const [bladeCavityType, setBladeCavityType] = useState(null);
  const [defectDisposition, setDefectDisposition] = useState(null);
  const [defectLabelType, setDefectLabelType] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (date) => (date ? new Date(date).toISOString() : null);

  // Clear all filters
  const clearFilters = () => {
    setBladeType(null);
    setManufactureStage(null);
    setSupplier(null);
    setFactoryName(null);
    setInspectionLocation(null);
    setBladeCavityType(null);
    setDefectDisposition(null);
    setDefectLabelType(null);
    setStartDate(null);
    setEndDate(null);
  };

  // Handle date shortcut
  const setLastWeek = () => {
    setStartDate(dayjs().subtract(1, 'week').startOf('week'));
    setEndDate(dayjs().subtract(1, 'week').endOf('week'));
  };

  const setLastMonth = () => {
    setStartDate(dayjs().subtract(1, 'month').startOf('month'));
    setEndDate(dayjs().subtract(1, 'month').endOf('month'));
  };

  // Handle report generation
  const generateInspDefectStatsReport = async () => {
    setIsLoading(true);
    const filterParams = {
      bladeType,
      manufactureStage,
      supplier,
      factoryName,
      inspectionLocation,
      bladeCavityType,
      defectDisposition,
      defectLabelType,
      startDate: startDate ? formatDate(startDate) : null,
      endDate: endDate ? formatDate(endDate) : null,
    };

    try {
      let success = await generateInspectionDefectStatsReport(filterParams);
      if (!success) {
        setIsLoading(false);
        alert(
          "Oops! Something went wrong while generating the report. Please retry or reach out to support if the issue persists."
        );
      }
    } catch (error) {
      console.error("Error generating report:", error);
      alert(
        "Oops! Something went wrong while generating the report. Please retry or reach out to support if the issue persists."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const generateInspectionListStatsReport = async () => {
    setIsLoading(true);
    const filterParams = {
      bladeType,
      manufactureStage,
      supplier,
      factoryName,
      inspectionLocation,
      bladeCavityType,
      defectDisposition,
      defectLabelType,
      startDate: startDate ? formatDate(startDate) : null,
      endDate: endDate ? formatDate(endDate) : null,
    };

    try {
      let success = await generateInspectionListReport(filterParams);
      if (!success) {
        setIsLoading(false);
        alert("Oops! Something went wrong while generating the report. Please retry or reach out to support if the issue persists.");
      }
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateInspectionDefectListReport = async () => {
    setIsLoading(true);
    const filterParams = {
      bladeType,
      manufactureStage,
      supplier,
      factoryName,
      inspectionLocation,
      bladeCavityType,
      defectDisposition,
      defectLabelType,
      startDate: startDate ? formatDate(startDate) : null,
      endDate: endDate ? formatDate(endDate) : null,
    };

    try {
      let success = await generateInspectionDefectListCsv(filterParams);
      if (!success) {
        setIsLoading(false);
        alert("Oops! Something went wrong while generating the report. Please retry or reach out to support if the issue persists.");
      }
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const generateBladePMonitoringReport = async () => {
    setIsLoading(true);
    const filterParams = {
      bladeType,
      manufactureStage,
      supplier,
      factoryName,
      inspectionLocation,
      bladeCavityType,
      defectDisposition,
      defectLabelType,
      startDate: startDate ? formatDate(startDate) : null,
      endDate: endDate ? formatDate(endDate) : null,
    };

    try {
      const response = await fetch('/api/report/bladeMonitoringReport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filterParams),
      });

      if (!response.ok) {
        setIsLoading(false);
        alert("Oops! Something went wrong while generating the report. Please retry or reach out to support if the issue persists.");
        return;
      }

      const blob = await response.blob();
      if (!blob) {
        setIsLoading(false);
        alert("Oops! Something went wrong while generating the report. Please retry or reach out to support if the issue persists.");
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `blade_monitoring_report_${today}.csv`);
      link.click();
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="report-container">
        <div className="report-header">
          <NavigateBeforeOutlinedIcon
            onClick={() => navigate(`/home`)}
            className="back-icon"
          />
          <div>
            <Typography className="report-title">Reports</Typography>
          </div>
        </div>
        <Grid container spacing={2} sx={{ m: 2 }}>
          <Grid item xs={3}>
            <Autocomplete
              options={supplierOptions}
              value={supplier}
              onChange={(_, newValue) => setSupplier(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Supplier" />
              )}
            />
          </Grid>

          <Grid item xs={3}>
            <Autocomplete
              options={factoryNameOptions}
              value={factoryName}
              onChange={(_, newValue) => setFactoryName(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Factory Code" />
              )}
            />
          </Grid>

          <Grid item xs={3}>
            <Autocomplete
              options={inspectionLocationOptions}
              value={inspectionLocation}
              onChange={(_, newValue) => setInspectionLocation(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Factory Location" />
              )}
            />
          </Grid>

          <Grid item xs={3}>
            <Autocomplete
              options={bladeTypeOptions}
              value={bladeType}
              onChange={(_, newValue) => setBladeType(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Blade Type" />
              )}
            />
          </Grid>

          <Grid item xs={3}>
            <Autocomplete
              options={manufactureStageOptions}
              value={manufactureStage}
              onChange={(_, newValue) => setManufactureStage(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Manufacturing Stage" />
              )}
            />
          </Grid>

          <Grid item xs={3}>
            <Autocomplete
              options={bladeCavityTypeOptions}
              value={bladeCavityType}
              onChange={(_, newValue) => setBladeCavityType(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Blade Cavity" />
              )}
            />
          </Grid>

          <Grid item xs={3}>
            <Autocomplete
              options={defectDispositionOptions}
              value={defectDisposition}
              onChange={(_, newValue) => setDefectDisposition(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Defect Disposition" />
              )}
            />
          </Grid>

          <Grid item xs={3}>
            <Autocomplete
              options={defectLabelTypeOptions}
              value={defectLabelType}
              onChange={(_, newValue) => setDefectLabelType(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Defect Label Type" />
              )}
            />
          </Grid>

          <Grid item xs={3}>
            <Stack direction="row" spacing={2}>
              <DatePicker
                label="Start Date"
                maxDate={dayjs().startOf('day')}
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                renderInput={(params) => <TextField {...params} required />}
              />
              <DatePicker
                label="End Date"
                maxDate={dayjs().startOf('day')}
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                renderInput={(params) => <TextField {...params} required />}
              />
            </Stack>
          </Grid>

          {/* Date Shortcuts */}
          <Grid item xs={12}>
            <Stack direction="row" spacing={2}>
              <Button onClick={setLastWeek} variant="outlined">
                Last Week
              </Button>
              <Button onClick={setLastMonth} variant="outlined">
                Last Month
              </Button>
              <Button onClick={clearFilters} color="secondary">
                Clear Filters
              </Button>
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={generateInspDefectStatsReport}
                disabled={isLoading || !startDate || !endDate}
              >
                Generate Inspection Defect Stats Report
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={generateInspectionListStatsReport}
                disabled={isLoading || !startDate || !endDate}
              >
                Generate Inspection List Report
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={generateInspectionDefectListReport}
                disabled={isLoading || !startDate || !endDate}
              >
                Generate Inspection Defect List Report
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={generateBladePMonitoringReport}
                disabled={isLoading || !startDate || !endDate}
              >
                Generate Blade Monitoring Report
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {/* Loading Indicator */}
        <Backdrop className="loading-backdrop" open={isLoading}>
          <CircularProgress color="inherit" />
          <Typography className="loading-text">Preparing your report... Please wait while we process the inspection data. This typically takes a few minutes.</Typography>
        </Backdrop>
      </div>
    </LocalizationProvider>
  );
}

export default Report;
