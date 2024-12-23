import { Outlet } from "react-router-dom";
import Header from './components/Header';
import Footer from './components/Footer';
import { Box } from "@mui/material";


const AppLayout = () => {
  return (
    <>
      <Header/>

      <Box sx={{ m: 2 }} >
        <Outlet />
      </Box>

      <Footer/>
    </>
  )
};

export default AppLayout;