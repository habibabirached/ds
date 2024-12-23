import { Button } from "@mui/material";
import React from "react";

export default function InputButton() {

    const fileInput = React.useRef();
  
    return (
      <div>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={()=>fileInput.current.click()}
        >
          upload file
        </Button>
  
        <input 
          ref={fileInput} 
          type="file" 
          style={{ display: 'none' }} 
        />
      </div>
    );
  }
  
