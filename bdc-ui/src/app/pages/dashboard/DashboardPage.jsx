
/*
  This file allows the browsing of all defects in the system.
  Users can filter these defects and download the original 360 image plus the selected 2d shots with the defect annotation fragments.
  Note that defects are parsed out of measurements.
*/

import "./DashboardPage.css";
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

//import { useHistory } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Loading from "../../components/Loading";
import React from "react";

import NavigateBeforeOutlinedIcon from "@mui/icons-material/NavigateBeforeOutlined";

import {downloadJsonAsCSVFile, downloadJsonAsFile} from "../../services/DownloadFunctions"

import FileDownloadIcon from "@mui/icons-material/FileDownload";

import useFilters from "../../components/Filter/useFilters2";
import { BLADE_CAVITIES, DEFECT_DISPOSITION_OPTIONS } from "../../config";
import { csv2JSON, getMeasurementLocation } from "../../utils/utils";
import { readInspectionStatsCsvAsync } from "../../services/inspection_api";


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

  const [dataList, setDataList] = useState([]);

  const [selectedIdList, setSelectedIdList] = useState([]);
  const [showProgressBar, setShowProgressBar] = useState(false);

  const [selectedDefectId, setSelectedDefectId] = useState(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  //TODO: build this based on the csv file columns
  const emptyFilters = {
    id: { value: "", type: "contains" },
  };


  // called after the component is created
  useEffect(() => {
    const fetchData = async () => {
      console.log("fetchData() called");
      
      setLoadingSpinner(true);
      let csvFileContent = await readInspectionStatsCsvAsync();
      let jsonContent = csv2JSON(csvFileContent);
      console.log('jsonContent:',jsonContent);

      // Add id to the rows
      let i = 1;
      for (let obj of jsonContent) {
        obj['id'] = i++;
      }
      
      // let filterTemplate = buildFilterTemplate(jsonContent);
      // setInitialFilters(filterTemplate);

      let meta = buildTableColumnsMeta(jsonContent);
      setTableColumnsMeta(meta);
      setDataList(jsonContent);
      
      setLoadingSpinner(false);

    };

    fetchData();

    // no return function.
    // we could return a cleanup function here.
  }, []);


  // to be cloned, modified and added to tableColumnsMeta list
  const TABLE_COLUMN_TEMPLATE =  {
    field: "field",
    headerName: "Field Name",
    width: 150,
    editable: false,
  };

  const [tableColumnsMeta, setTableColumnsMeta] = useState([]);

  const buildTableColumnsMeta = (jsonList) => {
    let meta = []
    if (jsonList != null && jsonList.length > 0) {
      let obj = jsonList[0];
      for (let key of Object.keys(obj)) {
        let metaObj = Object.assign({}, TABLE_COLUMN_TEMPLATE);
        metaObj.field = key;
        metaObj.headerName=key;
        meta.push(metaObj);
      }
    }
    return meta;
  }

  const buildFilterTemplate = (jsonList) => {
    let template = {}
    if (jsonList != null && jsonList.length > 0) {
      let obj = jsonList[0];
      for (let key of Object.keys(obj)) {
        template[key] = { value: "", type: "contains" };
      }
    }
    return template;
  }

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


  const handleDownloadDataJson = async () => {
    console.log("handleDownloadFilteredDataJson() called.");
    setLoadingSpinner(true); // Show spinner
    downloadJsonAsFile(dataList,'data_rows.json')
    setLoadingSpinner(false);
  };

  const handleDownloadDataCsv = async () => {
    console.log("handleDownloadFilteredDataCsv() called.");
    setLoadingSpinner(true); // Show spinner
    downloadJsonAsCSVFile(dataList,'data_rows.csv')
    setLoadingSpinner(false);
  };

  // when the user selects a row
  // The `handleRowClick` function is executed when a row in the DataGrid is selected. 

  const handleRowClick = async (params) => {
    console.log(`handleRowClick() called with:`, params);
    setSelectedDefectId(params.row.id);

  };



  // --------------------------------- Page layout ---------------------------------------
  return (
    <div className="dashboard">
      <div style={{ fontSize: 25, paddingTop: 20, paddingBottom: 20 }}>
        <NavigateBeforeOutlinedIcon
          onClick={() => navigate(-1)}
          style={{ display: "grid", alignItems: "center", fontSize: 30 }}
        />
        Dashboard <br />
      </div>
     
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

          onClick={handleDownloadDataJson}
        >
          <FileDownloadIcon /> Download data as JSON
        </Button>

        <Button
          style={{
            backgroundColor: "darkslategray",
            color: "white",
            marginLeft: 10,
            marginBottom:5,
          }}

          onClick={handleDownloadDataCsv}
        >
          <FileDownloadIcon /> Download data as CSV
        </Button>
      </Grid>
      
      {/* Spinner display */}
      {loadingSpinner && (
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
            rows={dataList}
            // getRowHeight={() => 'auto'} //https://mui.com/x/react-data-grid/row-height/
            columns={tableColumnsMeta}
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

 
    </div>

    

  );
}

export default BrowseDefectsPage;
