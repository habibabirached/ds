import React, { useState, useCallback } from "react";
import {
  Box,
  LinearProgress,
  Button,
  Grid,
  TextField,
  Stack,
} from "@mui/material";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import dayjs from "dayjs";

import { getInspectionDefectStatsDashboard, getInspectionDefectListDashboard } from "../../services/inspection_api";
import { csv2JSON } from '../../utils/utils';
import { downloadJsonAsCSVFile, downloadJsonAsFile } from '../../services/DownloadFunctions';

import SearchBlade from './SearchBlade';
import BladesInReview from './BladesInReview';
import InspectionStatus from './InspectionStatus';
import MainChart from './mainChart';
import PercentArea from './PercentAreaChart';
import DefectCount from './DefectCount';
import DefectCountHuman from './DefectCountHuman';
import ZDistance from './ZDistance';
import PrecisionAI from './PrecisionAI';
import './App.css';

function DashboardHn() {
  const [loadingSpinner, setLoadingSpinner] = useState(false);
  const [csvFileUrl, setCsvFileUrl] = useState("");
  const [inspDefCsvFileUrl, setInspDefCsvFileUrl] = useState("");
  const [dataList, setDataList] = useState([]);
  const [inspectionDefectList, setInspectionDefectList] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const formatDate = (date) => (date ? date.format('YYYY-MM-DD') : null);

  const setLastWeek = () => {
    setStartDate(dayjs().subtract(1, 'week').startOf('week'));
    setEndDate(dayjs().subtract(1, 'week').endOf('week'));
  };

  const setLastMonth = () => {
    setStartDate(dayjs().subtract(1, 'month').startOf('month'));
    setEndDate(dayjs().subtract(1, 'month').endOf('month'));
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) {
      alert("Please select a start and end date before loading data.");
      return;
    }
  
    setLoadingSpinner(true);
    try {
      // Construct payload to match the Report page's payload
      const filterParams = {
        bladeType: null,
        manufactureStage: null,
        supplier: null,
        factoryName: null,
        inspectionLocation: null,
        bladeCavityType: null,
        defectDisposition: null,
        defectLabelType: null,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
      };
  
      // get Defect Stats CSV
      const csvFileContent = await getInspectionDefectStatsDashboard(filterParams);
      if (!csvFileContent) {
        throw new Error("No CSV content returned from API.");
      }
  
      // Convert CSV to JSON
      const jsonContent = csv2JSON(csvFileContent);
      setDataList(jsonContent);
  
      // Generate a downloadable blob URL for the CSV
      const blob = new Blob([csvFileContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      setCsvFileUrl(url);
  
      // Fetch inspection defect list csv
      const inspectionDefectListCSV = await getInspectionDefectListDashboard(filterParams);
      if (!inspectionDefectListCSV) {
        throw new Error("No CSV content returned from API.");
      }
      setInspectionDefectList(csv2JSON(inspectionDefectListCSV));
      // Generate a downloadable blob URL for the inspectionDefectList CSV
      const iDLblob = new Blob([inspectionDefectListCSV], { type: 'text/csv' });
      const iDLurl = window.URL.createObjectURL(iDLblob);
      setInspDefCsvFileUrl(iDLurl);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load data. Check the console for details.");
    } finally {
      setLoadingSpinner(false);
    }
  }, [startDate, endDate]);


  const handleDownloadDataJson = () => {
    if (!dataList || dataList.length === 0) {
      alert("No data available to download.");
      return;
    }
    downloadJsonAsFile(dataList, 'data_rows.json');
  };

  const handleDownloadDataCsv = () => {
    if (!dataList || dataList.length === 0) {
      alert("No data available to download.");
      return;
    }
    downloadJsonAsCSVFile(dataList, 'data_rows.csv');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className='grid-container'>
        <main className='main-container'>
          {loadingSpinner && (
            <Box sx={{ width: "100%", marginBottom: 2 }}>
              <LinearProgress />
            </Box>
          )}

          {/* Download Buttons */}
          <Grid container direction="row" spacing={1} justifyContent="flex-start" marginTop={1} marginBottom={1}>
            <Button
              style={{ backgroundColor: "darkslategray", color: "white", marginLeft: 10, marginBottom: 5 }}
              onClick={handleDownloadDataJson}
            >
              <FileDownloadIcon /> Download data as JSON
            </Button>

            <Button
              style={{ backgroundColor: "darkslategray", color: "white", marginLeft: 10, marginBottom: 5 }}
              onClick={handleDownloadDataCsv}
            >
              <FileDownloadIcon /> Download data as CSV
            </Button>
          </Grid>

          {/* Date Pickers and Shortcuts */}
          <Grid container spacing={2} sx={{ m: 2 }}>
            <Grid item xs={6}>
              <DatePicker
                label="Start Date"
                maxDate={dayjs().startOf('day')}
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                renderInput={(params) => <TextField {...params} required />}
              />
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label="End Date"
                maxDate={dayjs().startOf('day')}
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                renderInput={(params) => <TextField {...params} required />}
              />
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={2}>
                <Button onClick={setLastWeek} variant="outlined">Last Week</Button>
                <Button onClick={setLastMonth} variant="outlined">Last Month</Button>
                <Button onClick={clearFilters} color="secondary">Clear Filters</Button>
                <Button onClick={fetchData} variant="contained" color="primary">Load Data</Button>
              </Stack>
            </Grid>
          </Grid>

          {/* Data Visualization */}
          {dataList && dataList.length > 0 ? (
            <div className='main-cards'>
            <div className='bigCard'>
              <h3>Annotation Status by Blade</h3>
              <SearchBlade csvFileUrl={csvFileUrl} />
            </div>

            <div className='bigCard'>
              <h3>Blades in Annotation Process</h3>
              <BladesInReview csvFileUrl={csvFileUrl} />
            </div>

            <div className='bigCard2'>
              <h3>Annotation Status Trend</h3>
              <InspectionStatus csvFileUrl={csvFileUrl} />
            </div>

            <div className='wideCard'>
              <h3>Review Status on AI Findings</h3>
              <MainChart csvFileUrl={csvFileUrl} />
            </div>

            <div className='wideCard'>
              <h3>Review Status on Manual Findings</h3>
              <PercentArea csvFileUrl={csvFileUrl} />
            </div>

            <div className='wideCard'>
              <h3>AI Findings Across Different Indication Type</h3>
              <DefectCount csvFileUrl={csvFileUrl} />
            </div>

            <div className='wideCard'>
              <h3>Manual Findings Across Different Indication Type</h3>
              <DefectCountHuman csvFileUrl={csvFileUrl} />
            </div>

            <div className='wideCard'>
              <h3>Z-Distance</h3>
              <ZDistance inspDefCsvFileUrl={inspDefCsvFileUrl} />
            </div>

            <div className='wideCard'>
              <h3>AI Model Performance</h3>
              <p>The graph is based on the validation test dataset from 10/25/2024.</p>
              <PrecisionAI csvFileUrl={csvFileUrl} />
            </div>
          </div>
        ) : (
            <div><h3>No data loaded or no data for the selected range.</h3></div>
          )}
        </main>
      </div>
    </LocalizationProvider>
  );
}

export default DashboardHn;
