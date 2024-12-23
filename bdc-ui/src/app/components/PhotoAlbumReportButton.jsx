import React from "react";

import ReportButton from "./ReportButton";


const InspectionReportButton = ({ esn, manufactureStageOptions, onClick }) => {
  
  
  return (
      
    <ReportButton path='api/virtualtour/pdf'
                  label="Photo Album"
                  backgroundColor="#004953"
                  esn={esn}
                  minWidth={160}
                  manufactureStageOptions={manufactureStageOptions}
                  onClick={onClick}
                 
    /> 
  );
};

export default InspectionReportButton;