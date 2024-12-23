import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { TextField, Button, Modal, Box, Typography, List, ListItem, Link, MenuItem, Paper } from '@mui/material';
import { useNavigate } from "react-router-dom";
import NavigateBeforeOutlinedIcon from "@mui/icons-material/NavigateBeforeOutlined";

const DownloadBladeVideos = () => {
  const [bladeNumber, setBladeNumber] = useState('');
  const [bladeOptions, setBladeOptions] = useState([]);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [links, setLinks] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);

  const [visitedFiles, setVisitedFiles] = useState(() => {
    // Retrieve from local storage if available
    const saved = localStorage.getItem('visitedFiles');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    // Save visited files to local storage on update
    localStorage.setItem('visitedFiles', JSON.stringify([...visitedFiles]));
  }, [visitedFiles]);

  function markUrlAsVisited(fileName) {
    setVisitedFiles(prev => new Set(prev).add(fileName));
  }

  const clearSearchItems = () => {
    setBladeNumber('');
    setFilteredOptions([]);
    setLinks({});
    setSearched(false);
  }
 
  useEffect(() => {
    const fetchBladeOptions = async () => {
      try {
        const response = await axios.get('api/s3_input_files_list');
        if (response.data && response.data.blades) {
          setBladeOptions(response.data.blades);
        }
      } catch (error) {
        console.error('Error fetching blade options:', error);
      }
    };
 
    fetchBladeOptions();
  }, []);
 
  const handleInputChange = (event) => {
    const query = event.target.value;
    setBladeNumber(query);
    if (query) {
      const filtered = bladeOptions.filter(option =>
        option.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10); // Limit to 10 options
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions([]);
    }
  };
 
  const handleSearch = async () => {
    if (!bladeNumber) {
      setModalMessage('Please select a blade');
      setModalOpen(true);
      return;
    }
    setLinks({});
    setFilteredOptions([]);
    setSearched(false);
    setIsSearching(true);
 
    try {
      const response = await axios.get(`api/s3_input_files_urls/${bladeNumber}`);
      if (response.data) {
        setLinks(Object.fromEntries(
          Object.entries(response.data).filter(
            ([key, value]) => !value.includes('blade_upload_log.txt')
          )
        ));
        setSearched(true);
      } else {
        setModalMessage('Data not available for this blade');
        setModalOpen(true);
      }
    } catch (error) {
      setModalMessage('Data not available for this blade');
      setModalOpen(true);
    } finally {
      setIsSearching(false);
    }
};

  const extractFilename = (key) => {
    const parts = key.split('/');
      return `${parts[parts.length - 5]}/${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
  };

  return (
    <>
      <NavigateBeforeOutlinedIcon
        onClick={() => {
          localStorage.removeItem('visitedFiles')
          navigate(`/home`);
        }}
        style={{ fontSize: 30, marginTop: "1px" }}
      />
      <Box
        sx={{
          marginTop: "30px",
          bgcolor: "rgba(0,0,0,0.1)",
          p: 4,
          width: "100%",
          minHeight: "80%",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        <Box
          sx={{
            p: 4,
            maxWidth: 600,
            mx: "auto",
            mt: searched ? 4 : "auto",
            mb: searched ? 0 : "auto",
            bgcolor: "background.paper",
            boxShadow: 3,
            borderRadius: 2,
            position: searched ? "relative" : "absolute",
            top: searched ? "auto" : "50%",
            left: searched ? "auto" : "50%",
            transform: searched ? "none" : "translate(-50%, -50%)",
          }}
        >
          <Typography variant="h5" sx={{ mb: 2 }}>
            Search Videos by Blade Number
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <TextField
              label="Blade Number"
              variant="outlined"
              value={bladeNumber}
              onChange={handleInputChange}
              sx={{ flexGrow: 1, mr: 2 }}
              autoComplete="off"
            />
            <Box sx={{ display: "flex", justifyContent: "space-between", p: 1, gap: 2, }}>
              <Button
                variant="contained"
                style={{ backgroundColor: "#137577" }}
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? "Searching..." : "Search"}
              </Button>
              <Button
                variant="contained"
                style={{ backgroundColor: "#137577" }}
                onClick={clearSearchItems}
              >
                Clear
              </Button>
            </Box>
          </Box>
          {filteredOptions.length > 0 && (
            <Paper sx={{ maxHeight: 200, overflow: "auto" }}>
              {filteredOptions.map((option, index) => (
                <MenuItem key={index} onClick={() => setBladeNumber(option)}>
                  {option}
                </MenuItem>
              ))}
            </Paper>
          )}
          {Object.keys(links).length > 0 && (
            <List>
              {Object.entries(links).map(([fileName, url], index) => (
                <ListItem key={index}>
                <a 
                  href={url} 
                  target="_blank" 
                  style={{ color: visitedFiles.has(extractFilename(fileName)) ? 'purple' : 'blue' }}
                  onClick={() => markUrlAsVisited(extractFilename(fileName))}
                >
                  {extractFilename(fileName)}
                </a>
              </ListItem>
              ))}
            </List>
          )}
          <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                p: 4,
                bgcolor: "background.paper",
                boxShadow: 24,
                borderRadius: 2,
              }}
            >
              <Typography>{modalMessage}</Typography>
              <Button onClick={() => setModalOpen(false)} sx={{ mt: 2 }}>
                Close
              </Button>
            </Box>
          </Modal>
        </Box>
      </Box>
    </>
  );
};
 
export default DownloadBladeVideos;