// import "./Header.css";
// import React from "react";

// import AppBar from "@mui/material/AppBar";
// import Box from "@mui/material/Box";
// import Toolbar from "@mui/material/Toolbar";
// import Typography from "@mui/material/Typography";
// import IconButton from "@mui/material/IconButton";
// import HomeIcon from "@mui/icons-material/Home";
// import Button from "@mui/material/Button";
// import Menu from "@mui/material/Menu";
// import MenuItem from "@mui/material/MenuItem";
// import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";

// import {
//   isUserLoggedIn,
//   getCurrentUser,
//   logOutUser,
// } from "../services/login_api";

// import { useNavigate } from "react-router-dom";
// import { useEffect, useState } from "react";

// export default function Header() {
//   const [loggedIn, setLoggedIn] = useState("false");

//   const navigate = useNavigate();

//   const [anchorEl, setAnchorEl] = React.useState(null);
//   const open = Boolean(anchorEl);

//   const loggedUser = localStorage.getItem("loggedSSO");

//   useEffect(() => {
//     const res = isUserLoggedIn(getCurrentUser());

//     console.log("In usestate for header, res = ", res);
//     if (res) setLoggedIn("true");
//     else setLoggedIn("false");
//   }, [loggedUser]);

//   const handleClick = (event) => {
//     setAnchorEl(event.currentTarget);
//   };

//   const handleClose = () => {
//     setAnchorEl(null);
//   };

//   const handleLogout = () => {
//     const res = logOutUser(getCurrentUser());
//     console.log("After Logout ---> ", getCurrentUser());
//     setLoggedIn("false");
//     setAnchorEl(null);
//     //navigate(`/`);
//   };

//   const handleHome = () => {
//     const res = isUserLoggedIn(getCurrentUser());
//     setAnchorEl(null);

//     if (res) {
//       setLoggedIn("true");
//       navigate(`/home`);
//     } else {
//       setLoggedIn("false");
//       navigate("/");
//     }
//   };

//   return (
//     <header>
//       <Box sx={{ flexGrow: 1 }}>
//         <AppBar position="static" style={{ backgroundColor: "#003839" }}>
//           <Toolbar>
//             <IconButton
//               size="large"
//               edge="start"
//               color="inherit"
//               aria-label="menu"
//               sx={{ mr: 2 }}
//               onClick={handleHome}
//             >
//               <HomeIcon />
//             </IconButton>
//             <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
//               Blade Digital Certificate
//             </Typography>

//             {loggedIn === "true" && (
//               <div>
//                 <Button
//                   id="basic-button"
//                   size="large"
//                   color="inherit"
//                   aria-controls={open ? "basic-menu" : undefined}
//                   aria-haspopup="true"
//                   aria-expanded={open ? "true" : undefined}
//                   onClick={handleClick}
//                 >
//                   {getCurrentUser()} <br /> <ManageAccountsIcon />
//                 </Button>
//                 <Menu
//                   id="basic-menu"
//                   anchorEl={anchorEl}
//                   open={open}
//                   onClose={handleClose}
//                   MenuListProps={{
//                     "aria-labelledby": "basic-button",
//                   }}
//                 >
//                   {/* <MenuItem onClick={handleClose}>Profile</MenuItem>
//                         <MenuItem onClick={handleClose}>Admin</MenuItem> */}
//                   <MenuItem onClick={handleLogout}>Logout</MenuItem>
//                 </Menu>
//               </div>
//             )}
//           </Toolbar>
//         </AppBar>
//       </Box>
//     </header>
//   );
// }

import "./Header.css";
import React, { useState, useEffect } from "react";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Popover,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  FormControl,
  InputLabel,
  MenuItem as DropdownItem,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useNavigate } from "react-router-dom";
import {
  isUserLoggedIn,
  getCurrentUser,
  logOutUser,
} from "../services/login_api";

export default function Header() {
  const [loggedIn, setLoggedIn] = useState("false");
  const [anchorEl, setAnchorEl] = useState(null);
  const [popoverAnchorEl, setPopoverAnchorEl] = useState(null);
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [createIncidentDialogOpen, setCreateIncidentDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [filter, setFilter] = useState({
    number: '',
    state: '',
    short_description: ''
  });
  // const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [incidentForm, setIncidentForm] = useState({ userSSO: getCurrentUser(), shortDesc: '', desc: '' });
  // const [requestForm, setRequestForm] = useState({ userSSO: '', shortDesc: '', desc: '' });
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  // const [errors, setErrors] = useState({});
  const [incidents, setIncidents] = useState([]);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);
  const popoverOpen = Boolean(popoverAnchorEl);
  const loggedUser = localStorage.getItem("loggedSSO");
  const [requestDialogOpen, setRequestDialogOpen] = useState(false); // View requests
  const [createRequestDialogOpen, setCreateRequestDialogOpen] = useState(false); // Create a new request
  const [requests, setRequests] = useState([]); // Store requests data
  const [requestForm, setRequestForm] = useState({
    userSSO: getCurrentUser(),
    shortDesc: '',
    desc: '',
  });
  const [filterRequest, setFilterRequest] = useState({
    number: '',
    state: '',
    short_description: '',
  }); // Filter for requests
  const [errors, setErrors] = useState({});
  const [pageRequest, setPageRequest] = useState(0);
  const [rowsPerPageRequest, setRowsPerPageRequest] = useState(5);
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);
  const [isSubmittingRequest,setIsSubmittingRequest]=useState(false);

  useEffect(() => {
    const res = isUserLoggedIn(getCurrentUser());
    if (res) setLoggedIn("true");
    else setLoggedIn("false");
  }, [loggedUser]);

  useEffect(() => {
    if (loggedIn === "true") {
      fetchIncidents();
      fetchRequests();
    }
  }, [loggedIn]);

  const getApiBaseUrl = () => {
    if (window.location.hostname.includes("dev")) {
      return "https://digitalhealthrecord-dbc.dev.gevernova.net";
    } else {
      return "https://digitalhealthrecord-dbc.gevernova.net";
    }
  };

  const fetchIncidents = () => {
    const userSSO = getCurrentUser();
    fetch(`${getApiBaseUrl()}/api/sn_incident_request/${userSSO}`)
      .then((response) => response.json())
      .then((data) => {
        const formattedData = data.result.map(item => ({
          number: item.number,
          state: item.state,
          short_description: item.short_description
        }));
        setIncidents(formattedData);
      })
      .catch((error) => {
        console.error("Error fetching incidents:", error);
      });
  };

  const fetchRequests = () => {
    const userSSO = getCurrentUser();
    fetch(`${getApiBaseUrl()}/api/sn_task_request/${userSSO} `)
      .then((response) => response.json())
      .then((data) => {
        const formattedData = data.result.map((item) => ({
          number: item.number,
          state: item.state,
          short_description: item.short_description,
        }));
        setRequests(formattedData);
      })
      .catch((error) => {
        console.error('Error fetching requests:', error);
      });
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logOutUser(getCurrentUser());
    setLoggedIn("false");
    setAnchorEl(null);
  };

  const handleHome = () => {
    const res = isUserLoggedIn(getCurrentUser());
    setAnchorEl(null);
    if (res) {
      setLoggedIn("true");
      navigate(`/home`);
    } else {
      setLoggedIn("false");
      navigate("/");
    }
  };

  const handlePopoverOpen = (event) => {
    setPopoverAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setPopoverAnchorEl(null);
  };

  const handleIncidentDialogOpen = () => {
    setIncidentForm({ userSSO: getCurrentUser(), shortDesc: '', desc: '' });
    setErrors({});
    setIncidentDialogOpen(true);
  };

  const handleIncidentDialogClose = () => {
    setFilter({
      number: '',
      state: '',
      short_description: ''
    })
    setIncidentDialogOpen(false);
  };

  const handleCreateIncidentDialogOpen = () => {
    setIncidentForm({ userSSO: getCurrentUser(), shortDesc: '', desc: '' });
    setErrors({});
    setCreateIncidentDialogOpen(true);
  };

  const handleCreateIncidentDialogClose = () => {
    setIncidentForm({ userSSO: '', shortDesc: '', desc: '' });
    setErrors({});
    setCreateIncidentDialogOpen(false);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (event) => {
    setFilter({
      ...filter,
      [event.target.name]: event.target.value
    });
  };

  // const handleRequestDialogOpen = () => {
  //   setRequestForm({ userSSO: getCurrentUser(), shortDesc: '', desc: '' });
  //   setErrors({});
  //   setRequestDialogOpen(true);
  // };

  // const handleRequestDialogClose = () => {
  //   setRequestForm({ userSSO: '', shortDesc: '', desc: '' });
  //   setErrors({});
  //   setRequestDialogOpen(false);
  // };

  const handleResponseDialogClose = () => {
    setResponseDialogOpen(false);
  };

  const handleIncidentFormChange = (event) => {
    setIncidentForm({ ...incidentForm, [event.target.name]: event.target.value });
  };

  const handleSubmitIncident = () => {
    const newErrors = validateForm(incidentForm);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setIsSubmittingIncident(true);

    const incidentData = {
      userSSO: incidentForm.userSSO,
      shortDesc: incidentForm.shortDesc,
      desc: incidentForm.desc,
    };

    fetch(`${getApiBaseUrl()}/api/sn_incident_request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(incidentData),
    })
      .then((response) => response.json())
      .then((data) => {
        setResponseMessage(data);
        setResponseDialogOpen(true);
        fetchIncidents();
        handleCreateIncidentDialogClose();
        handleIncidentDialogOpen();
      })
      .catch((error) => {
        console.error("Error creating incident:", error);
      })
      .finally(() => {
        setIsSubmittingIncident(false);
      });
      ;
  };

  // const handleRequestFormChange = (event) => {
  //   setRequestForm({ ...requestForm, [event.target.name]: event.target.value });
  // };

  // const handleSubmitRequest = () => {
  //   const newErrors = validateForm(requestForm);
  //   if (Object.keys(newErrors).length > 0) {
  //     setErrors(newErrors);
  //     return;
  //   }

  //   const requestData = {
  //     userSSO: requestForm.userSSO,
  //     shortDesc: requestForm.shortDesc,
  //     desc: requestForm.desc,
  //   };

  //   fetch("api/sn_service_request", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify(requestData),
  //   })
  //     .then((response) => response.json())
  //     .then((data) => {
  //       setResponseMessage(data);
  //       setResponseDialogOpen(true);
  //       handleRequestDialogClose();
  //     }).catch((error) => {
  //       console.error("Error creating request:", error);
  //     });
  // };

  // const validateForm = (form) => {
  //   const newErrors = {};
  //   if (!form.userSSO) newErrors.userSSO = 'User SSO is required';
  //   if (!form.shortDesc) newErrors.shortDesc = 'Short Description is required';
  //   if (!form.desc) newErrors.desc = 'Description is required';
  //   return newErrors;
  // };

  // Filtered data
  const filteredData = incidents.filter(item =>
    item.number.toLowerCase().includes(filter.number.toLowerCase()) &&
    item.state.toLowerCase().includes(filter.state.toLowerCase()) &&
    item.short_description.toLowerCase().includes(filter.short_description.toLowerCase())
  );

  const handleRequestDialogOpen = () => {
    setRequestDialogOpen(true);
  };

  // Close Request Dialog
  const handleRequestDialogClose = () => {
    setFilterRequest({ number: '', state: '', short_description: '' });
    setRequestDialogOpen(false);
  };

  // Open Create Request Dialog
  const handleCreateRequestDialogOpen = () => {
    setRequestForm({ userSSO: getCurrentUser(), shortDesc: '', desc: '' });
    setErrors({});
    setCreateRequestDialogOpen(true);
  };

  // Close Create Request Dialog
  const handleCreateRequestDialogClose = () => {
    setRequestForm({ userSSO: '', shortDesc: '', desc: '' });
    setErrors({});
    setCreateRequestDialogOpen(false);
  };

  const handleRequestFormChange = (event) => {
    setRequestForm({ ...requestForm, [event.target.name]: event.target.value });
  };

  const handleSubmitRequest = () => {
    const newErrors = validateForm(requestForm);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmittingRequest(true);

    const requestData = {
      userSSO: requestForm.userSSO,
      shortDesc: requestForm.shortDesc,
      desc: requestForm.desc,
    };

    fetch(`${getApiBaseUrl()}/api/sn_service_request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    })
      .then((response) => response.json())
      .then((data) => {
        setResponseMessage(data);
        setResponseDialogOpen(true);
        fetchRequests(); // Refresh request list
        handleCreateRequestDialogClose();
        handleRequestDialogOpen()
      }).catch((error) => {
        console.error("Error creating request:", error);
      })
      .finally(() => {
        setIsSubmittingRequest(false);
      });
      ;
  };

  const validateForm = (form) => {
    const newErrors = {};
    if (!form.userSSO) newErrors.userSSO = 'User SSO is required';
    if (!form.shortDesc) newErrors.shortDesc = 'Short Description is required';
    if (!form.desc) newErrors.desc = 'Description is required';
    return newErrors;
  };

  const handleChangePageRequest = (event, newPage) => {
    setPageRequest(newPage);
  };

  // Handle Rows Per Page Change
  const handleChangeRowsPerPageRequest = (event) => {
    setRowsPerPageRequest(parseInt(event.target.value, 10));
    setPageRequest(0);
  };

  // Handle Filter Changes
  const handleFilterRequestChange = (event) => {
    setFilterRequest({ ...filterRequest, [event.target.name]: event.target.value });
  };

  // Filtered Data
  const filteredRequests = requests.filter(
    (item) =>
      item.number.toLowerCase().includes(filterRequest.number.toLowerCase()) &&
      item.state.toLowerCase().includes(filterRequest.state.toLowerCase()) &&
      item.short_description
        .toLowerCase()
        .includes(filterRequest.short_description.toLowerCase())
  );

  return (
    <header>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" style={{ backgroundColor: "#003839" }}>
          <Toolbar>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={handleHome}
            >
              <HomeIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Blade Digital Certificate
            </Typography>

            {loggedIn === "true" && (
              <>
                <IconButton
                  size="large"
                  color="inherit"
                  aria-label="help"
                  onClick={handlePopoverOpen}
                >
                  <HelpOutlineIcon />
                </IconButton>

                <Button
                  id="basic-button"
                  size="large"
                  color="inherit"
                  aria-controls={open ? "basic-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? "true" : undefined}
                  onClick={handleClick}
                >
                  {getCurrentUser()} <br /> <ManageAccountsIcon />
                </Button>
                <Menu
                  id="basic-menu"
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  MenuListProps={{
                    "aria-labelledby": "basic-button",
                  }}
                >
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            )}
          </Toolbar>
        </AppBar>
      </Box>

      {loggedIn === "true" && (
        <>
          <Popover
            open={popoverOpen}
            anchorEl={popoverAnchorEl}
            onClose={handlePopoverClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
          >
            <Box p={0.5} sx={{ minHeight: '50px' }}>
              <List disablePadding>
                <ListItem button sx={{ py: 0.25, my: 0 }} onClick={() => {
                  window.open("https://spo-teamsite.ge.com/sites/GEVRENONWDTArchitectureOperations/_layouts/15/Doc.aspx?sourcedoc=%7B1C466396-905E-48DB-8005-4BEBA25D357A%7D&file=DBC%20-%20Product%20guide_Aug%202024.docx&action=default&mobileredirect=true&CT=1733128960183&OR=ItemsView", "_blank");
                  handlePopoverClose();
                }}>
                  <ListItemText primary="User Guide" />
                </ListItem>
                <ListItem button sx={{ py: 0.25, my: 0 }} onClick={() => {
                  handleIncidentDialogOpen();
                  handlePopoverClose();
                }}>
                  <ListItemText primary="Incidents" />
                </ListItem>
                <ListItem button sx={{ py: 0.25, my: 0 }} onClick={() => {
                  handleRequestDialogOpen();
                  handlePopoverClose();
                }}>
                  <ListItemText primary="Requests" />
                </ListItem>
              </List>
            </Box>
          </Popover>

          <Dialog open={incidentDialogOpen} onClose={handleIncidentDialogClose} fullWidth maxWidth="md">
            <DialogTitle>Incident Details</DialogTitle>
            <DialogContent>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      Incident Number
                      <TextField
                        name="number"
                        value={filter.number}
                        onChange={handleFilterChange}
                        variant="standard"
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      Status
                      <TextField
                        name="state"
                        value={filter.state}
                        onChange={handleFilterChange}
                        variant="standard"
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      Short Description
                      <TextField
                        name="short_description"
                        value={filter.short_description}
                        onChange={handleFilterChange}
                        variant="standard"
                        fullWidth
                      />
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => (
                    <TableRow key={index} sx={{ py: 0.5 }}>
                      <TableCell>{row.number}</TableCell>
                      <TableCell>{row.state}</TableCell>
                      <TableCell>{row.short_description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleIncidentDialogClose} color="primary">
                Cancel
              </Button>
              <Button onClick={handleCreateIncidentDialogOpen} color="primary">
                Create Incident
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={createIncidentDialogOpen} onClose={handleCreateIncidentDialogClose} fullWidth maxWidth="sm">
            <DialogTitle>Create ServiceNow Incident</DialogTitle>
            <DialogContent>
              <TextField
                label="User SSO"
                name="userSSO"
                value={incidentForm.userSSO}
                onChange={handleIncidentFormChange}
                fullWidth
                margin="normal"
                error={!!errors.userSSO}
                helperText={errors.userSSO}
                disabled
              />
              <TextField
                label="Short Description"
                name="shortDesc"
                value={incidentForm.shortDesc}
                onChange={handleIncidentFormChange}
                multiline
                rows={2}
                fullWidth
                margin="normal"
                error={!!errors.shortDesc}
                helperText={errors.shortDesc}
              />
              <TextField
                label="Description"
                name="desc"
                value={incidentForm.desc}
                onChange={handleIncidentFormChange}
                multiline
                rows={4}
                fullWidth
                margin="normal"
                error={!!errors.desc}
                helperText={errors.desc}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCreateIncidentDialogClose} color="primary">Cancel</Button>
              <Button onClick={handleSubmitIncident} color="primary" disabled={isSubmittingIncident}>
                {isSubmittingIncident ? "Submitting..." : "Submit"}
              </Button>
            </DialogActions>
          </Dialog>

          {/* <Dialog open={requestDialogOpen} onClose={handleRequestDialogClose} fullWidth maxWidth="md">
            <DialogTitle>Create ServiceNow Request</DialogTitle>
            <DialogContent>
              <TextField
                label="User SSO"
                name="userSSO"
                value={requestForm.userSSO}
                onChange={handleRequestFormChange}
                fullWidth
                margin="normal"
                error={!!errors.userSSO}
                helperText={errors.userSSO}
                disabled
              />
              <TextField
                label="Short Description"
                name="shortDesc"
                value={requestForm.shortDesc}
                onChange={handleRequestFormChange}
                multiline
                rows={2}
                fullWidth
                margin="normal"
                error={!!errors.shortDesc}
                helperText={errors.shortDesc}
              />
              <TextField
                label="Description"
                name="desc"
                value={requestForm.desc}
                onChange={handleRequestFormChange}
                multiline
                rows={4}
                fullWidth
                margin="normal"
                error={!!errors.desc}
                helperText={errors.desc}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleRequestDialogClose} color="primary">Cancel</Button>
              <Button onClick={handleSubmitRequest} color="primary">Submit</Button>
            </DialogActions>
          </Dialog> */}

          <Dialog open={requestDialogOpen} onClose={handleRequestDialogClose} fullWidth maxWidth="md">
            <DialogTitle>Request Details</DialogTitle>
            <DialogContent>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      Request Number
                      <TextField
                        name="number"
                        value={filterRequest.number}
                        onChange={handleFilterRequestChange}
                        variant="standard"
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      Status
                      <TextField
                        name="state"
                        value={filterRequest.state}
                        onChange={handleFilterRequestChange}
                        variant="standard"
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      Short Description
                      <TextField
                        name="short_description"
                        value={filterRequest.short_description}
                        onChange={handleFilterRequestChange}
                        variant="standard"
                        fullWidth
                      />
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRequests
                    .slice(
                      pageRequest * rowsPerPageRequest,
                      pageRequest * rowsPerPageRequest + rowsPerPageRequest
                    )
                    .map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.number}</TableCell>
                        <TableCell>{row.state}</TableCell>
                        <TableCell>{row.short_description}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredRequests.length}
                rowsPerPage={rowsPerPageRequest}
                page={pageRequest}
                onPageChange={handleChangePageRequest}
                onRowsPerPageChange={handleChangeRowsPerPageRequest}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleRequestDialogClose} color="primary">
                Cancel
              </Button>
              <Button onClick={handleCreateRequestDialogOpen} color="primary">
                Create Request
              </Button>
            </DialogActions>
          </Dialog>

          {/* Create Request Dialog */}
          <Dialog open={createRequestDialogOpen} onClose={handleCreateRequestDialogClose} fullWidth maxWidth="sm">
            <DialogTitle>Create ServiceNow Request</DialogTitle>
            <DialogContent>
              <TextField
                label="User SSO"
                name="userSSO"
                value={requestForm.userSSO}
                onChange={handleRequestFormChange}
                fullWidth
                margin="normal"
                error={!!errors.userSSO}
                helperText={errors.userSSO}
                disabled
              />
              <TextField
                label="Short Description"
                name="shortDesc"
                value={requestForm.shortDesc}
                onChange={handleRequestFormChange}
                multiline
                rows={2}
                fullWidth
                margin="normal"
                error={!!errors.shortDesc}
                helperText={errors.shortDesc}
              />
              <TextField
                label="Description"
                name="desc"
                value={requestForm.desc}
                onChange={handleRequestFormChange}
                multiline
                rows={4}
                fullWidth
                margin="normal"
                error={!!errors.desc}
                helperText={errors.desc}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCreateRequestDialogClose} color="primary">
                Cancel
              </Button>
              <Button onClick={handleSubmitRequest} color="primary" disabled={isSubmittingRequest}>
                {isSubmittingRequest ? "Submitting..." : "Submit"}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={responseDialogOpen} onClose={handleResponseDialogClose} fullWidth maxWidth="sm">
            <DialogTitle>Response</DialogTitle>
            <DialogContent>
              <Typography variant="body1">{responseMessage}</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleResponseDialogClose} color="primary">Close</Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </header>
  );
}