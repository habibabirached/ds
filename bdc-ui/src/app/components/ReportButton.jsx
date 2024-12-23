import React from "react";

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Fade from '@mui/material/Fade';
import Button from '@mui/material/Button';
import ArticleIcon from "@mui/icons-material/Article";
import Typography from "@mui/material/Typography";
import { downloadInspectionReportPDFAsync } from "../services/inspection_api";

const ReportButton = ({ path, label, backgroundColor, minWidth, esn, manufactureStageOptions, onClick }) => {
  
  
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [openMenu,setOpenMenu] = React.useState(false);

  const handleInspectionReportBtnClick = (event) => {
    console.log('handleInspectionReportBtnClick()');
    setOpenMenu(! openMenu);
    setAnchorEl(event.target);
  };

  const handleMenuClose = (event) => {
    console.log('handleMenuClose()');
    setOpenMenu(false);
    //setAnchorEl(null);
  }

  const downloadInspectionReport = (manufacture_stage="%") => {
    console.log('downloadInspectionReport() called for:',esn, manufacture_stage); 
    if (manufacture_stage == null) manufacture_stage = '%';
    const stage = manufacture_stage.replace(' ','%20');
    
    downloadInspectionReportPDFAsync(esn, manufacture_stage, path);
    // const link = document.createElement("a");
    // link.href=`${path}?esn=${esn}&manufacture_stage=${stage}`;
    // link.download=`${esn}_${manufacture_stage}_report.pdf`;
    // console.log('link.href:',link.href)
    // link.click();
    

    setOpenMenu(false);
    onClick();
  };
  
  
  return (
    <React.Fragment>
      <Button
          variant="contained"
          size="small"
          style={{
            minWidth: minWidth,
            fontWeight: "bold",
            backgroundColor: backgroundColor,
            marginBottom: 5,
            textAlign: "center",
            marginLeft: 5,
          }}
          id="fade-button"
          aria-controls={openMenu ? 'fade-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={openMenu ? 'true' : undefined}
          onClick={handleInspectionReportBtnClick}
        >
            <ArticleIcon style={{ marginLeft: -20, marginRight: 5 }} /> {label}  
        </Button>
        <Menu
          id="fade-menu"
          MenuListProps={{
            'aria-labelledby': 'fade-button',
          }}
          anchorEl={anchorEl}
          open={openMenu}
          onClose={handleMenuClose}
          TransitionComponent={Fade}
        >
          { manufactureStageOptions.map((option, idx) =>  
            <MenuItem key={idx} 
                      onClick={() => downloadInspectionReport(option)}
            > 
              {esn} {option}
            </MenuItem>
          )}
          {(manufactureStageOptions.length === 0 || manufactureStageOptions.length > 1) &&
            <MenuItem key={manufactureStageOptions.length} 
                          onClick={() => downloadInspectionReport('%')}
            > 
              {esn} All Stages
            </MenuItem>
          }
        </Menu>
    </React.Fragment>
  );
};

export default ReportButton;