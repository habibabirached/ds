import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Checkbox, Typography, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useNavigate } from "react-router-dom";
import NavigateBeforeOutlinedIcon from "@mui/icons-material/NavigateBeforeOutlined";
import { BASE_URL } from '../../services/api_config';
const useStyles = makeStyles({
    container: {
        height: 400,
        width: '100%',
        marginBottom: 20,
    },
    headerContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: 20,
    },
    dialogContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '26px',
        width: '500px',
    },
});

const DataGridComponent = () => {
    const classes = useStyles();
    const [rows, setRows] = useState([]);
    const [open, setOpen] = useState(false);
    const [newData, setNewData] = useState({
        bladeType: '', bladeTypeId: null, defectModels: []
        // , aiEnabled: false 
    });
    const [isEdit, setIsEdit] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [bladeTypes, setBladeTypes] = useState([]);
    const [defectModels, setDefectModels] = useState([]);
    const [openDelete, setOpenDelete] = useState(false);
    const [updatedRows, setUpdatedRows] = useState([]);
    const [shouldSend,setShouldSend]=useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchBladeTypes();
        fetchDefectModels();
        fetchData();
    }, []);
     
    const validateSelection = async () => {
        try {
          const response = await fetch(`${BASE_URL}/ai_model_list`);
          const data = await response.json();
            console.log("data=====",data);
          const selectedBladeType = data.filter(row => row.blade_type === newData.bladeType);
          if (selectedBladeType.length === 0) {
            alert('Please provide correct blade type details');
            return false;
          }
      
          const validDefectModels = selectedBladeType.map(row => row.defect_model_id);
          const invalidDefectModels = newData.defectModels.filter(dm => !validDefectModels.includes(dm));
      
          if (invalidDefectModels.length > 0) {
            alert('This defect model is not associated with this blade type');
            return false;
          }
      
          return true;
        } catch (error) {
          console.error('Error validating selection:', error);
          return false;
        }
      };
    const fetchBladeTypes = async () => {
        try {
            const response = await fetch(`${BASE_URL}/blade_type_list`);
            const data = await response.json();
            setBladeTypes(data);
        } catch (error) {
            console.error('Error fetching blade types:', error);
        }
    };

    const fetchDefectModels = async () => {
        try {
            const response = await fetch(`${BASE_URL}/defect_model_list`);
            const data = await response.json();
            console.log('defect model data====', data);
            setDefectModels(data);
        } catch (error) {
            console.error('Error fetching defect models:', error);
        }
    };
    const fetchData = async () => {
        try {
            const response = await fetch(`${BASE_URL}/ai_model_list`);
            const data = await response.json();
            setRows(data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleToggleAiEnabled = (row) => {
        const updatedRow = { ...row, ai_enabled: !row.ai_enabled };
        setRows((prevRows) =>
            prevRows.map((r) => (r.id === row.id ? updatedRow : r))
        );
        setUpdatedRows((prevUpdatedRows) => {
            const existingRow = prevUpdatedRows.find((r) => r.id === row.id);
            if (existingRow) {
                return prevUpdatedRows.map((r) => (r.id === row.id ? updatedRow : r));
            } else {
                return [...prevUpdatedRows, updatedRow];
            }
        });
    };

    const handleSaveChanges = async () => {
        // const userConfirmed = window.confirm("Do you want to check your selection again? Changes are irreversible.");
        //     if (!userConfirmed) {
        //     return;
        //     }
        try {
            console.log("Updated rows======>", updatedRows);
            const response = await fetch(`${BASE_URL}/ai_model_update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedRows),
            });
            const data = await response.json();
            console.log('Updated data:', data);
            window.alert("Changes saved successfully!");
            setShouldSend(true);
            setUpdatedRows([]);
            fetchData(); // Refresh the data
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    const sendToAI = async () => {
        const userConfirmed = window.confirm("Do you want to check your selection again? Changes are irreversible.");
        if (!userConfirmed) {
          return;
        }
        try {
          const response = await fetch(`${BASE_URL}/ai_s3_upload`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          const data = await response.json();
          console.log('Response:', data);
          window.alert("Config Uploaded successfully!");
          setShouldSend(false);
        } catch (error) {
          console.error('Error uploading to AI:', error);
        }
      };
    
      


    const handleAddData = async () => {
        if (!newData.bladeTypeId) {
            alert('Please select a blade type');
            return;
        }
        if (newData.defectModels.length === 0) {
            alert('Please select at least one defect model');
            return;
        }
        console.log('newData========>', newData);
        try {
            const response = await fetch(`${BASE_URL}/ai_model_add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bladeId: newData.bladeTypeId,
                    modelIds: newData.defectModels
                }),
            });
            const data = await response.json();
            console.log('APIData========>', data);
            // setRows([...rows, data]);
            setOpen(false);
            setShouldSend(true);
            setNewData({
                bladeType: '', bladeTypeId: null, defectModels: []
                // , aiEnabled: false 
            });
            fetchData();
        } catch (error) {
            console.error('Error adding data:', error);
        }
    };
 
    const handleDeleteData = async () => {
        if (!await validateSelection()) return;
        if (!newData.bladeTypeId) {
          alert('Please select a blade type');
          return;
        }
        const confirmDelete = window.confirm('Are you sure you want to delete? Changes are irreversible');
        if (!confirmDelete) return;
        try {
            console.log("====", newData.bladeTypeId)
            const response = await fetch(`${BASE_URL}/ai_model_add`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bladeId: newData.bladeTypeId }),
            });
            const data = await response.json();
            setOpenDelete(false);
            setShouldSend(true);
            setNewData({ bladeType: '', bladeTypeId: null, defectModels: [] });
            fetchData();
        } catch (error) {
          console.error('Error deleting data:', error);
        }
      };
    const columns = [
        { field: 'blade_type', headerName: 'Blade Type', width: 150 },
        { field: 'defect_model', headerName: 'Defect Model', width: 150 },
        // { field: 'ai_enabled', headerName: 'AI Enabled', width: 150, type: 'boolean' }
        {
            field: 'ai_enabled',
            headerName: 'AI Enabled',
            width: 150,
            renderCell: (params) => (
                <Checkbox
                    checked={params.value}
                    onChange={() => handleToggleAiEnabled(params.row)}
                />
            ),
        }

    ];


    return (
        <div>
            <div>
                <NavigateBeforeOutlinedIcon
                    onClick={() => {
                        navigate(`/home`);
                    }}
                    style={{ fontSize: 30 }}
                />
                <div className={classes.headerContainer}>
                    <Typography style={{ fontSize: 25 }}>
                        AI Models
                    </Typography>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        {updatedRows.length > 0 && (
                            <Button variant="contained" color="primary" onClick={handleSaveChanges}>
                                Save Changes
                            </Button>
                        )}

                        <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
                            Add Data
                        </Button>
                        <Button variant="contained" color="secondary" onClick={() => setOpenDelete(true)}>
                            Delete Data
                        </Button>
                        {shouldSend && (
                             <Button variant="contained" color="primary" onClick={sendToAI}>Upload Config</Button>
                        )}
                    </div>
 
                </div>
            </div>
            <div className={classes.container}>
                <DataGrid rows={rows} columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: {
                                pageSize: 20,
                            },
                        },
                    }}
                    pageSizeOptions={[5]}
                    disableRowSelectionOnClick
                    autoHeight
                    disableColumnMenu={false}
                // pageSize={5}
                />
            </div>
            <Dialog open={open} onClose={() => setOpen(false)} >
                <DialogTitle>Add New Data</DialogTitle>
                <DialogContent className={classes.dialogContent}>
                    <FormControl style={{ marginTop: '15px' }} fullWidth>
                        <InputLabel id="bladeType-label" style={{marginTop:'-5px'}}>Blade Type</InputLabel>
                        <Select
                            labelId="bladeType-label"
                            name="bladeType"
                            value={newData.bladeType}
                            onChange={(e) => {
                                const selectedBladeType = bladeTypes.find(bt => bt.blade_type === e.target.value);
                                setNewData({ ...newData, bladeType: e.target.value, bladeTypeId: selectedBladeType.id });
                            }}
                            style={{height:'45px'}}
                        >
                            {bladeTypes.map((option) => (
                                <MenuItem key={option.id} value={option.blade_type}>
                                    {option.blade_type}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel id="defectModel-label" style={{marginTop:'-5px'}}>Defect Model</InputLabel>
                        <Select
                            labelId="defectModel-label"
                            name="defectModels"
                            multiple
                            value={newData.defectModels}
                            onChange={(e) => setNewData({ ...newData, defectModels: e.target.value })}
                            style={{height:'45px'}}
                        >
                            {defectModels.map((option) => (
                                <MenuItem key={option.id} value={option.id}>
                                    {option.defect_name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => {
                        setNewData({
                            bladeType: '', bladeTypeId: null, defectModels: []
                            // , aiEnabled: false
                        })
                        setOpen(false)
                    }} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleAddData} color="primary">
                        Add
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
                <DialogTitle>Delete Data</DialogTitle>
                <DialogContent className={classes.dialogContent}>
                    <FormControl style={{ marginTop: '15px' }} fullWidth>
                        <InputLabel id="bladeType-label" style={{marginTop:'-5px'}}>Blade Type</InputLabel>
                        <Select labelId="bladeType-label" style={{height:'45px'}} name="bladeType" value={newData.bladeType} onChange={(e) => {
                            const selectedBladeType = bladeTypes.find(bt => bt.blade_type === e.target.value);
                            setNewData({ ...newData, bladeType: e.target.value, bladeTypeId: selectedBladeType.id });
                        }}>
                            {bladeTypes.map((option) => (
                                <MenuItem key={option.id} value={option.blade_type}> {option.blade_type} </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setNewData({ bladeType: '', bladeTypeId: null, defectModels: [] }); setOpenDelete(false); }} color="primary"> Cancel </Button>
                    <Button onClick={handleDeleteData} color="secondary"> Delete </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default DataGridComponent;