import React, { useState, useEffect } from "react";
import { DataGrid, useGridApiRef } from "@mui/x-data-grid";
import CustomColumnHeader from "../../components/Filter/CustomColumnHeader";
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemText,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import DrawOutlinedIcon from "@mui/icons-material/DrawOutlined";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { downloadInspectionDataAsync } from "../../services/inspection_api";

const BladeHomeTable = ({
  inspectionList,
  rowsSelected,
  initialFilters,
  filters,
  setFilters,
  handleFilterChange,
  setShowDownloadSnack,
  applyFilters,
}) => {
  const navigate = useNavigate();
  const filteredRows = applyFilters(inspectionList, filters);
  const apiRef = useGridApiRef();

  const [anchorEl, setAnchorEl] = useState(null);
  const [columnVisibility, setColumnVisibility] = useState({});

  const initializeColumnVisibility = () => {
    const visibilityState = apiRef.current
      .getAllColumns()
      .reduce((acc, col) => {
        acc[col.field] = !col.hide;
        return acc;
      }, {});
    setColumnVisibility(visibilityState);
  };

  const setAllColumnVisibilityToVisible = () => {
    const visibilityState = apiRef.current
      .getAllColumns()
      .reduce((acc, col) => {
        acc[col.field] = true;
        return acc;
      }, {});
    apiRef.current.setColumnVisibilityModel(visibilityState);
    setColumnVisibility(visibilityState);
  };

  useEffect(() => {
    if (apiRef.current) {
      initializeColumnVisibility();
    }
  }, [apiRef]);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleToggleColumn = (field) => {
    const newVisibility = !columnVisibility[field];
    apiRef.current.setColumnVisibility(field, newVisibility);
    setColumnVisibility((prev) => ({
      ...prev,
      [field]: newVisibility,
    }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    setAllColumnVisibilityToVisible();
  };

  // the parameter here is the whole inspection record
  const downloadInspection = (inspection) => {
    console.log('downloadInspection() called with:',inspection);
    downloadInspectionDataAsync(inspection);
    setShowDownloadSnack(true);
  }


  const inspectionColumnsMeta = [
    { field: "id", headerName: "ID", width: 60 },
    {
      field: "date",
      headerName: "Date",
      width: 160,
      editable: false,
      valueGetter: (params) => {
        console.log("refz_date_home = ", params.row.date);
        return new Date(params.row.date); //.toISOString().split("T")[0];
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
      field: "factory_name",
      headerName: "Factory Name",
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
      field: "location",
      headerName: "Factory Location",
      width: 170,
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
      field: "sect",
      headerName: "Blade Cavity",
      width: 125,
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
      field: "manufacture_stage",
      headerName: "Manufacture Stage",
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
      field: "manufacture_date",
      headerName: "Manufacture Date",
      width: 150,
      editable: false,
      valueGetter: (params) => {
        return params.row.manufacture_date == null
          ? ""
          : new Date(params.row.manufacture_date).toISOString().split("T")[0];
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
      field: "modality",
      valueGetter: () => {
        return "Blade Crawler";
      },
      headerName: "Inspection Modality",
      description: "Modality of inspection",
      sortable: true,
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
      field: "sso",
      headerName: "Inspector SSO",
      description: "Inspector SSO",
      sortable: true,
      width: 130,
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
      field: "status",
      headerName: "Annotation",
      description: "Annotation Status",
      sortable: true,
      width: 140,
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
      field: "view",
      headerName: "",
      width: 200,
      renderCell: (params) => (
        <strong>
          <Button
            variant="contained"
            size="small"
            style={{
              minWidth: 160,
              fontWeight: "bold",
              backgroundColor: "#679267",
            }}
            tabIndex={params.hasFocus ? 0 : -1}
            onClick={() => navigate(`/imageview/${params.row.id}`)}
          >
            <ViewInArOutlinedIcon />
            Virtual Tour
          </Button>
        </strong>
      ),
    },
    {
      field: "indicators",
      headerName: "",
      width: 200,
      renderCell: (params) => (
        <strong>
          <Button
            variant="contained"
            size="small"
            style={{
              minWidth: 160,
              fontWeight: "bold",
              backgroundColor: "seagreen",
            }}
            tabIndex={params.hasFocus ? 0 : -1}
            onClick={() => navigate(`/imageinspection/${params.row.id}`)}
          >
            <DrawOutlinedIcon></DrawOutlinedIcon>Indicators
          </Button>
        </strong>
      ),
    },
    {
      field: "get_report_data_zip",
      headerName: "",
      width: 200,
      renderCell: (params) => (
        <strong>
          {/* <a
            href={`api/inspection/${params.row.id}/zip`}
            download={`report_${params.row.id}.zip`}
            target="_blank"
          > */}
            <Button
              variant="contained"
              size="small"
              style={{
                minWidth: 160,
                fontWeight: "bold",
                backgroundColor: "#01796F",
              }}
              tabIndex={params.hasFocus ? 0 : -1}
              onClick={() => downloadInspection(params.row)}
            >
              <FileDownloadIcon /> Inspection Data
            </Button>
          {/* </a> */}
        </strong>
      ),
    },
  ];

  const toggleableColumns = inspectionColumnsMeta.filter(
    (col) => col.headerName && col.headerName.trim() !== ""
  );

  return (
    <React.Fragment>
      <Box
        display="flex"
        justifyContent={"flex-end"}
        marginBottom={1}
        marginTop={1}
      >
        <Button
          style={{ marginRight: "10px" }}
          onClick={handleOpenMenu}
          variant="contained"
          color="primary"
        >
          Hide/Show Columns
        </Button>
        <Button
          onClick={handleClearFilters}
          variant="contained"
          color="primary"
        >
          Clear Filters
        </Button>
      </Box>

      <Menu
        id="column-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        {toggleableColumns.map((column) => (
          <MenuItem key={column.field}>
            <FormControlLabel
              control={
                <Switch
                  checked={columnVisibility[column.field]}
                  onChange={() => handleToggleColumn(column.field)}
                />
              }
              label={column.headerName}
            />
          </MenuItem>
        ))}
      </Menu>

      <DataGrid
        rows={filteredRows}
        columns={inspectionColumnsMeta}
        apiRef={apiRef}
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
              pageSize: 20,
            },
          },
        }}
        onRowSelectionModelChange={rowsSelected}
        pageSizeOptions={[5]}
        checkboxSelection
        disableRowSelectionOnClick
      />
    </React.Fragment>
  );
};

export default BladeHomeTable;
