import "./InspectionLogsPage.css";
import { useEffect, useState, Suspense } from "react";
import {
  Box,
  CircularProgress,
  LinearProgress,
  Button,
  Checkbox,
  Grid,
  Typography,
  Snackbar,
  IconButton,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import Loading from "../../components/Loading";
import React from "react";
import DrawOutlinedIcon from "@mui/icons-material/DrawOutlined";
import WindPowerOutlinedIcon from "@mui/icons-material/WindPowerOutlined";
import GridOnOutlinedIcon from "@mui/icons-material/GridOnOutlined";
import DriveFolderUploadIcon from "@mui/icons-material/DriveFolderUpload";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import CloseIcon from "@mui/icons-material/Close";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import ArticleIcon from "@mui/icons-material/Article";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import NavigateBeforeOutlinedIcon from "@mui/icons-material/NavigateBeforeOutlined";

import { isUserLoggedIn, getCurrentUser } from "../../services/login_api";

import {
  uploadDir,
  uploadAnnotationsDir,
} from "../../services/UploadFunctions";
import LinearProgressWithLabel from "../../components/LinearProgressWithLabel";
import InspectionReportButton from "../../components/InspectionReportButton";
import useFilters from "../../components/Filter/useFilters2";
import { getInspectionLogs } from "../../services/inspection_logs_api";
import { deleteInspection } from "../../services/inspection_api";

function InspectionLogsPage() {

  const [sortModel, setSortModel] = React.useState([
    {
      field: 'date',
      sort: 'desc',
    },
  ]);

  const logsColumnsMeta = [
    { field: "id", headerName: "ID", width: 50, flex: 0.5 },
    {
      field: "inspection_id",
      headerName: "Inspection",
      description: "Id of inspection",
      sortable: true,
      flex: 1,
      renderCell: (params) => (
        <strong>
          <Button
            variant="contained"
            size="small"
            style={{
              fontWeight: "bold",
              backgroundColor: "seagreen",
            }}
            tabIndex={params.hasFocus ? 0 : -1}
            onClick={() => navigate(`/imageinspection/${params.row.inspection_id}`)}
          >
            View
          </Button>
        </strong>
      ),
    },
    {
      field: "date",
      headerName: "Date",
      flex: 0.8,
      editable: false,
      valueGetter: (params) => {
        return new Date(params.row.date).toISOString().split("T")[0];
      },
    },
    {
      field: "sso",
      headerName: "Inspector SSO",
      description: "Inspector SSO",
      sortable: true,
      flex: 0.8,
    },
    {
      field: "input_path",
      headerName: "Input Path",
      flex: 1,
      editable: false,
    },
    {
      field: "operation",
      headerName: "Operation",
      flex: 0.9,
      editable: false,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.9,
      editable: false,
    },
    {
      field: "message",
      headerName: "Message",
      description: "Operation status message",
      sortable: true,
      flex: 3.5,
    },
  ];
  const [logsList, setLogsList] = useState([]);
  const [selectedIdList, setSelectedIdList] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [loggedIn, setLoggedIn] = useState("false");
  const loggedUser = localStorage.getItem("loggedSSO");
  const [showDownloadSnack, setShowDownloadSnack] = useState(false);
  
  const navigate = useNavigate();

  const handleFetchLogsList = async () => {
    const data = await getInspectionLogs();
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
  }, [loggedUser]);

  const rowsSelected = (indexList) => {
    setSelectedIdList(indexList);
  };

  const delSelected = async () => {
    setShowProgressBar(true);
    for (let id of selectedIdList) {
      await deleteInspection(id);
      handleFetchLogsList();
    }
    setShowProgressBar(false);
  };

  const handleCloseSnack = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setShowDownloadSnack(false);
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
          <div>
            <NavigateBeforeOutlinedIcon
              onClick={() => navigate(`/home`)}
              style={{ display: "grid", alignItems: "center", fontSize: 30 }}
            />
            <Typography
              style={{ fontSize: 25, paddingTop: 20, paddingBottom: 20 }}
            >
              Inspection Logs
            </Typography>
          </div>

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
                  columns={logsColumnsMeta}
                  sortModel={sortModel}
                  initialState={{
                    pagination: {
                      paginationModel: {
                        pageSize: 20,
                      },
                    },
                  }
                }
                onRowSelectionModelChange={rowsSelected}
                pageSizeOptions={[5]}
                checkboxSelection
                disableRowSelectionOnClick
                autoHeight
                disableColumnMenu={false}
              />
            </Box>
          </Suspense>
        </div>
      )}
    </div>
  );
}

export default InspectionLogsPage;