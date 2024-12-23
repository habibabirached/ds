import React from "react";

import ReportButton from "./ReportButton";


const InspectionReportButton = ({ esn, manufactureStageOptions, onClick }) => {
  
  
  return (
   
    <ReportButton path='api/inspection/pdf'
                  label="Inspection Report"
                  backgroundColor="#444C38"
                  minWidth={200}
                  esn={esn}
                  manufactureStageOptions={manufactureStageOptions}
                  onClick={onClick}
    />
  );
};

export default InspectionReportButton;