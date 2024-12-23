import "./HomePage.css";
import { BASE_URL } from "../../services/api_config";
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
import InspectionTable from "./InspectionTable";
import NavigateBeforeOutlinedIcon from "@mui/icons-material/NavigateBeforeOutlined";
import {
  isUserLoggedIn,
  getCurrentUser,
  logInUser,
} from "../../services/login_api";
import MenuIcon from "@mui/icons-material/Menu"; // Import MenuIcon for the sidebar toggle

import {
  uploadDir,
  uploadAnnotationsDir,
} from "../../services/UploadFunctions";
import LinearProgressWithLabel from "../../components/LinearProgressWithLabel";
import InspectionReportButton from "../../components/InspectionReportButton";
import useFilters from "../../components/Filter/useFilters2";
import ChecklistIcon from "@mui/icons-material/Checklist";
import {
  createInspectionLogEntry,
  getInspectionLogBodyObj,
} from "../../services/inspection_logs_api";
import {
  downloadInspectionStatsCsvAsync,
  updateInspection,
  deleteInspection,
  getInspectionList,
  downloadDefectStatsCsvAsync,
} from "../../services/inspection_api";
function Blades({uploadProgress}){
    const inspectionColumnsMeta = [
        { field: "id", headerName: "ID", width: 50 },
        {
          field: "date",
          headerName: "Date",
          width: 100,
          editable: false,
          valueGetter: (params) => {
            return new Date(params.row.date).toISOString().split("T")[0];
          },
        },
        {
          field: "factory_name",
          headerName: "Factory Name",
          width: 50,
          editable: false,
        },
        {
          field: "location",
          headerName: "Factory Location",
          width: 200,
          editable: false,
        },
        {
          field: "sect",
          headerName: "Blade Cavity",
          width: 120,
          editable: false,
        },
        {
          field: "esn",
          headerName: "Blade Serial No.",
          description: "Blade serial number",
          sortable: true,
          width: 150,
        },
        {
          field: "modality",
          valueGetter: () => {
            return "Blade Crawler";
          },
          headerName: "Inspection Modality",
          description: "Modality of inspection",
          sortable: true,
          width: 200,
        },
        {
          field: "sso",
          headerName: "Inspector SSO",
          description: "Inspector SSO",
          sortable: true,
          width: 120,
        },
        {
          field: "status",
          headerName: "Annotation",
          description: "Annotation Status",
          sortable: true,
          width: 120,
        },
        {
          field: "view",
          headerName: "",
          width: 160,
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
                onClick={() => navigate(`/imageview/${params.row.id}`)}
              >
                <ViewInArOutlinedIcon />
                Virtual Tour
              </Button>
            </strong>
          ),
        },
        {
          field: "edit",
          headerName: "",
          width: 160,
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
                <DrawOutlinedIcon />
                Indicators
              </Button>
            </strong>
          ),
        },
        {
          field: "get_inspection_report",
          headerName: "",
          width: 250,
          renderCell: (params) => (
            <strong>
              <InspectionReportButton
                onClick={() => {
                  console.log("downloading...");
                }}
                esn={params.row.esn}
                manufactureStageOptions={params.row.manufacture_stage_list || []}
              />
            </strong>
          ),
        },
      ];
  
  const [inspectionList, setInspectionList] = useState([]);
  const [groupedInspectionList, setGroupedInspectionList] = useState([]);
  const [selectedIdList, setSelectedIdList] = useState([]);
  
  // this one is set in home page by the uploadDir() function. it cannot be here
  //const [uploadProgress, setUploadProgress] = useState(0);
  
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [loggedIn, setLoggedIn] = useState("false");
  const loggedUser = localStorage.getItem("loggedSSO");
  const [showDownloadSnack, setShowDownloadSnack] = useState(false);
  const [showInspectionList, setShowInspectionList] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // New state for admin check
  const handleShowInspectionListChange = (event) => {
    setShowInspectionList(!showInspectionList);
    if(!showInspectionList){
        selectedIdList.length=0;
    }
  };

  const fetchInspectionList = async () => {
    try {
      const data = await getInspectionList();
      return data;
    } catch (error) {
      console.error(error);
    }
  };

  const initialFilters = {
    factory_name: { value: "", type: "contains" },
    location: { value: "", type: "contains" },
    date: { value: "", type: "contains" },
    esn: { value: "", type: "contains" },
    status: { value: "", type: "contains" },
    priority: { value: "", type: "contains" },
  };

  const [filters, handleFilterChange, clearFilters, setFilters, applyFilters] =
    useFilters(initialFilters, "inspectionNewFilters");

  const navigate = useNavigate();

  const handleFetchInspectionList = async () => {
    const data = await getInspectionList();
    if (data != null) {
      console.log("dataaaa  = ", data);
      setInspectionList(data);
      const groupedData = groupDataByEsn(data);
      console.log("groupedData:", groupedData);
      setGroupedInspectionList(groupedData);
    }
  };

  const userIsAdmin = async () => {
    // For localhost development and for the GRC host that does not have sso authentication, we use admin mode.
    const currentURL = window.location.href;
    console.log("currentURL:", currentURL);
    if (currentURL.includes("localhost") || currentURL.includes("crd.ge.com")) {
      console.log('Entering dev mode');
      setIsAdmin(true);
      return;
    }

    const inputSSO = getCurrentUser();
    const data = await fetch(`${BASE_URL}/usergroup/${inputSSO}`);
    const res = await data.json();
    console.log("user group is ", res);
    if (res === "ADM") {
      setIsAdmin(true);
      console.log("user group is inside ");
    }
  };

  useEffect(() => {
    console.log("userEffect check ");
    const res = isUserLoggedIn(getCurrentUser());
    console.log("userEffect check ", res);
    if (res) {
      setLoggedIn("true");
      if (loggedUser === "admin") {
        setIsAdmin(true);
      }
    } else {
      setLoggedIn("false");
      navigate(`/`);
    }

    const fetchData = async () => {
      await userIsAdmin();
      await handleFetchInspectionList();
    };
    
    fetchData();


    
  }, [loggedUser]);

  const handlePriorityChange = async (id, priority) => {
    const body = { priority: priority };
    const response = await updateInspection(id, body);
    console.log("------> updatedItem response ", response.priority);

    setGroupedInspectionList((prevList) =>
      prevList.map((item) => {
        if (item.id === id) {
          console.log(
            `Updating item with ID ${item.id} to priority ${response.priority}`
          );
          console.log("item=====>", item);
          const updatedItem = { ...item, priority: response.priority };
          console.log("updated item ----> ", updatedItem);
          return updatedItem;
        }
        return item;
      })
    );
    console.log("GroupedInspectionList  ", groupedInspectionList);
  };

  const groupDataByEsn = (inspectionList) => {
    let ensInspectionMap = new Map();
    for (let inspection of inspectionList) {
      if (inspection.priority === null) {
        console.log("got null value---------------", inspection.id);
        inspection.priority = "None";
      }
      let esn = inspection.esn.toString();
      if (esn != null) {
        if (!ensInspectionMap.has(esn)) {
          inspection["manufacture_stage_list"] = [];
          if (
            inspection.manufacture_stage != null &&
            inspection.manufacture_stage != ""
          ) {
            inspection["manufacture_stage_list"].push(
              inspection.manufacture_stage
            );
          }
          ensInspectionMap.set(esn, {
            ...inspection,
            inspections: [inspection],
          });
        } else {
          let insp = ensInspectionMap.get(esn);
          insp.inspections.push(inspection);
          if (
            inspection.manufacture_stage != null &&
            inspection.manufacture_stage.trim() !== "" &&
            !insp.manufacture_stage_list.includes(inspection.manufacture_stage)
          ) {
            insp.manufacture_stage_list.push(inspection.manufacture_stage);
          }
        }
      }
    }
   
    let resp = [];
    for (let [esn, data] of ensInspectionMap.entries()) {
      let allComplete = data.inspections.every((insp) => insp.status === "Complete");
      let allIncomplete = data.inspections.every((insp) => insp.status === "Incomplete");
      let allPartial= data.inspections.every((insp) => insp.status === "Partial");
      let hasIncomplete = data.inspections.some((insp) => insp.status === "Incomplete");
      let hasComplete = data.inspections.some((insp) => insp.status === "Complete");
      let hasPartial = data.inspections.some((insp) => insp.status === "Partial");
      if (allComplete) {
        data.status = "Complete";
      } else if (allIncomplete) {
        data.status = "Incomplete";
      } else if (allPartial) {
        data.status = "Partial";
      } else if (hasPartial && hasComplete && !hasIncomplete) {
        data.status = "Partial";
      }
      else {
        data.status = "Incomplete";
      }
   
      resp.push(data);
    }
   
    return resp;
  };
  const rowsSelected = (indexList) => {
    setSelectedIdList(indexList);
  };

  const delSelected = async () => {
    setShowProgressBar(true);
    for (let id of selectedIdList) {
      let delResp = await deleteInspection(id);

      let logBody = getInspectionLogBodyObj(
        id,
        null,
        `Deleted inspection id# ${id}`,
        "DELETE",
        "SUCCESS",
        loggedUser
      );
      let createLogResp = await createInspectionLogEntry(logBody);

      handleFetchInspectionList();
    }
    setShowProgressBar(false);
  };

  const handleCloseSnack = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setShowDownloadSnack(false);
  };
   const currentURL = window.location.href;

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
    <>
    {currentURL.includes('/bladeslist') &&(
        <NavigateBeforeOutlinedIcon
        onClick={() => navigate("/home")}
        style={{ display: "grid", alignItems: "center", fontSize: 30 }}
      />
    )
    }
    
    {loggedIn === "true" && (
          <div
            style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
          >
            <div>
              {!showInspectionList && (
                <Typography
                  style={{ fontSize: 25, paddingTop: 20, paddingBottom: 20 }}
                >
                  Blades List
                </Typography>
              )}
              {showInspectionList && (
                <Typography
                  style={{ fontSize: 25, paddingTop: 20, paddingBottom: 20 }}
                >
                  Inspections List
                </Typography>
              )}
            </div>

            <Grid container style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Checkbox
                  sx={{ marginTop: 0 }}
                  checked={showInspectionList}
                  onChange={handleShowInspectionListChange}
                  inputProps={{ "aria-label": "controlled" }}
                />
                <Typography>Show Inspections</Typography>
              </div>

              {isAdmin && (
                <div style={{ marginLeft: "auto" }}>
                  {showInspectionList && selectedIdList.length > 0 && (
                    <Button
                      style={{
                        backgroundColor: "red",
                        color: "white",
                        width: "198px",
                        marginBottom: "4px",
                        marginRight: 5,
                      }}
                      disabled={selectedIdList.length === 0}
                      onClick={delSelected}
                    >
                      <DeleteForeverIcon /> Delete Selected
                    </Button>
                  )}
                </div>
              )}
            </Grid>

            <Snackbar
              open={showDownloadSnack}
              autoHideDuration={6000}
              onClose={handleCloseSnack}
              message="Generating report... The file download will start momentarily."
              action={downloadSnackLayout}
            />

            {!showInspectionList && (
              <Suspense fallback={<Loading />}>
                <Box sx={{ width: "100%" }}>
                  {uploadProgress > 0 && (
                    <LinearProgressWithLabel value={uploadProgress} />
                  )}
                </Box>
                {/* <div style={{'display':'flex','overflow':'hidden'}}> */}
                <Box sx={{ flexGrow: 1, marginBottom: 10, width: "100%" }}>
                  <InspectionTable
                    inspectionList={groupedInspectionList}
                    applyFilters={applyFilters}
                    rowsSelected={rowsSelected}
                    uploadProgress={uploadProgress}
                    setShowDownloadSnack={setShowDownloadSnack}
                    navigate={navigate}
                    filters={filters}
                    setFilters={setFilters}
                    clearFilters={clearFilters}
                    handleFilterChange={handleFilterChange}
                    handlePriorityChange={handlePriorityChange}
                    isAdmin={isAdmin}
                  />
                </Box>
                {/* </div> */}
              </Suspense>
            )}

            {showInspectionList && (
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
                    rows={inspectionList}
                    columns={inspectionColumnsMeta}
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
                </Box>
              </Suspense>
            )}
          </div>
        )}
    </>
  )

}
export default Blades;