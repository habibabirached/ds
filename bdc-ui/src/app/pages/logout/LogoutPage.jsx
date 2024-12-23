import "./LogoutPage.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import React from "react";



function LogoutPage() {

    const [showMessage, setShowMessage] = useState(true);
    const navigate = useNavigate();
  
    useEffect(() => {
      
      if (localStorage.getItem("loggedSSO") !== '') {
        localStorage.removeItem("loggedSSO");
        localStorage.clear();
        console.log("remove item from localStorage");
      }

      // Clear sessionStorage
      sessionStorage.clear();
      console.log("Cleared sessionStorage");

      const timer = setTimeout(() => {
        setShowMessage(false);
        window.location.href = '/api/logoff';
      }, 15000); 
  
      return () => clearTimeout(timer); 
    }, [navigate]);
  
    return (
      showMessage && ( 
        <div className="unauthorized-message">
        <p>The user is not authorized and will be logged off.</p>
        <p>Please login to <a href="https://oneidm.ge.com/faces/modules/my_groups/distribution_lists_join.xhtml">OneIDM</a> and request access to one of the following distribution lists:</p>
        <ul>
          <li>@GE Vernova ONW Digital Blade Certification Users</li>
          <li>@GE Vernova TPI Digital Blade Certification Users</li>
          <li>@GE Vernova LM Digital Blade Certification Users</li>
        </ul>
      </div>
      )
      
    );
}
export default LogoutPage;
