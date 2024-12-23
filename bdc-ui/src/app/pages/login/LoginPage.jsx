import "./LoginPage.css";
import Avatar from '@mui/material/Avatar';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useEffect, useState, Suspense, Fragment } from "react";
import { Box, CircularProgress, Button, backdropClasses } from "@mui/material";
import LockIcon from '@mui/icons-material/Lock';
import { DataGrid } from "@mui/x-data-grid";

import { showDirectoryPicker } from "https://cdn.jsdelivr.net/npm/file-system-access/lib/es2018.js";

//import { useHistory } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Loading from "../../components/Loading";
import React from "react";

import { jsonrepair } from "jsonrepair";
import {
  createInspection,
  deleteInspection,
  getInspectionList,
  uploadImageFileAndMetadata,
} from "../../services/inspection_api";

import { isUserLoggedIn, logInUser, logOutUser } from "../../services/login_api";

import { uploadAnnotationMeasurementFile } from "../../services/measurement_api";

import { uploadMeasurementImageAndAnnotation } from "../../services/image_api";
import InputButton from "../../components/InputButton";
import LinearProgressWithLabel from "../../components/LinearProgressWithLabel";


function LoginPage() {
  // Data for user
  const [userSso, setUserSso] = useState([]);

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = React.useState(0);
  //const history = useHistory();
  const navigate = useNavigate();

  const [askUserForSso, setAskUserForSso] = useState(false);

  useEffect(() => {
    setLoading(true);
    async function fetchUserData() {

      try {
          const timer = setInterval(() => {
            setProgress((prevProgress) => (prevProgress >= 100 ? 0 : prevProgress + 20));
          }, 800);
          console.log("setLoading ----> ", loading);
          const firstResponse = await fetch('/sso');
          console.log("first response ------ ",firstResponse);
          if (!firstResponse.ok) {
              throw new Error('Network response was not ok');
          }

          const userSSO = await firstResponse.json();
          setUserSso(userSSO);
          console.log("userSSO ------ ",userSSO['sso']);
          let loggedInUserSso = userSSO['sso'];

          if (userSSO != null ){
            const idmResponse = await fetch(`/api/idmcheck/${loggedInUserSso}`);
            // if (!idmResponse.ok) {
            //     throw new Error('Network response was not ok');
            // }
            const idmCheck = await idmResponse.json();
            console.log("idmCheck ----> 2 ", idmCheck);
            if(idmCheck) {
              console.log("idmCheck ----> 3 ", idmCheck);
              localStorage.setItem("loggedSSO", loggedInUserSso);
              setLoading(false);
              navigate(`/home`);
            } else {
              setLoading(false);
              navigate(`/logout`);
              console.log("else ----> ", loading);
              //logOutUser(loggedInUserSso);
            }

          }
      } catch (error) {
          console.error('Error:', error);     
      } finally { 
       // setLoading(false);
      }
    }

    // We still have dev environments such as localhost and http://vrn1masda.crd.ge.com:3000 that need alternative logins
    let isDevEnvironment = false;
    const currentURL = window.location.href;
    console.log('currentURL:',currentURL);
    if (currentURL.includes('localhost') || currentURL.includes('crd.ge.com')) {
      console.log('Entering dev mode');
      setAskUserForSso(true);
      isDevEnvironment = true;
    }

    if (! isDevEnvironment) fetchUserData();

  },[]);


  // useEffect(() => {
  //   // no return function.
  //   // we could return a cleanup function here.

  //   // Note: this route is defined in the file setupProxy.js
  //   fetch('/sso')
  //     .then(r => r.json())
  //     .then(oidcSso => {
  //       console.log('oidcSso:',oidcSso);
  //       if (oidcSso['sso'] != null) {
  //         if (logInUser(oidcSso['sso']))
  //           navigate(`/home`);
  //       }

  //     });

  // }, []);

  // useEffect(() => {
  //   const fetchData1 = async () => {
  //     const response = await fetch(`${BASE_URL}/idmcheck/${inputSSO}`);
  //     const fetchedData = await response.json();
  //     if (fetchedData)
  //       navigate(`/home`);
  //   };

  //   fetchData1();
  // }, []);

  const handleOnSubmit = event => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    console.log({
      sso: data.get('sso'),
      password: data.get('password'),
    });
    let loggedInUserSso = data.get('sso');
    if (loggedInUserSso != null ) {
      localStorage.setItem("loggedSSO", loggedInUserSso.toString());
      navigate(`/home`);
    }
  };


      <Grid container component="main" sx={{ height: '75vh' }}>
      <CssBaseline />
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      {loading ? (
        <CircularProgress variant="determinate" value={progress} />
      ) : (
        console.log("else is called")
        //navigate(`/home`)
      )}
    </Box>
    </Grid>

  return (
    <Fragment>

    {!askUserForSso && <Grid container component="main" sx={{ height: '75vh' }}>
      <CssBaseline />
      <Box display="flex" justifyContent="center" alignItems="flex-start" height="100vh">
      {loading ? (
        <CircularProgress variant="determinate" value={progress} />
      ) : (
        console.log("else is called")
        //navigate(`/home`)
      )}
    </Box>
    </Grid>}

    
    {askUserForSso && <Grid
      item
      xs={false}
      sm={4}
      md={7}
      sx={{
        backgroundImage: 'url(./GEBlade.png)',
        backgroundRepeat: 'no-repeat',
        backgroundColor: (t) =>
          t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <Box
          sx={{
            my: 8,
            mx: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'seagreen' }}>
            <LockIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          <Box component="form" noValidate onSubmit={handleOnSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="sso"
              label="SSO"
              name="sso"
              autoComplete="sso"
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
            />
            <FormControlLabel
              control={<Checkbox value="remember" color="primary" />}
              label="Remember me"
            />
            <Button
              style={{ backgroundColor: '#003839' }}
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
            <Grid container>
              <Grid item xs>
                <Link href="#" variant="body2">
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <Link href="#" variant="body2">
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Grid> 
    </Grid>}

    </Fragment>
  );
}


export default LoginPage;
