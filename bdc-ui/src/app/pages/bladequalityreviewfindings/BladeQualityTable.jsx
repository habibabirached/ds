import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Menu,
  MenuItem,
  FormControlLabel,
  FormControl,
  InputLabel,
  Switch,
  TextField,
  Typography,
  Select,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import CustomColumnHeader from "../../components/Filter/CustomColumnHeader";
import { DataGrid } from "@mui/x-data-grid";
import { getMeasurementLocation } from "../../utils/utils";

const getCavityName = getMeasurementLocation;

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

const BladeQualityTable = ({
  applyFilters,
  defectList,
  defectTypeList,
  bladeCavityOptions,
  defectDispositionOptions,
  statusOptions,
  apiRef,
  handleProcessRowUpdate,
  handleProcessRowUpdateError,
  rowsSelected,
  defectSeverityTable,
  filters,
  handleFilterChange,
  setFilters,
  initialFilters,
}) => {
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const [columnVisibility, setColumnVisibility] = useState({});

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

  const initializeColumnVisibility = () => {
    const visibilityState = apiRef.current
      .getAllColumns()
      .reduce((acc, col) => {
        acc[col.field] = !col.hide;
        return acc;
      }, {});
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

  const getProbabilityOfFailure = (defect_type) => {
    let prob = defectSeverityTable[defect_type];
    if (prob == null) prob = "N/A";
    return prob;
  };

  const filteredRows = applyFilters(defectList, filters);
  const defectColumnsMeta = [
    {
      field: "open",
      headerName: "",
      width: 80,
      disableColumnMenu: true,
      sortable: false,
      disableColumnSelector: true,
      renderCell: (params) => (
        <strong>
          <Button
            variant="contained"
            size="small"
            style={{ fontWeight: "bold", backgroundColor: "seagreen" }}
            tabIndex={params.hasFocus ? 0 : -1}
            onClick={() => {
              console.log(`filters: ${filters}`);
              let encodedFilters = btoa(JSON.stringify(filters));
              navigate(`/defect/${params.row.id}?filters=${encodedFilters}`);
            }}
          >
            Open
          </Button>
        </strong>
      ),
      renderHeader: () => null,
    },
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
          textFieldStyles={textFieldStyles}
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
      field: "finding_type",
      headerName: "Defect Type",
      width: 200,
      editable: true,
      type: "singleSelect",
      valueOptions: defectTypeList,
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
      field: "location",
      headerName: "Blade Cavity",
      width: 200,
      editable: false,
      valueOptions: bladeCavityOptions,
      valueGetter: (params) => {
        return getCavityName(params.row.location);
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
      field: "failure_prob",
      headerName: "Severity",
      width: 200,
      editable: false,
      valueGetter: (params) => {
        return getProbabilityOfFailure(params.row.finding_type);
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
      field: "manufacture_stage",
      headerName: "Manufacturing Stage",
      width: 200,
      editable: false,
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
      field: "area",
      headerName: "Area (mm²)",
      type: "number",
      editable: false,
      width: 150,
      valueGetter: (params) => {
        let area = params.row.area;
        //if (area == 0) return 'N/A';
        area = area * 1000 * 1000; // convert into mm2
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
        width = width * 1000; // convert to mm
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
        return length * 1000; // convert to mm
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
      field: "ge_disposition",
      headerName: "Disposition",
      editable: true,
      type: "singleSelect",
      valueOptions: defectDispositionOptions,
      width: 200,
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
      field: "status",
      headerName: "Status",
      width: 200,
      editable: false,
      type: "singleSelect",
      valueOptions: statusOptions,
      valueGetter: (params) => {
        let status = params.row.status;
        if (status == null || status === "") status = "Open";
        return status;
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
      field: "repair_date",
      headerName: "Repair Date",
      // type: "date",
      width: 200,
      editable: true,
      valueGetter: (params) => {
        let repair_date = params.row.repair_date;

        if (repair_date != null) {
          console.log("refz_date = ", repair_date);
          return new Date(repair_date);
        } else return null;
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
      field: "repair_report_id",
      headerName: "Repair Report Id",
      width: 200,
      editable: true,
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
      field: "repair_approved_by",
      headerName: "Repair Approved By",
      width: 200,
      editable: true,
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

  const toggleableColumns = defectColumnsMeta.filter(
    (col) => col.headerName && col.headerName.trim() !== ""
  );

  return (
    <React.Fragment>
      <Box
        display="flex"
        justifyContent="flex-end"
        marginBottom={1}
        marginTop={1}
      >
        <Button
          onClick={handleClearFilters}
          variant="contained"
          color="primary"
          style={{ marginRight: "10px" }}
        >
          Clear Filters
        </Button>
        <Button onClick={handleOpenMenu} variant="contained" color="primary">
          Hide/Show Columns
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
        apiRef={apiRef}
        // editMode="row"
        rows={filteredRows}
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
              pageSize: 20,
            },
          },
        }}
        onRowSelectionModelChange={rowsSelected}
        pageSizeOptions={[5]}
        processRowUpdate={handleProcessRowUpdate}
        onProcessRowUpdateError={handleProcessRowUpdateError}
      />
    </React.Fragment>
  );
};

export default BladeQualityTable;
