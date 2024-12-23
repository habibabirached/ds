// import { Outlet } from "react-router-dom";
// import Header from "./components/Header";
// import Footer from "./components/Footer";
// import { Box } from "@mui/material";

// const AppLayout = () => {
//   return (
//     <>
//       <Header />

//       <Box sx={{ m: 2 }}>
//         <Outlet />
//       </Box>

//       <Footer />
//     </>
//   );
// };

// export default AppLayout;

import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Box } from "@mui/material";

const AppLayout = () => {
  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <Box sx={{ padding: 3, flexGrow: 1, overflow: "auto" }}>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
};

export default AppLayout;
