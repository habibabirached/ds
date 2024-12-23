import React, { lazy } from "react";
import { Routes, Route } from "react-router-dom";

//const AppLayout = lazy(() => import("./AppLayout"));
import AppLayout from "./AppLayout";

// Landing page
//const HomePage = lazy(() => import('./pages/home/HomePage'));
import HomePage from "./pages/home/HomePage";
import HomePageTest from "./pages/home/HomePageTest";
import LoginPage from "./pages/login/LoginPage";
import LogoutPage from "./pages/logout/LogoutPage";

//Inspection page
//const Inspection = lazy(() => import("./pages/inspection/Inspection"));
import Inspection from "./pages/inspection/Inspection";
import VideoInspection from "./pages/videoinspection/VideoInspection";
import Report from "./pages/report/Report";
import Snapshot from "./pages/snapshot/Snapshot";
import ImageInspection from "./pages/imageinspection/ImageInspection";
import ImageView from "./pages/imageview/ImageView";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import BladeHomePage from "./pages/bladehomeviewcavity/BladeHomePage";
import InspectionHomePage from "./pages/inspectionhome/InspectionHomePage";
import BladeQualityPage from "./pages/bladequalityreviewfindings/BladeQualityPage";
import DefectPage from "./pages/defect/DefectPage";
import MeasurementPage from "./pages/measurement/MeasurementPage";
import DefectValidationPage from "./pages/defectvalidation/DefectValidationPage";
import InspectionLogsPage from "./pages/inspectionlogs/InspectionLogsPage";
import MonitorBlade from './pages/monitorblade/MonitorBlade';
import Blades from "./pages/home/Blades";
import FolderUpload from "./pages/folderupload/FolderUpload";
import BrowseDefectsPage from "./pages/browsedefects/BrowseDefectsPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import DashboardHn from "./pages/dashboard_hn/DashboardHn";
import GenerateCertificate from "./pages/generateCertificate/GenerateCertificate";
import AIModels from "./pages/aimodels/AIModels";
import ImageInspection2d from "./pages/imageinspection2d/ImageInspection2d";
import ReviewFindingImage from "./pages/bladequalityreviewfindings/ReviewFindingImage";
import BrowseImagesPage from "./pages/browseimages/BrowseImagesPage";
import DownloadBladeVideos from "./pages/downloadbladevideos/DownloadBladeVideos";
 
const darkTheme = createTheme({
  palette: {
    mode: "light",
  },
});

const AppRoutes = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<LoginPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/home2" element={<HomePageTest />} />
          <Route path="/logout" element={<LogoutPage />} />
          
          <Route path="/inspections" element={<InspectionHomePage />} />
          <Route path="/blade" element={<BladeHomePage />} />
          <Route path="/bladequality" element={<BladeQualityPage />} />
          <Route path="/defect/:id" element={<DefectPage />} />
          <Route path="/measurement/:id" element={<MeasurementPage />} />
          <Route path="/inspection/:id" element={<Inspection />} />
          <Route path="/imageinspection/:id" element={<ImageInspection />} />
          <Route path="/imageinspection2d/:id" element={<ImageInspection2d />} />

          <Route path="/imageview/:id" element={<ImageView />} />
          <Route path="/videoinspection/:id" element={<VideoInspection />} />
          <Route path="/report/:id" element={<Report />} />
          <Route path="/snapshot" element={<Snapshot />} />
          <Route path="/defectvalidation" element={<DefectValidationPage />} />
          <Route path="/browsedefects" element={<BrowseDefectsPage/>}/>
          <Route path="/browseimages" element={<BrowseImagesPage/>}/>
          <Route path="/dashboard" element={<DashboardPage/>}/>
          <Route path="/dashboard_hn" element={<DashboardHn/>}/>
          <Route path="/ReviewFindingImage" element={<ReviewFindingImage/>}/>
          <Route path="/inspectionlogs" element={<InspectionLogsPage />} />
          <Route path="/monitorblade" element={<MonitorBlade />} />
          <Route path="/bladeslist" element={<Blades/>}/>
          <Route path="/folderUpload" element={<FolderUpload/>}/>
          <Route path="/generateCertificate" element={<GenerateCertificate/>}/>
          <Route path="/aiModels" element={<AIModels/>}/>
          <Route path="/report" element={<Report/>}/>
          <Route path="/downloadbladevideos" element={<DownloadBladeVideos/>}/>
        </Route>
      </Routes>
    </ThemeProvider>
  );
};

export default AppRoutes;