import "./MonitorBlade.css";
// import { useEffect, useState, Suspense } from "react";
import { useEffect, useState, Suspense,useRef } from "react";
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Button,
  Snackbar,
  IconButton,
  Typography,
} from "@mui/material";
import { DataGrid,useGridApiRef } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import React from "react";
import CloseIcon from "@mui/icons-material/Close";
import NavigateBeforeOutlinedIcon from "@mui/icons-material/NavigateBeforeOutlined";
import { isUserLoggedIn, getCurrentUser } from "../../services/login_api";
import LinearProgressWithLabel from "../../components/LinearProgressWithLabel";
import { getBladeMonitoring } from "../../services/blade_monitoring";
 
// Define a basic Loading component
const Loading = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <CircularProgress />
  </Box>
);
 
const extractDate = (dateStr) => {
  const date = Date.parse(dateStr);
  return isNaN(date) ? null : new Date(date);
};
 
function MonitorBladePage() {
  const apiRef = useGridApiRef();
  const handleClearFilters = () => {
    apiRef.current.setFilterModel({ items: [] });
    apiRef.current.setSortModel([]);
  };
  const convertToBytes = (sizeStr) => {
    if (!sizeStr || sizeStr.trim() === '') {
      return 0;
    }
    const size = parseFloat(sizeStr);
    if (isNaN(size)) {
      return 0;
    }
    if (sizeStr.includes('GB')) {
      return size * 1024 * 1024 * 1024;
    } else if (sizeStr.includes('MB')) {
      return size * 1024 * 1024;
    } else if (sizeStr.includes('KB')) {
      return size * 1024;
    } else {
      return size;
    }
  };
 
  const logsColumnsMeta = [
    { field: "blade_number", headerName: "Blade Number", width: 180, headerClassName: 'custom-header' },
    {
      field: "blade_scan_time", headerName: "Scan Time", width: 130,
      valueGetter: (params) => {
        const dateValue=params.value;
        return dateValue? new Date(dateValue).toLocaleString():''
      },
      renderCell: (params) => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'left', justifyContent: 'left', textAlign: 'left', whiteSpace: 'normal', wordBreak: 'break-word', padding: '8px' }}>
          {params.value}
        </Box>
      ),
      sortComparator: (a, b) => {
        const dateA = extractDate(a);
        const dateB = extractDate(b);
        if (dateA && dateB) return dateA - dateB;
        if (dateA) return -1;
        if (dateB) return 1;
        return 0;
      },
    },
    {
      field: "upload_date", headerName: "Upload Start Time", width: 130,
      valueGetter: (params) => {
        const dateValue=params.value;
        return dateValue? new Date(dateValue).toLocaleString():params.value
      },
      renderCell: (params) => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'left', justifyContent: 'left', textAlign: 'left', whiteSpace: 'normal', wordBreak: 'break-word', padding: '8px' }}>
          {params.value}
        </Box>
      ),
      sortComparator: (a, b) => {
        const dateA = extractDate(a);
        const dateB = extractDate(b);
        if (dateA && dateB) return dateA - dateB;
        if (dateA) return -1;
        if (dateB) return 1;
        return 0;
      },
    },
    {
      field: "upload_end_date", headerName: "Upload End Time", width: 130,
      valueGetter: (params) => {
        const dateValue=params.value;
        return dateValue? new Date(dateValue).toLocaleString():''
      },
      renderCell: (params) => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'left', justifyContent: 'left', textAlign: 'left', whiteSpace: 'normal', wordBreak: 'break-word', padding: '8px' }}>
          {params.value}
        </Box>
      ),
      sortComparator: (a, b) => {
        const dateA = extractDate(a);
        const dateB = extractDate(b);
        if (dateA && dateB) return dateA - dateB;
        if (dateA) return -1;
        if (dateB) return 1;
        return 0;
      },
    },
    { field: "upload_status", headerName: "Upload Status", width: 90 },
    { field: "upload_time_taken", headerName: "Upload Time (hrs)", width: 90 },
    {
      field: "file_size", headerName: "File Size", width: 80,
      sortComparator: (a, b) => convertToBytes(a) - convertToBytes(b)
    },
    {
      field: "s3_cvpl_input", headerName: "AI Processing - CVPL Input", width: 130,
      valueGetter: (params) => {
        const formattedDate = params.value ? new Date(params.value).toLocaleString() : "Blade Data Missing";
        return formattedDate;
      },
      renderCell: (params) => {
        const hasData = params.value !== "Blade Data Missing";
        return (
          <Box sx={{ backgroundColor: hasData ? 'lightgreen' : 'lightcoral', width: '100%', height: '100%', display: 'flex', alignItems: 'left', justifyContent: 'left', textAlign: 'left', whiteSpace: 'normal', wordBreak: 'break-word', padding: '8px' }}>
            {params.value}
          </Box>
        );
      },
      sortComparator: (a, b) => {
        const dateA = extractDate(a);
        const dateB = extractDate(b);
        if (dateA && dateB) return dateA - dateB;
        if (dateA) return -1;
        if (dateB) return 1;
        return 0;
      },
    },
    {
      field: "s3_cvpl_output", headerName: "AI Processing - CVPL Output", width: 130,
      valueGetter: (params) => {
        const formattedDate = params.value ? new Date(params.value).toLocaleString() : "Blade Data Missing";
        return formattedDate;
      },
      renderCell: (params) => {
        const hasData = params.value !== "Blade Data Missing";
        return (
          <Box sx={{ backgroundColor: hasData ? 'lightgreen' : 'lightcoral', width: '100%', height: '100%', display: 'flex', alignItems: 'left', justifyContent: 'left', textAlign: 'left', whiteSpace: 'normal', wordBreak: 'break-word', padding: '8px' }}>
            {params.value}
          </Box>
        );
      },
      sortComparator: (a, b) => {
        const dateA = extractDate(a);
        const dateB = extractDate(b);
        if (dateA && dateB) return dateA - dateB;
        if (dateA) return -1;
        if (dateB) return 1;
        return 0;
      },
    },
    {
      field: "application_ui", headerName: "App UI", width: 130,
      valueGetter: (params) => {
        const dateValue=params.value;
        return dateValue? new Date(dateValue).toLocaleString():''
      },
      renderCell: (params) => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'left', justifyContent: 'left', textAlign: 'left', whiteSpace: 'normal', wordBreak: 'break-word', padding: '8px' }}>
          {params.value}
        </Box>
      ),
      sortComparator: (a, b) => {
        const dateA = extractDate(a);
        const dateB = extractDate(b);
        if (dateA && dateB) return dateA - dateB;
        if (dateA) return -1;
        if (dateB) return 1;
        return 0;
      },
    },
    {
      field: "annot_start_time", headerName: "Annotation Start", width: 130,
      valueGetter: (params) => {
       const dateValue=params.value;
        return dateValue? new Date(dateValue).toLocaleString():''
      },
      renderCell: (params) => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'left', justifyContent: 'left', textAlign: 'left', whiteSpace: 'normal', wordBreak: 'break-word', padding: '8px' }}>
          {params.value}
        </Box>
      ),
      sortComparator: (a, b) => {
        const dateA = extractDate(a);
        const dateB = extractDate(b);
        if (dateA && dateB) return dateA - dateB;
        if (dateA) return -1;
        if (dateB) return 1;
        return 0;
      },
    },
    {
      field: "annot_end_time", headerName: "Annotation End", width: 130,
      valueGetter: (params) => {
        const dateValue=params.value;
        return dateValue? new Date(dateValue).toLocaleString():''
      },
      renderCell: (params) => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'left', justifyContent: 'left', textAlign: 'left', whiteSpace: 'normal', wordBreak: 'break-word', padding: '8px' }}>
          {params.value}
        </Box>
      ),
      sortComparator: (a, b) => {
        const dateA = extractDate(a);
        const dateB = extractDate(b);
        if (dateA && dateB) return dateA - dateB;
        if (dateA) return -1;
        if (dateB) return 1;
        return 0;
      },
    },
    { field: "annot_time_taken", headerName: "Annotation Time (hrs)", width: 90 },
    {
      field: "cert_issued", headerName: "Certificate Issued", width: 130,
      valueGetter: (params) => {
        const dateValue=params.value;
        return dateValue? new Date(dateValue).toLocaleString():''
      },
      renderCell: (params) => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'left', justifyContent: 'left', textAlign: 'left', whiteSpace: 'normal', wordBreak: 'break-word', padding: '8px' }}>
          {params.value}
        </Box>
      ),
      sortComparator: (a, b) => {
        const dateA = extractDate(a);
        const dateB = extractDate(b);
        if (dateA && dateB) return dateA - dateB;
        if (dateA) return -1;
        if (dateB) return 1;
        return 0;
      },
    },
    { field: "total_time_taken", headerName: "Total Time (hrs)", width: 90 },
  ];
 
  const [logsList, setLogsList] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [loggedIn, setLoggedIn] = useState("false");
  // const [sortModel, setSortModel] = useState([]);
  // const [filterModel, setFilterModel] = useState({ items: [] });
  const [sortModel, setSortModel] = useState(JSON.parse(localStorage.getItem("bladeSortModel")) || [{ field: 'upload_date', sort: 'desc' }]);
  const [filterModel, setFilterModel] = useState(JSON.parse(localStorage.getItem("bladeFilterModel")) || { items: [{ field: 'upload_date', operator: 'isNotEmpty' }] });
  const initialSortModelSet = useRef(false);
  const initialFilterModelSet = useRef(false);
  const [showDownloadSnack, setShowDownloadSnack] = useState(false);
  const navigate = useNavigate();
 
  const handleFetchLogsList = async () => {
    const data = await getBladeMonitoring();
    if (data != null) {
      setLogsList(data);
    }
  };
 
  useEffect(() => {
    const res = isUserLoggedIn(getCurrentUser());
    if (res) {
      setLoggedIn("true");
    } else {
      setLoggedIn("false");
      navigate(`/`);
    }
    handleFetchLogsList();
 
    // Load saved filter and sort models from local storage
    // const savedSortModel = JSON.parse(localStorage.getItem("bladeSortModel"));
    // const savedFilterModel = JSON.parse(localStorage.getItem("bladeFilterModel"));
    // if (savedSortModel) setSortModel(savedSortModel);
    // if (savedFilterModel) setFilterModel(savedFilterModel);
    if (!initialSortModelSet.current) {
      const savedSortModel = JSON.parse(localStorage.getItem("bladeSortModel"));
      if (savedSortModel) {
        setSortModel(savedSortModel);
      } else {
        localStorage.setItem("bladeSortModel", JSON.stringify(sortModel));
      }
      initialSortModelSet.current = true;
    }

    if (!initialFilterModelSet.current) {
      const savedFilterModel = JSON.parse(localStorage.getItem("bladeFilterModel"));
      if (savedFilterModel) {
        setFilterModel(savedFilterModel);
      } else {
        localStorage.setItem("bladeFilterModel", JSON.stringify(filterModel));
      }
      initialFilterModelSet.current = true;
    }
  }, [navigate]);
 
  const handleSortModelChange = (newSortModel) => {
    setSortModel(newSortModel);
    localStorage.setItem("bladeSortModel", JSON.stringify(newSortModel)); // Save sort model
  };
 
  const handleFilterModelChange = (newFilterModel) => {
    setFilterModel(newFilterModel);
    localStorage.setItem("bladeFilterModel", JSON.stringify(newFilterModel)); // Save filter model
  };
 
  const handleCloseSnack = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setShowDownloadSnack(false);
  };

  const handleDownloadExcel = () => {
    const excludedFields = ['s3_bucket', 'sage_end_time', 'sage_start_time', 'sage_time_taken'];

    const columns = logsColumnsMeta
        .filter(({ field }) => !excludedFields.includes(field))
        .map(({ headerName: header, field: key }) => ({ header, key }));

    const filteredData = logsList.map(log =>
        columns.reduce((acc, col) => {
            acc[col.key] = log[col.key];
            return acc;
        }, {})
    );

    const sortedData = filteredData.sort((a, b) => b.id - a.id);

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sortedData);

    const visibleHeaders = columns.map(col => col.header);
    XLSX.utils.sheet_add_aoa(worksheet, [visibleHeaders], { origin: 'A1' });

    XLSX.utils.book_append_sheet(workbook, worksheet, "Monitoring_Dashboard_Data");

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const date = new Date().toISOString().split('T')[0];
    const fileName = `Monitoring_Dashboard_export_${date}.xlsx`;
    saveAs(data, fileName);
    setShowDownloadSnack(true);
  };
 
  const downloadSnackLayout = (
    <React.Fragment>
      <Button color="secondary" size="small" onClick={handleCloseSnack}>
        Close
      </Button>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleCloseSnack}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </React.Fragment>
  );
 
  return (
    <div
      className="HomePage"
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      {loggedIn === "true" && (
        <div style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
          {/* <div>
            <NavigateBeforeOutlinedIcon
              onClick={() =>{
                localStorage.removeItem("bladeSortModel");
                localStorage.removeItem("bladeFilterModel");
                navigate(`/home`)
              }}
              style={{ display: "grid", alignItems: "center", fontSize: 30 }}
            />
            <Typography
              style={{ fontSize: 25, paddingTop: 20, paddingBottom: 20 }}
            >
              Monitor Blades
            </Typography>
          </div> */}
          <div>
                <NavigateBeforeOutlinedIcon
                  onClick={() => {
                  localStorage.removeItem("bladeSortModel");
                  localStorage.removeItem("bladeFilterModel");
                  navigate(`/home`);
                                }}
                  style={{ fontSize: 30 }}
                />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <Typography style={{ fontSize: 25, marginBottom: "10px" }}>
                  Monitor Blades
                </Typography>
                <div style={{ display: "flex", gap: "10px", marginBottom: "10px", marginLeft: "auto" }}>
                  <Button onClick={handleClearFilters} sx={{ width: "200px" }} variant="contained" color="primary">
                    Clear Filters
                  </Button>
                  <Button onClick={handleDownloadExcel} sx={{ width: "200px" }} variant="contained" color="primary">
                    Download Data
                  </Button>
                </div>
              </div>
              </div>
          <div style={{ marginLeft: 'auto' }}></div>
 
          <Suspense fallback={<Loading />}>
            <Box sx={{ width: "100%" }}>
              {uploadProgress > 0 && (
                <LinearProgressWithLabel value={uploadProgress} />
              )}
            </Box>
            <Box sx={{ width: "100%" }}>
              {showProgressBar && <LinearProgress />}
            </Box>
            <Box sx={{ height: 800, width: "100%" }}>
              <DataGrid
                rows={logsList}
                apiRef={apiRef}
                columns={logsColumnsMeta}
                sx={{
                  '& .custom-header': {
                    backgroundColor: 'lightblue',
                  },
                    '& .MuiDataGrid-columnHeaderTitle': {
                      whiteSpace: 'normal',
                      lineHeight: 1.2,
                    },
                    '& .MuiDataGrid-columnHeader:hover .MuiDataGrid-columnHeaderTitle': {
                      whiteSpace: 'normal',
                      lineHeight: 0.85,
                    },
                  
                }}
                sortModel={sortModel}
                onSortModelChange={handleSortModelChange}
                filterModel={filterModel}
                onFilterModelChange={handleFilterModelChange}
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 20,
                    },
                  },
                }}
                pageSizeOptions={[5]}
                disableRowSelectionOnClick
                autoHeight
                disableColumnMenu={false}
              />
            </Box>
          </Suspense>
        </div>
      )}
 
      <Snackbar
        open={showDownloadSnack}
        autoHideDuration={3000}
        onClose={handleCloseSnack}
        message="Download started"
        action={downloadSnackLayout}
      />
    </div>
  );
}
 
export default MonitorBladePage;
