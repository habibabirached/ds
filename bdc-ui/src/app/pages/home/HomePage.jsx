import "./HomePage.css";
import { BASE_URL } from "../../services/api_config";
import { useEffect, useState, Suspense } from "react";
import dbc from './dbcBlades.png';
import Blades from "./Blades";
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadIcon from '@mui/icons-material/Upload';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DownloadForOfflineIcon from '@mui/icons-material/DownloadForOffline';
import DisplaySettingsIcon from '@mui/icons-material/DisplaySettings';
import TuneIcon from '@mui/icons-material/Tune';
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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
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
  downloadInspectionListCsvAsync,
} from "../../services/inspection_api";

import { BorderBottom, Height } from "@mui/icons-material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import SsidChartIcon from '@mui/icons-material/SsidChart';

function HomePage() {


  const [inspectionList, setInspectionList] = useState([]);
  const [groupedInspectionList, setGroupedInspectionList] = useState([]);
  const [selectedIdList, setSelectedIdList] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [loggedIn, setLoggedIn] = useState("false");
  const loggedUser = localStorage.getItem("loggedSSO");
  const [showDownloadSnack, setShowDownloadSnack] = useState(false);
  const [showInspectionList, setShowInspectionList] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(true); // State for sidebar toggle
  const [uploadOpen, setUploadOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [monitorOpen, setMonitorOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // New state for admin check
  const [bladesIsOpen,setBladesIsOpen]=useState(false);
  
  const [showStatisticsSpinner, setShowStatisticsSpinner] = useState(false);
  const [showInspectionListSpinner, setShowInspectionListSpinner] = useState(false);
  
  const handleShowInspectionListChange = (event) => {
    setShowInspectionList(event.target.checked);
  };

  const fetchInspectionList = async () => {
    try {
      const data = await getInspectionList();
      return data;
    } catch (error) {
      console.error(error);
    }
  };


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
    console.log('userIdAdmin()');
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
    }

    fetchData();
  
  }, [loggedUser]);

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
   
      if (allComplete) {
        data.status = "Complete";
      } else if (allIncomplete) {
        data.status = "Incomplete";
      } else if (allPartial) {
        data.status = "Partial";
      }
       else {
        data.status = "Incomplete";
      }
   
      resp.push(data);
    }
   
    return resp;
  };
  


  return (
    <div
      className="HomePage"
      style={{ height: "100%", display: "flex", flexDirection: "row" }}
    >
       {!bladesIsOpen && (
          openSidebar ?
          <img src={dbc} style={{
            width: 'calc(100% - 262px)', 
            height: 'calc(100% - 135px)', 
            margin:'68px 255px',
            objectFit: 'cover', 
            position: 'absolute', 
            top: '0', 
            left: '0', 
            transition: 'margin 0.3s, width 0.3s'
          }} />

          :<img src={dbc} style={{width: '99.15vw', height: 'calc(100vh - 139.4px)', marginTop: '70px', marginLeft: '4px', objectFit: 'cover', position: 'absolute', top: '0', left: '0'}} />


          )}
      {/* Sidebar */}
      <div
        className={`sidebar ${openSidebar ? "open" : "closed"}`}
        style={{
          width: openSidebar ? "250px" : "0",
          transition: "width 0.3s",
          position: "fixed",
          top: "64px",
          bottom: "64px",
          // top:0,
          left: 0,
          height: "calc(100% - 128px)",
          // height: '100%',
          backgroundColor: "darkslategray",
          color: "white",
          overflowX: "hidden",
          zIndex: 1000, // Ensure the sidebar is on top of other content
        }}
      >
        <Button
          style={{
            marginLeft: "auto",
            color: "white",
            fontSize: "24px",
            marginTop: "40px",
          }}
          onClick={() => setOpenSidebar(false)}
        ></Button>

        {isAdmin ? (
          <>
          <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    {!bladesIsOpen? <HomeIcon style={{marginLeft:'35px',marginTop:'2px'}}/>:<ArrowBackIcon style={{marginLeft:'35px',marginTop:'5px'}}/>}
                    <Button
                      style={{
                        color: "white",
                        padding: "5px",
                        marginTop:'3.5px',
                        marginLeft:'-7.5px',
                        textTransform: "none",
                      }}
                      onClick={() =>
                      setBladesIsOpen(!bladesIsOpen)
                      }
                    >
                      {!bladesIsOpen? 'Home': 'Back'}
                    </Button>
                  </div>
            <div className="toggle-section">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <UploadIcon style={{marginLeft:'35px',marginTop:'2px'}}/>
                <Button
                  style={{
                    color: "white",
                    padding: "5px",
                    textTransform: "none",
                    fontWeight: 'bold',
                    marginLeft:'-3.5px',
                    marginTop:'3px'
                  }}
                  //  onClick={() => setUploadOpen(!uploadOpen)}
                  disabled={true}
                >
                  Upload
                </Button>
                {!uploadOpen ? (
                  <ExpandMoreIcon
                    style={{ marginLeft: "82.5px",marginTop:'4px' }}
                    onClick={() => setUploadOpen(true)}
                  />
                ) : (
                  <ExpandLessIcon
                    style={{ marginLeft: "82.5px",marginTop:'4px' }}
                    onClick={() => setUploadOpen(false)}
                  />
                )}
              </div>
              {/* <button onClick={() => setUploadOpen(!uploadOpen)}>Upload</button> */}
              {uploadOpen && (
                <>
                <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <DriveFolderUploadIcon style={{ marginLeft: "43px" }} />
                    <Button
                      style={{
                        color: "white",
                        padding: "5px",
                        margin: "0.5px",
                        textTransform: "none",
                        fontWeight: 400,
                      }}
                      onClick={ ()=> navigate('/folderUpload')
                      }
                    >
                      Upload Videos
                    </Button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <DriveFolderUploadIcon style={{ marginLeft: "43px" }} />
                    <Button
                      style={{
                        color: "white",
                        padding: "5px",
                        margin: "0.5px",
                        textTransform: "none",
                        fontWeight: 400,
                      }}
                      onClick={() =>
                        uploadDir(
                          setUploadProgress,
                          setInspectionList,
                          inspectionList,
                          setGroupedInspectionList,
                          groupDataByEsn,
                          loggedUser
                        )
                      }
                    >
                      Upload Inspection
                    </Button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <UploadFileIcon style={{ marginLeft: "42px" }} />
                    <Button
                      style={{
                        color: "white",
                        padding: "5px",
                        margin: "0.5px",
                        textTransform: "none",
                        fontWeight: 400,
                      }}
                      onClick={() =>
                        uploadAnnotationsDir(
                          setUploadProgress,
                          fetchInspectionList
                        )
                      }
                    >
                      Upload Annotations
                    </Button>
                  </div>
                  {/* <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <UploadFileIcon style={{ marginLeft: "42px" }} />
                    <Button
                      style={{
                        color: "white",
                        padding: "5px",
                        margin: "0.5px",
                        textTransform: "none",
                      }}
                      onClick={ ()=> navigate('/upload')  
                      }
                    >
                      Upload Videos
                    </Button>
                  </div> */}
                </>
              )}
            </div>
            <div className="toggle-section">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <AdminPanelSettingsIcon style={{marginLeft:'35px',marginTop:'2px'}}/>
                <Button
                  style={{
                    color: "white",
                    padding: "5px",
                    marginLeft: "-4.5px",
                    textTransform: "none",
                    fontWeight: "bold",
                    marginTop:'3px'
                  }}
                  //  onClick={() => setAdminOpen(!adminOpen)}
                  disabled={true}
                >
                  Admin
                </Button>
                {!adminOpen ? (
                  <ExpandMoreIcon
                    style={{ marginLeft: "83.5px",marginTop:'5px' }}
                    onClick={() => setAdminOpen(true)}
                  />
                ) : (
                  <ExpandLessIcon
                    style={{ marginLeft: "83.5px",marginTop:'5px' }}
                    onClick={() => setAdminOpen(false)}
                  />
                )}
              </div>
              {adminOpen && (
                  <>
                                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <DownloadForOfflineIcon style={{ marginLeft: "43px" }} />
                    <Button
                      style={{
                        color: "white",
                        padding: "5px",
                        margin: "0.5px",
                        textTransform: "none",
                        fontWeight: 400,
                      }}
                      onClick={ ()=> navigate('/generateCertificate')
                      }
                    >
                      Generate Certificate
                    </Button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <TuneIcon style={{ marginLeft: "43px" }} />
                    <Button
                      style={{
                        color: "white",
                        padding: "5px",
                        margin: "0.5px",
                        textTransform: "none",
                        fontWeight: 400,
                      }}
                      onClick={ ()=> navigate('/aiModels')
                      }
                    >
                      AI Models
                    </Button>
                  </div>
               
                  </>
                )}
            </div>
            <div className="toggle-section">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <DownloadForOfflineIcon style={{marginLeft:'35px',marginTop:'2px'}}/>
                <Button
                  style={{
                    color: "white",
                    padding: "5px",
                    marginLeft: "-1px",
                    textTransform: "none",
                    fontWeight: "bold",
                    marginTop:'2px'
                  }}
                  //  onClick={() => setUploadOpen(!uploadOpen)}
                  disabled={true}
                >
                  Reports
                </Button>
                {!reportOpen ? (
                  <ExpandMoreIcon
                    style={{ marginLeft: "80px" }}
                    onClick={() => setReportOpen(true)}
                  />
                ) : (
                  <ExpandLessIcon
                    style={{ marginLeft: "80px" }}
                    onClick={() => setReportOpen(false)}
                  />
                )}
              </div>
              {/* <button onClick={() => setUploadOpen(!uploadOpen)}>Upload</button> */}
              {reportOpen && (
                <>
                  
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <FileDownloadIcon style={{ marginLeft: "40px" }} />
                    <Button
                      style={{
                        color: "white",
                        padding: "5px",
                        margin: "0.5px",
                        textTransform: "none",
                        fontWeight: 400,
                      }}
                      onClick={() => navigate("/report")}
                    >
                      Generate Reports
                    </Button>
                  
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <FileDownloadIcon style={{ marginLeft: "40px" }} />
                    <Button
                      style={{
                        color: "white",
                        padding: "5px",
                        margin: "0.5px",
                        textTransform: "none",
                        fontWeight: 400,
                      }}
                      onClick={() => navigate("/downloadbladevideos")}
                    >
                      Download Blade Videos
                    </Button>
                 
                  </div>
                </>
              )}
            </div>
            <div className="toggle-section">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <DisplaySettingsIcon style={{marginLeft:'35px',marginTop:'2px' }}/>
                <Button
                  style={{
                    color: "white",
                    padding: "5px",
                    marginLeft: "-1px",
                    textTransform: "none",
                    fontWeight: "bold",
                    marginTop:'1px'
                  }}
                  //  onClick={() => setMonitorOpen(!monitorOpen)}
                  disabled={true}
                >
                  Monitor
                </Button>
                {!monitorOpen ? (
                  <ExpandMoreIcon
                    style={{ marginLeft: "80px" }}
                    onClick={() => setMonitorOpen(true)}
                  />
                ) : (
                  <ExpandLessIcon
                    style={{ marginLeft: "80px" }}
                    onClick={() => setMonitorOpen(false)}
                  />
                )}
              </div>
              {monitorOpen && (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <ChecklistIcon style={{ marginLeft: "40px" }} />
                    <Button
                      style={{
                        color: "white",
                        padding: "5px",
                        margin: "0.5px",
                        textTransform: "none",
                        fontWeight: 400,
                      }}
                      onClick={() => navigate("/inspectionlogs")}
                    >
                      Inspection Logs
                    </Button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <ChecklistIcon style={{ marginLeft: "40px" }} />
                    <Button
                      style={{
                        color: "white",
                        padding: "5px",
                        margin: "0.5px",
                        textTransform: "none",
                        fontWeight: 400,
                      }}
                      onClick={() => navigate("/monitorblade")}
                    >
                      Monitor Blades
                    </Button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <SsidChartIcon style={{ marginLeft: "43px" }} />
                    <Button
                      style={{
                        color: "white",
                        padding: "5px",
                        margin: "0.5px",
                        textTransform: "none",
                        fontWeight: 400,
                      }}
                      onClick={ ()=> navigate('/dashboard_hn')
                      }
                    >
                      Dashboard
                    </Button>
                  </div>                    
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                  {!bladesIsOpen? <HomeIcon style={{marginLeft:'35px',marginTop:'2px'}}/>:<ArrowBackIcon style={{marginLeft:'35px',marginTop:'5px'}}/>}
                    <Button
                      style={{
                        color: "white",
                        padding: "5px",
                        marginTop:'3.5px',
                        marginLeft:'-7.5px',
                        textTransform: "none",
                      }}
                      onClick={() =>
                      setBladesIsOpen(!bladesIsOpen)
                      }
                    >
                      {!bladesIsOpen? 'Home': 'Back'}
                    </Button>
                  </div>
            <div className="toggle-section">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <UploadIcon style={{marginLeft:'35px',marginTop:'2px'}}/>
                <Button
                  style={{
                    color: "white",
                    padding: "5px",
                    textTransform: "none",
                    fontWeight: 'bold',
                    marginLeft:'-3.5px',
                    marginTop:'3px'
                  }}
                  //  onClick={() => setUploadOpen(!uploadOpen)}
                  disabled={true}
                >
                  Upload
                </Button>
                {!uploadOpen ? (
                  <ExpandMoreIcon
                    style={{ marginLeft: "82.5px",marginTop:'4px' }}
                    onClick={() => setUploadOpen(true)}
                  />
                ) : (
                  <ExpandLessIcon
                    style={{ marginLeft: "82.5px",marginTop:'4px' }}
                    onClick={() => setUploadOpen(false)}
                  />
                )}
              </div>
              {/* <button onClick={() => setUploadOpen(!uploadOpen)}>Upload</button> */}
              {uploadOpen && (
                <>
                <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <DriveFolderUploadIcon style={{ marginLeft: "40px" }} />
                    <Button
                      style={{
                        color: "white",
                        padding: "5px",
                        margin: "0.5px",
                        textTransform: "none",
                        fontWeight: 400,
                      }}
                      onClick={ ()=> navigate('/folderUpload')
                      }
                    >
                      Upload Videos
                    </Button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <DriveFolderUploadIcon style={{ marginLeft: "40px" }} />
                    <Button
                      style={{
                        color: "white",
                        padding: "5px",
                        margin: "0.5px",
                        textTransform: "none",
                        fontWeight: 400,
                      }}
                      onClick={() =>
                        uploadDir(
                          setUploadProgress,
                          setInspectionList,
                          inspectionList,
                          setGroupedInspectionList,
                          groupDataByEsn,
                          loggedUser
                        )
                      }
                    >
                      Upload Inspection
                    </Button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <UploadFileIcon style={{ marginLeft: "40px" }} />
                    <Button
                      style={{
                        color: "white",
                        padding: "5px",
                        margin: "0.5px",
                        textTransform: "none",
                        fontWeight: 400,
                      }}
                      onClick={() =>
                        uploadAnnotationsDir(
                          setUploadProgress,
                          fetchInspectionList
                        )
                      }
                    >
                      Upload Annotations
                    </Button>
                  </div>
                </>
              )}
            </div>

            <div className="toggle-section">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <DisplaySettingsIcon style={{marginLeft:'35px',marginTop:'2px' }}/>
                <Button
                  style={{
                    color: "white",
                    padding: "5px",
                    marginLeft: "-1px",
                    textTransform: "none",
                    fontWeight: "bold",
                    marginTop:'1px'
                  }}
                  //  onClick={() => setMonitorOpen(!monitorOpen)}
                  disabled={true}
                >
                  Monitor
                </Button>
                {!monitorOpen ? (
                  <ExpandMoreIcon
                    style={{ marginLeft: "80px" }}
                    onClick={() => setMonitorOpen(true)}
                  />
                ) : (
                  <ExpandLessIcon
                    style={{ marginLeft: "80px" }}
                    onClick={() => setMonitorOpen(false)}
                  />
                )}
              </div>
              {monitorOpen && (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <ChecklistIcon style={{ marginLeft: "40px" }} />
                    <Button
                      style={{
                        color: "white",
                        padding: "5px",
                        margin: "0.5px",
                        textTransform: "none",
                        fontWeight: 400,
                      }}
                      onClick={() => navigate("/monitorblade")}
                    >
                      Monitor Blades
                    </Button>
                  </div>
                  {/* <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <SsidChartIcon style={{ marginLeft: "43px" }} />
                    <Button
                      style={{
                        color: "white",
                        padding: "5px",
                        margin: "0.5px",
                        textTransform: "none",
                        fontWeight: 400,
                      }}
                      onClick={ ()=> navigate('/dashboard_hn')
                      }
                    >
                      Dashboard
                    </Button>
                  </div>                   */}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Main content */}
      <div
        style={{
          flexGrow: 1,
          marginLeft: openSidebar ? "250px" : "0", // Adjust margin based on sidebar state
          transition: "margin-left 0.3s",
          padding: "20px",
          overflow: "auto",
        }}
      >
        <Button
          style={{
            position: "fixed",
            top: "80px",
            left: "10px",
            height: "25px",
            zIndex: 1001, // Ensure toggle button is on top of the sidebar
          }}
          onClick={() => setOpenSidebar(!openSidebar)}
        >
          {!openSidebar ? (
            <>
            {bladesIsOpen ? <MenuIcon style={{ marginTop: "3px", color: "black" }} />:
            <MenuIcon style={{ marginTop: "3px", color: "white" }} />
            }
            </>
          ) : (
            <ArrowBackIosIcon
              style={{ marginTop: "3px", color: "white", marginLeft: "0.5px" }}
            />
          )}
        </Button>
          {bladesIsOpen && (
            <Blades uploadProgress={uploadProgress}/>
          )}
      </div>
    </div>
  );
}

export default HomePage;
