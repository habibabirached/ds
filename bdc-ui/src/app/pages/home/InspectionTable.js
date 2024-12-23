import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemText,
  FormControlLabel,
  Switch,
  Collapse,
  FormControl,
  Select,
  InputLabel
} from "@mui/material";
import WindPowerOutlinedIcon from "@mui/icons-material/WindPowerOutlined";
import GridOnOutlinedIcon from "@mui/icons-material/GridOnOutlined";
import ArticleIcon from "@mui/icons-material/Article";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import CustomColumnHeader from "../../components/Filter/CustomColumnHeader";
import InspectionReportButton from "../../components/InspectionReportButton";
import PhotoAlbumReportButton from "../../components/PhotoAlbumReportButton";
import { DataGrid, useGridApiRef } from "@mui/x-data-grid";
import BladeHomePage from "../bladehomeviewcavity/BladeHomePage";

const InspectionTable = ({
  inspectionList,
  rowsSelected,
  uploadProgress,
  applyFilters,
  setShowDownloadSnack,
  navigate,
  filters,
  setFilters,
  clearFilters,
  handleFilterChange,
  handlePriorityChange,
  isAdmin
}) => {
  const filteredRows = applyFilters(inspectionList, filters);
  const apiRef = useGridApiRef();

  const [anchorEl, setAnchorEl] = useState(null);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [expandedRows, setExpandedRows] = useState({}); // State to track expanded rows

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

  const clearFiltersLocal = () => {
    clearFilters();
    setAllColumnVisibilityToVisible();
  };

  const handleToggleExpand = (rowId) => {
    setExpandedRows((prevExpandedRows) => ({
      ...prevExpandedRows,
      [rowId]: !prevExpandedRows[rowId],
    }));
  };
  const sortedRows = filteredRows.sort((a, b) => {
    const priorityOrder = ["High", "Medium", "Low", "None"];
    const priorityA = priorityOrder.indexOf(a.priority || "None");
    const priorityB = priorityOrder.indexOf(b.priority || "None");

    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateA > dateB) return -1;
    if (dateA < dateB) return 1;

    if (priorityA < priorityB) return -1;
    if (priorityA > priorityB) return 1;
    return 0;
  });
  const groupInspectionsColumnsMeta = [
    {
      field: "factory_name",
      headerName: "Factory Name",
      width: 220,
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
      width: 220,
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
      field: "date",
      headerName: "Date",
      width: 220,
      editable: false,
      valueGetter: (params) => {
        return new Date(params.row.date);
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
      headerName: "Blade Serial No.",
      description: "Blade serial number",
      sortable: true,
      width: 220,
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
      width: 220,
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
      field: "priority",
      headerName: "Priority",
      width: 220,
      editable: isAdmin,
      renderCell: (params) => {
        const isAnnotationComplete = params.row.status === "Complete";
        const priorityValue = isAnnotationComplete ? "None" : params.row.priority || "None";

        return (
          <FormControl fullWidth>
            <Select
              value={priorityValue}
              onChange={(e) =>
                handlePriorityChange(params.row.id, e.target.value)
              }
              disabled={!isAdmin || isAnnotationComplete}
            >
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="None">None</MenuItem>
            </Select>
          </FormControl>
        );
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
      field: "open",
      headerName: "",
      width: 180,
      disableColumnMenu: true,
      sortable: false,
      disableColumnSelector: true,
      renderCell: (params) => (
        <strong>
          <Button
            variant="contained"
            size="small"
            style={{
              minWidth: 180,
              backgroundColor: "seagreen",
              fontWeight: "bold",
            }}
            tabIndex={params.hasFocus ? 0 : -1}
            onClick={() => navigate(`/blade?esn=${params.row.esn}`)}
          >
            <WindPowerOutlinedIcon style={{ marginRight: 5 }} />
            View Cavities
          </Button>
        </strong>
      ),
    },
    {
      field: "quality",
      headerName: "",
      width: 200,
      disableColumnMenu: true,
      sortable: false,
      disableColumnSelector: true,
      renderCell: (params) => (
        <strong>
          <Button
            variant="contained"
            size="small"
            style={{
              minWidth: 200,
              fontWeight: "bold",
              backgroundColor: "#808000",
            }}
            tabIndex={params.hasFocus ? 0 : -1}
            onClick={() => navigate(`/bladequality?esn=${params.row.esn}`)}
          >
            <GridOnOutlinedIcon style={{ marginRight: 5 }} />
            Review findings
          </Button>
        </strong>
      ),
    },
    {
      field: "get_esn_images_report",
      headerName: "",
      width: 180,
      disableColumnMenu: true,
      sortable: false,
      disableColumnSelector: true,
      renderCell: (params) => (
        <strong>
          <PhotoAlbumReportButton
            onClick={() => {
              setShowDownloadSnack(true);
            }}
            esn={params.row.esn}
            manufactureStageOptions={params.row.manufacture_stage_list}
          />
        </strong>
      ),
    },
    {
      field: "get_esn_inspection_report",
      headerName: "",
      width: 200,
      disableColumnMenu: true,
      sortable: false,
      disableColumnSelector: true,
      renderCell: (params) => (
        <strong>
          <InspectionReportButton
            onClick={() => {
              setShowDownloadSnack(true);
            }}
            esn={params.row.esn}
            manufactureStageOptions={params.row.manufacture_stage_list}
          />
        </strong>
      ),
    },
    {
      field: "get_esn_certificate",
      headerName: "",
      width: 180,
      disableColumnMenu: true,
      sortable: false,
      disableColumnSelector: true,
      renderCell: (params) => {
        if (params.row.certificate_id != null) {
          return (
            <strong>
              <a
                href={`api/certificate/pdf?esn=${params.row.esn}`}
                download={`${params.row.esn}_certificate.pdf`}
                target="_blank"
              >
                <Button
                  variant="contained"
                  size="small"
                  style={{
                    minWidth: 180,
                    fontWeight: "bold",
                    backgroundColor: "seagreen",
                  }}
                  tabIndex={params.hasFocus ? 0 : -1}
                  onClick={() => {
                    setShowDownloadSnack(true);
                  }}
                >
                  <CardMembershipIcon style={{ marginRight: 5 }} />{" "}
                  {`Certificate`}
                </Button>
              </a>
            </strong>
          );
        } else {
          return <div></div>;
        }
      },
    },
  ];

  const toggleableColumns = groupInspectionsColumnsMeta.filter(
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
        <Button onClick={clearFiltersLocal} variant="contained" color="primary">
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
        // rows={filteredRows}
        rows={sortedRows}
        apiRef={apiRef}
        columns={groupInspectionsColumnsMeta}
        getRowClassName={(params)=>
          params.row.priority === "High" ? "high-priority-row" : ""
        }
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
          // "& .high-priority-row": {
          //   backgroundColor: "lightcoral",
          //   transition: "none",
          // },
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
      />
    </React.Fragment>
  );
};

export default InspectionTable;
