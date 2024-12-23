
/*
  This file allows the browsing of all defects in the system.
  Users can filter these defects and download the original 360 image plus the selected 2d shots with the defect annotation fragments.
  Note that defects are parsed out of measurements.
*/

import "./BrowseImagesPage.css";
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

import { downloadSelectedImageFilesAsync, getImage, searchImageList } from "../../services/image_api";

import CustomColumnHeader from "../../components/Filter/CustomColumnHeader";
import useFilters from "../../components/Filter/useFilters2";
import { BLADE_CAVITIES, DEFECT_DISPOSITION_OPTIONS } from "../../config";
import { getMeasurementLocation } from "../../utils/utils";
import { downloadSelectedDefectFilesAndAnnotationsAsync, searchDefectList, readSearchDefectListCsv } from "../../services/defect_api";

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

function BrowseImagesPage() {
  const [loadingSpinner, setLoadingSpinner] = useState(false); // Spinner visibility state

  const loggedUser = localStorage.getItem("loggedSSO");

  const [defectSeverityTable, setDefectSeverityTable] = useState({});
  const [defectTypeList, setDefectTypeList] = useState([]);

  const bladeCavities = BLADE_CAVITIES;

  const defectDispositionOptions = DEFECT_DISPOSITION_OPTIONS;

  const [imageList, setImageList] = useState([]);

  const [defectIdList, setDefectIdList] = useState([]);

  const [selectedIdList, setSelectedIdList] = useState([]);
  const [showProgressBar, setShowProgressBar] = useState(false);

  const [selectedImageId, setSelectedImageId] = useState(null);

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

  // Typical record:
  // {
  //   "blade_type": "77.5",
  //   "esn": "tpi-50775",
  //   "distance": 48,
  //   "id": 8449,
  //   "inspection_id": 173,
  //   "sect": "le",
  //   "upload_date": "Tue, 23 Jul 2024 14:44:46 GMT"
  // }


  const initialFilters = {
    id: { value: "", type: "contains" },
    inspection_id: { value: "", type: "contains" },
    esn: { value: "", type: "contains" },
    distance: { value: "", type: "equals" },
    upload_date: { value: "", type: "contains" },
    blade_type: { value: "", type: "contains" },
    sect: { value: "", type: "contains" },
  };

  const [filters, handleFilterChange, clearFilters, setFilters, applyFilters] =
    useFilters(initialFilters, "BrowseImagesFilters");

  const filteredRows = applyFilters(imageList, filters);

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
  const fetchImageList = async () => {
    try {
      // the search parameters are empty here because we are searching for all measurements in the system.
      // TODO: pass filter parameters here: esn, bladeSection, rootFaceDistance, validationStatus
      
      setLoadingSpinner(true);

      const esn = null;
      const min_distance = null;
      const max_distance = null;
      const images = await searchImageList(
        esn, min_distance, max_distance
      );
      console.log('using imageList:',images);

      setLoadingSpinner(false);

      if (images != null) {
        
        setImageList([]);
        setImageList(images);
        
        if (images.length > 0) {
          // defect.id here is the actual record id for a defect (2d shapshot)
          setSelectedImageId(images[0].id);
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
      //await fetchDefectSeverityTable();
      //await fetchInspectionList();
      await fetchImageList();
      
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
  const getImageUrl = (image_id) => {
    return `/api/image/${image_id}/file?ts=${currentImageTS}`;
  };

  // configure table columns
  const imageColumnsMeta = [
    {
      field: "id",
      headerName: "Image ID",
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
    // {
    //   field: "inspection_id",
    //   headerName: "Inspection ID",
    //   width: 150,
    //   editable: false,
    //   type: "singleSelect",
    //   valueOptions: defectTypeList,
    //   renderHeader: (params) => (
    //     <CustomColumnHeader
    //       column={params.colDef}
    //       filters={filters}
    //       handleFilterChange={handleFilterChange}
    //       apiRef={apiRef}
    //     />
    //   ),
    // }, 
    {
      field: "distance",
      headerName: "Distance From Root",
      type: "number",
      width: 200,
      editable: false,
      valueGetter: (params) => {
        let distance = params.row.distance;
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
      field: "upload_date",
      headerName: "Upload Date",
      type: "date",
      width: 150,
      editable: false,
      valueGetter: (params) => {
        let upload_date = params.row.upload_date;
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
      field: "esn",
      headerName: "ESN",
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
      field: "blade_type",
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
      field: "sect",
      headerName: "Blade Cavity",
      width: 150,
      editable: false,
      valueGetter: (params) => {
        return getCavityName(params.row.sect);
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
    console.log("handleDownloadFilteredImages() called.");
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
      await downloadSelectedImageFilesAsync(filteredIds);
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
    setSelectedImageId(params.row.id);
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
    <div className="browseimages">
      <div style={{ fontSize: 25, paddingTop: 20, paddingBottom: 20 }}>
        <NavigateBeforeOutlinedIcon
          onClick={() => navigate(-1)}
          style={{ display: "grid", alignItems: "center", fontSize: 30 }}
        />
        Browse 360 Images <br />
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
            columns={imageColumnsMeta}
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

      {selectedImageId == null && (
        <Box sx={{ marginTop: 10, textAlign: "center" }}>
          <Typography>
            {" "}
            Select a defect from the list to start validation{" "}
          </Typography>
        </Box>
      )}

      {selectedImageId != null && (
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
              <strong> 360 Image </strong>{" "}
            </Box>
            <img
              align="center"
              width="100%"
              
              height="auto"
              src={getImageUrl(selectedImageId)}
              alt={`defect image id# ${selectedImageId}`}
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

export default BrowseImagesPage;
