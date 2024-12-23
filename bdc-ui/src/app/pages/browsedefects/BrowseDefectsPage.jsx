
/*
  This file allows the browsing of all defects in the system.
  Users can filter these defects and download the original 360 image plus the selected 2d shots with the defect annotation fragments.
  Note that defects are parsed out of measurements.
*/

import "./BrowseDefectsPage.css";
import { useEffect, useState, Suspense, Fragment, useCallback } from "react";
import {
  Box,
  LinearProgress,
  Button,
  Grid,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";

import { DataGrid, useGridApiRef } from "@mui/x-data-grid";
import { showDirectoryPicker } from "https://cdn.jsdelivr.net/npm/file-system-access/lib/es2018.js";

//import { useHistory } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Loading from "../../components/Loading";
import React from "react";

import DrawOutlinedIcon from "@mui/icons-material/DrawOutlined";
import GridOnOutlinedIcon from "@mui/icons-material/GridOnOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import NavigateBeforeOutlinedIcon from "@mui/icons-material/NavigateBeforeOutlined";
import CardMembershipIcon from "@mui/icons-material/CardMembership";

import {downloadJsonAsCSVFile, downloadJsonAsFile} from "../../services/DownloadFunctions"

import FileDownloadIcon from "@mui/icons-material/FileDownload";
import LinearProgressWithLabel from "../../components/LinearProgressWithLabel";
import {
  getDefectSeverity,
  getMeasurement as getDefect,

} from "../../services/measurement_api";
import dayjs from "dayjs";

import { getImage } from "../../services/image_api";

import CustomColumnHeader from "../../components/Filter/CustomColumnHeader";
import useFilters from "../../components/Filter/useFilters2";
import { BLADE_CAVITIES, DEFECT_DISPOSITION_OPTIONS } from "../../config";
import { csv2JSON, getMeasurementLocation } from "../../utils/utils";
import { downloadSelectedDefectFilesAndAnnotationsAsync, readSearchDefectListCsv, searchDefectList } from "../../services/defect_api";

const textFieldStyles = {
  margin: 0,
  padding: 0,
  "& .MuiInputBase-root": {
    height: "10px",
    fontSize: "0.875rem",
  },
  "& .MuiOutlinedInput-input": {
    padding: "8px 14px",
  },
};

const DEBUG = true;

function BrowseDefectsPage() {
  const [loadingSpinner, setLoadingSpinner] = useState(false); // Spinner visibility state

  const loggedUser = localStorage.getItem("loggedSSO");

  const [defectSeverityTable, setDefectSeverityTable] = useState({});
  const [defectTypeList, setDefectTypeList] = useState([]);

  const bladeCavities = BLADE_CAVITIES;

  const defectDispositionOptions = DEFECT_DISPOSITION_OPTIONS;

  const [defectList, setDefectList] = useState([]);

  const [defectIdList, setDefectIdList] = useState([]);

  const [selectedIdList, setSelectedIdList] = useState([]);
  const [showProgressBar, setShowProgressBar] = useState(false);

  const [selectedDefectId, setSelectedDefectId] = useState(null);

  const [currentImageTS, setCurrentImageTS] = useState(new Date().getTime());

  const VALIDATION_AS_IS = "As Is";
  const VALIDATION_REVIEW = "Review";
  const VALIDATION_REJECT = "Reject";
  const NOT_VALIDATED = "Not Validated";

  const VALIDATED_OPTIONS_LIST = [
    VALIDATION_AS_IS,
    VALIDATION_REVIEW,
    VALIDATION_REJECT,
  ];

  const EMPTY_ANNOTATION = {
    version: "5.2.1",
    flags: {},
    shapes: [],
    imagePath: "unknown.png",
    imageData: null,
    imageHeight: 768,
    imageWidth: 1024,
  };

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialFilters = {
    defect_id: { value: "", type: "contains" },
    root_face_distance: { value: "", type: "equals" },
    inspection_upload_date: { value: "", type: "contains" },
    sso: { value: "", type: "contains" },
    inspection_blade_type: { value: "", type: "contains" },
    inspection_sect: { value: "", type: "contains" },
    finding_type: { value: "", type: "contains" },
    is_manual: { value: "all", type: "All" },
    ge_disposition: {value: "", type:"contains"},
    area: { value: "", type: "equals" },
    width:{ value: "", type: "equals" },
    length:{ value: "", type: "equals" },
  };

  const [filters, handleFilterChange, clearFilters, setFilters, applyFilters] =
    useFilters(initialFilters, "DefectValidationFilters");

  const filteredRows = applyFilters(defectList, filters);

  const addDefectId = (defectList) => {
    if (defectList != null)
      for (let defect of defectList) {
        defect["defect_id"] = defect.inspection_esn + "-" + defect.id;
      }
  };

  const getProbabilityOfFailure = (defect_type) => {
    let prob = defectSeverityTable[defect_type];
    if (prob == null) prob = "N/A";
    //console.log(`Probability for: ${defect_type} is ${prob}`);
    return prob;
  };

  
  // This data is crucial for initializing and updating the defect type options in the data grid columns
  // (specifically in the measurementsColumnsMeta definition) and for various other parts of the UI
  // where defect severity and types are displayed or selected. Accurate defect severity information
  // helps in validating defects and making informed decisions about their disposition.

  const fetchDefectSeverityTable = async () => {
    try {
      let table = await getDefectSeverity();
      if (table != null) {
        setDefectSeverityTable(table);
        console.log("defectSeverityTable:", table);

        let defectTypes = Object.keys(table);
        defectTypes.sort();
        setDefectTypeList(defectTypes);
        console.log("defectTypeList:", defectTypes);
      }
    } catch (error) {
      console.log(error);
    }
  };


  // search for all individual measurements in the system
  // measurement here is a custom record representing a search result
  // includes validation status and optional original measurement id
  const fetchDefectList = async () => {
    try {
      // the search parameters are empty here because we are searching for all measurements in the system.
      // TODO: pass filter parameters here: esn, bladeSection, rootFaceDistance, validationStatus
      
      setLoadingSpinner(true);

      const esn = null;
      // const defects = await searchDefectList(
      //   esn,
      // );

      let defectCsvContent = await readSearchDefectListCsv(esn);
      let defList = [];
      if (defectCsvContent != null) {
        defList = csv2JSON(defectCsvContent);
      }

      console.log('defectList:',defList);

      setLoadingSpinner(false);

      if (defList != null) {
        addDefectId(defList);
        setDefectList([]);
        setDefectList(defList);
        console.log("updated measurementList toto:", defList);
        logState({ measurementList: defList });

        let idList = [];
        for (let meas of defList) {
          idList.push(meas.id);
        }

        setDefectIdList(idList);
        console.log("defectIdList:", idList);

        if (defList.length > 0) {
          // defect.id here is the actual record id for a defect (2d shapshot)
          setSelectedDefectId(defList[0].id);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  // called after the component is created
  useEffect(() => {
    const fetchData = async () => {
      console.log("fetchData() called");
      await fetchDefectSeverityTable();
      //await fetchInspectionList();
      await fetchDefectList();
    };

    fetchData();

    // no return function.
    // we could return a cleanup function here.
  }, []);

  const getCavityName = getMeasurementLocation; // alias for the function

  const formatDate = (date) => {
    console.log("formatDate:", date);
    if (date != null && date !== "") {
      //return dayjs(date).format('YYYY-MM-DD');
      return new Date(date).toISOString().split("T")[0];
    }
    return date;
  };

  // We use time here to force the reload of the image upon upload
  const getDefectImageUrl = (defect_id, includeAnnotations = true) => {
    return `/api/defect/${defect_id}/image_file?includeAnnotations=${includeAnnotations}&ts=${currentImageTS}`;
  };

  // configure table columns
  const defectColumnsMeta = [
    {
      field: "defect_id",
      headerName: "Defect ID",
      width: 150,
      editable: false,
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
        />
      ),
    },

    {
      field: "root_face_distance",
      headerName: "Distance From Root",
      type: "number",
      width: 200,
      editable: false,
      valueGetter: (params) => {
        let distance = params.row.root_face_distance;
        // console.log("distance ===", params.row);
        if (distance != null) distance = Math.round(distance * 10) / 10;
        return distance;
      },
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
          textFieldStyles={textFieldStyles}
        />
      ),
    },

    {
      field: "inspection_upload_date",
      headerName: "Upload Date",
      type: "date",
      width: 150,
      editable: false,
      valueGetter: (params) => {
        let upload_date = params.row.inspection_upload_date;
        if (upload_date != null) return new Date(upload_date);
        else return null;
      },
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
        />
      ),
    },
    {
      field: "sso",
      headerName: "Inspector ID",
      width: 150,
      editable: false,
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
        />
      ),
    },
    {
      field: "inspection_blade_type",
      headerName: "Blade Type",
      width: 150,
      editable: false,
      type: "singleSelect",
      valueOptions: defectTypeList,
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
        />
      ),
    },
    {
      field: "inspection_sect",
      headerName: "Blade Cavity",
      width: 150,
      editable: false,
      valueGetter: (params) => {
        return getCavityName(params.row.inspection_sect);
      },
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
        />
      ),
    },
    {
      field: "finding_type",
      headerName: "Defect Type",
      width: 150,
      editable: false,
      type: "singleSelect",
      valueOptions: defectTypeList,
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
        />
      ),
    },
    {
      field: "is_manual",
      headerName: "Manual/AI",
      width: 200,
      editable: false,
      type: "singleSelect",
      valueOptions: ["Manual", "AI"],
      valueGetter: (params) => (params.row.is_manual ? "Manual" : "AI"),
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
          textFieldStyles={textFieldStyles}
          isManualFilter
        />
      ),
    },
    {
      field: "ge_disposition",
      headerName: "Disposition",
      editable: false,
      type: "singleSelect",
      valueOptions: defectDispositionOptions,
      width: 150,
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
        />
      ),
    },

    {
      field: "area",
      headerName: "Area (mm²)",
      type: "number",
      editable: false,
      width: 150,
      valueGetter: (params) => {
        let area = params.row.area;
        //if (area == 0) return 'N/A';
        area = (area * 1000 * 1000).toFixed(2); // convert into mm2
        return area;
      },
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
          textFieldStyles={textFieldStyles}
        />
      ),
    },
    {
      field: "width",
      headerName: "Width (mm)",
      type: "number",
      editable: false,
      width: 150,
      valueGetter: (params) => {
        let width = params.row.width;
        //if (width == 0) return 'N/A';
        width = (width * 1000).toFixed(2); // convert to mm
        return width;
      },
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
          textFieldStyles={textFieldStyles}
        />
      ),
    },
    {
      field: "length",
      headerName: "Length (mm)",
      type: "number",
      editable: false,
      width: 150,
      valueGetter: (params) => {
        let length = params.row.length;
        //if (height == 0) return 'N/A';
        return (length * 1000).toFixed(2); // convert to mm
      },
      renderHeader: (params) => (
        <CustomColumnHeader
          column={params.colDef}
          filters={filters}
          handleFilterChange={handleFilterChange}
          apiRef={apiRef}
          textFieldStyles={textFieldStyles}
        />
      ),
    },
    
  ];

  // in case more than one id is selected at a time using the checkboxes from the table
  const rowsSelected = (indexList) => {
    setSelectedIdList(indexList);
    console.log("selectedIndices:", selectedIdList);
  };

  // We don't need this anymore, just have to return the new row as shown below
  const apiRef = useGridApiRef();

  // called when the user updates one or more row props
  // we use this to perform validation and enforce rules
  const handleProcessRowUpdate = async (updatedRow, originalRow) => {
    console.log("handleProcessRowUpdate() called.");
    console.log("originalRow:", originalRow);
    console.log("updatedRow:", updatedRow);

    return updatedRow;
  };

  const handleProcessRowUpdateError = () => {
    console.log("handleProcessRowUpdateError() called.");
  };

  // This function, `handleDownloadFilteredData`, is designed to download the filtered data
  // that is currently displayed in the DataGrid. When the user clicks the corresponding
  // button, this function is triggered. It iterates through all rows of the DataGrid, regardless
  // of pagination, to collect the IDs of the rows that match the current filters. These IDs represent the measurements
  // that need to be downloaded. If there are any such IDs, the function calls
  // `downloadValidatedMeasurementFilesAndAnnotations` with the list of filtered IDs to initiate the
  // download process. If no measurements are found in the filtered data, it alerts the user
  // with a message indicating that no measurements are available for download.
  const handleDownloadFilteredImages = async () => {
    console.log("handleDownloadFilteredData() called.");
    setLoadingSpinner(true); // Show spinner

    // Access the visible rows from the state
    const filteredRowsLookup = apiRef.current.state.filter.filteredRowsLookup;
    console.log("filteredRowsLookup = ", filteredRowsLookup);
    let filteredIds = [];

    // Iterate over the visible rows to collect their IDs
    for (const id in filteredRowsLookup) {
      if (filteredRowsLookup[id]) {
        const row = apiRef.current.getRow(id); // Retrieve the row data
        filteredIds.push(parseInt(id, 10)); // Ensure the correct field is used for ID
        console.log(`Row ID: ${id}, Defect ID: ${row.defect_id}`);
      }
    }

    console.log("Filtered defect idList:", filteredIds);
    if (filteredIds.length > 0) {
      await downloadSelectedDefectFilesAndAnnotationsAsync(filteredIds);
    } else {
      alert("No defects found in the filtered data.");
    }
    setLoadingSpinner(false); // Hide spinner when done
  };


  const handleDownloadFilteredDataJson = async () => {
    console.log("handleDownloadFilteredDataJson() called.");
    setLoadingSpinner(true); // Show spinner

    downloadJsonAsFile(filteredRows,'filtered_rows.json')

    setLoadingSpinner(false);
  };

  const handleDownloadFilteredDataCsv = async () => {
    console.log("handleDownloadFilteredDataCsv() called.");
    setLoadingSpinner(true); // Show spinner

    downloadJsonAsCSVFile(filteredRows,'filtered_rows.csv')

    setLoadingSpinner(false);
  };

  const handleClearFilters = () => {
    clearFilters();
  }

  // when the user selects a row
  // The `handleRowClick` function is executed when a row in the DataGrid is selected. 

  const handleRowClick = async (params) => {
    console.log(`handleRowClick() called with:`, params);
    setSelectedDefectId(params.row.id);
    logState({ selectedMeasurementId: params.row.id });

  };

  // --------------------------- Annotation Review Actions ------------------------

  // Look into the annotation file content for its image name and replace it with .json ext.
  const getAnnotationFilename = (annotationFileContent) => {
    let annoFilename = "unknown.json";
    if (
      annotationFileContent != null &&
      annotationFileContent["imagePath"] != null
    ) {
      annoFilename = annotationFileContent["imagePath"]
        .replace(".png", ".json")
        .replace(".jpg", ".json")
        .replace(".jpeg", ".json");
    }

    if (!annoFilename.endsWith(".json")) annoFilename += ".json";
    return annoFilename;
  };


  const logState = async (state) => {
    console.log("Logging state:", state);
    // if (DEBUG) {
    //   try {
    //     await axios.post("http://localhost:3001/log", state);
    //   } catch (error) {
    //     console.error("Error logging state:", error);
    //   }
    // }
  };

  

  // --------------------------------- Page layout ---------------------------------------
  return (
    <div className="browsedefects">
      <div style={{ fontSize: 25, paddingTop: 20, paddingBottom: 20 }}>
        <NavigateBeforeOutlinedIcon
          onClick={() => navigate(-1)}
          style={{ display: "grid", alignItems: "center", fontSize: 30 }}
        />
        Browse Defects <br />
      </div>
      {/* <Grid container direction="row" spacing={1} justifyContent="space-between">
             Search bar: inspection_upload_date, esn, defect type, blade type, inspector
      </Grid> */}
      {/* Download Validated Data */}
      <Grid
        container
        direction="row"
        spacing={1}
        justifyContent="flex-start"
      >
       
        <Button
          style={{
            backgroundColor: "darkslategray",
            color: "white",
            marginLeft: 10,
            marginBottom:5,
          }}

          onClick={handleDownloadFilteredImages}
        >
          <FileDownloadIcon /> Download filtered images
        </Button>

        <Button
          style={{
            backgroundColor: "darkslategray",
            color: "white",
            marginLeft: 10,
            marginBottom:5,
          }}

          onClick={handleDownloadFilteredDataJson}
        >
          <FileDownloadIcon /> Download filtered data as JSON
        </Button>

        <Button
          style={{
            backgroundColor: "darkslategray",
            color: "white",
            marginLeft: 10,
            marginBottom:5,
          }}

          onClick={handleDownloadFilteredDataCsv}
        >
          <FileDownloadIcon /> Download filtered data as CSV
        </Button>
      </Grid>
      <Grid   
        container
        direction="row"
        spacing={1}
        justifyContent="flex-end"
      >
        <Button
          variant="contained" 
          color="primary"
          style={{  
            marginLeft: 10,
            marginBottom:5,
          }}

          onClick={handleClearFilters}
        >
          <FileDownloadIcon /> Clear Filters
        </Button>

      </Grid>
      
      {/* Spinner display */}
      {loadingSpinner && (
        // <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
        //   <CircularProgress size={160} />
        // </Box>
        <Box sx={{ width: "100%" }}>
          <LinearProgress />
        </Box>
      )}
      <Suspense fallback={<Loading />}>
        <Box sx={{ width: "100%" }}>
          {showProgressBar && <LinearProgress />}
        </Box>
        <Box sx={{ height: "40vh", width: "100%" }}>
          <DataGrid
            apiRef={apiRef}
            editMode="row"
            rows={filteredRows}
            // getRowHeight={() => 'auto'} //https://mui.com/x/react-data-grid/row-height/
            columns={defectColumnsMeta}
            sx={{
              "& .MuiDataGrid-columnHeader:focus-within .MuiDataGrid-menuIconButton":
                {
                  display: "none",
                },
              "& .MuiDataGrid-columnHeader .MuiDataGrid-menuIconButton": {
                display: "none",
              },
              "& .MuiDataGrid-columnHeader:hover .MuiDataGrid-menuIcon": {
                display: "none", // Hide the menu icon on hover
              },
              "& .MuiDataGrid-columnHeader .MuiDataGrid-columnHeaderTitleContainer:after":
                {
                  display: "none", // Hide the arrow icon
                },
              "& .MuiDataGrid-sortIcon": {
                display: "none", // Hide the sort icon
              },
              "& .MuiDataGrid-columnHeaders": {
                minHeight: "180px !important",
                height: "180px !important",
                maxHeight: "180px !important",
                lineHeight: "normal !important",
              },
              "& .MuiDataGrid-columnHeadersInner": {
                minHeight: "180px !important",
                height: "180px !important",
              },
              "& .MuiDataGrid-columnHeaderRow": {
                minHeight: "180px !important",
              },
              "& .MuiDataGrid-columnHeader--sortable": {
                minHeight: "180px !important",
              },
              "& .MuiDataGrid-columnHeader": {
                minHeight: "180px !important",
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                whiteSpace: "normal !important",
                overflow: "visible !important",
              },
              "& .MuiDataGrid-cell": {
                padding: "8px 16px",
              },
              "& .MuiDataGrid-row": {
                maxHeight: "none",
              },
              "& .MuiInputBase-root": {
                height: "40px",
              },
              "& .MuiOutlinedInput-input": {
                padding: "10px",
              },
            }}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 8,
                },
              },
            }}
            onRowClick={handleRowClick}
            onRowSelectionModelChange={rowsSelected}
            pageSizeOptions={[5]}
            processRowUpdate={handleProcessRowUpdate}
            onProcessRowUpdateError={handleProcessRowUpdateError}
          />
        </Box>
      </Suspense>

      {selectedDefectId == null && (
        <Box sx={{ marginTop: 10, textAlign: "center" }}>
          <Typography>
            {" "}
            Select a defect from the list to start validation{" "}
          </Typography>
        </Box>
      )}

      {selectedDefectId != null && (
        <Grid
          container
          direction="row"
          spacing={2}
          justifyContent="space-between"
          alignItems="center"
        >
          <Grid item  xs={2} alignItems="center"></Grid>
          <Grid item  xs={8} alignItems="center">
            <Box sx={{ textAlign: "center" }}>
              {" "}
              <strong> Defect Image </strong>{" "}
            </Box>
            <img
              align="center"
              width="100%"
              
              height="auto"
              src={getDefectImageUrl(selectedDefectId)}
              alt={`defect image id# ${selectedDefectId}`}
              onError={() => {
                console.log("Image Load Error");
              }}
              onLoad={() => {
                console.log("Image Loaded");
              }}
            />
          </Grid>
          <Grid item  xs={2} alignItems="center"></Grid>
        </Grid>)}

    </div>
  );
}

export default BrowseDefectsPage;
