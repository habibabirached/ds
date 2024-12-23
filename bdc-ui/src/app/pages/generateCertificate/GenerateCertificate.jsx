import {React,useState} from 'react';
import { useNavigate } from 'react-router-dom';
import NavigateBeforeOutlinedIcon from "@mui/icons-material/NavigateBeforeOutlined";
import { Grid, Select, MenuItem, FormControl, InputLabel ,TextField,Typography,Button,Container} from '@mui/material';
import { styled } from '@mui/material/styles';
import { BLADE_CAVITIES, BLADE_TYPE_OPTIONS, FACTORY_NAME_OPTIONS, INSPECTION_LOCATION_OPTIONS, SUPPLIER_OPTIONS } from '../../config';

 
const ContainerStyled = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
}));
 
const ButtonStyled = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

const bladeTypeOptions= BLADE_TYPE_OPTIONS;
const supplierOptions = SUPPLIER_OPTIONS;

const factoryLocationOptions = INSPECTION_LOCATION_OPTIONS;
  const factoryNameOptions = FACTORY_NAME_OPTIONS;
  const bladeAreasInspectedOptions= BLADE_CAVITIES;
  const inspectionModalityOptions=['Aerones'];
  const inspectionEquipmentOptions=['Crawler'];
 
const GenerateCertificate = () => {
    const [isFieldEmpty, setIsFieldEmpty] = useState(false);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        blade_type: '',
        blade_serial_number: '',
        supplier_name: '',
        factory_location: '',
        factory_name: '',
        manufacture_date: '',
        inspection_modality: '',
        inspection_equipment: '',
        blade_areas_inspected: [],
        inspection_date: '',
        inspector_name: '',
        certification_date: '',
        report_creation_date: '',
        reason_for_deviation: '',
      });
     
      const handleChange = (e) => {
        const { name, value } = e.target;
        if(name==="reason_for_deviation"){
            setIsFieldEmpty(value.trim() === '');
        }
        setFormData({ ...formData, [e.target.name]: e.target.value });
      };

      const handleSubmit = async () => {
        try {
            if(formData["reason_for_deviation"]===''){
                setIsFieldEmpty(true);
                return;
            }
            console.log("certificate data generated====>",formData);
          const response = await fetch('api/certificate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
          if (response.ok) {
            console.log('Form Data ', formData);
            const pdfResponse = await fetch(`api/certificate/pdf?esn=${formData.blade_serial_number}`);
            const blob = await pdfResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'certificate.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
          } else {
            console.error('Failed to create certificate');
          }
        } catch (error) {
          console.error('Error:', error);
        }
      };
  return (
    <>
     <div>
           <NavigateBeforeOutlinedIcon
            onClick={() =>{
              navigate(`/home`)
            }}
             style={{ display: "grid", alignItems: "center", fontSize: 30 }}
            />
             <Typography
              style={{ fontSize: 25, paddingTop: 20, paddingBottom: 20 }}
             >
             Generate Certificate
           </Typography>
           </div>
    <ContainerStyled>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={2.4}>
          {/* <TextField label="Blade Type" fullWidth /> */}
          <FormControl fullWidth>
                <InputLabel id="blade-type-label">Blade Type</InputLabel>
                <Select
                    labelId="blade-type-label"
                    name="blade_type"
                    value={formData.blade_type}
                    onChange={handleChange}
                    label="Blade Type"
                >
                    {bladeTypeOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                            {option}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <TextField label="Blade Serial Number" 
          name="blade_serial_number" 
          value={formData.blade_serial_number} 
          onChange={handleChange} fullWidth />
        </Grid>
        <Grid item xs={12} sm={2.4}>
          {/* <TextField label="Supplier Name" fullWidth /> */}
          <FormControl fullWidth>
                <InputLabel id="supplier-label">Supplier Name</InputLabel>
                <Select
                    labelId="supplier-label"
                    name="supplier_name"
                    value={formData.supplier_name}
                    onChange={handleChange}
                    label="Supplier Name"
                >
                    {supplierOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                            {option}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Grid>
        <Grid item xs={12} sm={2.4}>
          {/* <TextField label="Factory Location" fullWidth /> */}
          <FormControl fullWidth>
                <InputLabel id="factory-location-label">Factory Location</InputLabel>
                <Select
                    labelId="factory-location-label"
                    name="factory_location"
                    value={formData.factory_location}
                    onChange={handleChange}
                    label="Factory Location"
                >
                    {factoryLocationOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                            {option}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Grid>
        <Grid item xs={12} sm={2.4}>
          {/* <TextField label="Factory Name" fullWidth /> */}
          <FormControl fullWidth>
                <InputLabel id="factory-name-label">Factory Name</InputLabel>
                <Select
                    labelId="factory-name-label"
                    name="factory_name"
                    value={formData.factory_name}
                    onChange={handleChange}
                    label="Factory Name"
                >
                    {factoryNameOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                            {option}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <TextField label="Manufacture Date" type="date"
           name="manufacture_date" 
           value={formData.manufacture_date} 
           onChange={handleChange} 
          InputLabelProps={{ shrink: true }} fullWidth />
        </Grid>
        <Grid item xs={12} sm={2.4}>
          {/* <TextField label="Inspection Modality" fullWidth /> */}
          <FormControl fullWidth>
                <InputLabel id="inspection-modality-label">Inspection Modality</InputLabel>
                <Select
                    labelId="inspection-modality-label"
                    name="inspection_modality"
                    value={formData.inspection_modality}
                    onChange={handleChange}
                    label="Inspection Modality"
                >
                    {inspectionModalityOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                            {option}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Grid>
        <Grid item xs={12} sm={2.4}>
          {/* <TextField label="Inspection Equipment" fullWidth /> */}
          <FormControl fullWidth>
                <InputLabel id="inspection-equipment-label">Inspection Equipment</InputLabel>
                <Select
                    labelId="inspection-equipment-label"
                    name="inspection_equipment"
                    value={formData.inspection_equipment}
                    onChange={handleChange}
                    label="Inspection Equipment"
                >
                    {inspectionEquipmentOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                            {option}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Grid>
        <Grid item xs={12} sm={2.4}>
          {/* <TextField label="Blade Areas Inspected" fullWidth /> */}
          <FormControl fullWidth>
                <InputLabel id="blade-areas-inspected-label">Blade Areas Inspected</InputLabel>
                <Select
                    labelId="blade-areas-inspected-label"
                    multiple
                    name="blade_areas_inspected"
                    value={formData.blade_areas_inspected}
                    onChange={handleChange}
                    label="Blade Areas Inspected"
                >
                    {bladeAreasInspectedOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                            {option}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <TextField label="Inspection Date" type="date" 
          name="inspection_date" 
          value={formData.inspection_date} 
          onChange={handleChange}
          InputLabelProps={{ shrink: true }} fullWidth />
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <TextField label="Inspector Name (SSO)" 
          name="inspector_name" 
          value={formData.inspector_name} 
          onChange={handleChange}
          fullWidth />
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <TextField label="Certificate Date" type="date" 
          name="certification_date" 
          value={formData.certification_date} 
          onChange={handleChange}
          InputLabelProps={{ shrink: true }} fullWidth />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Reason for Deviation" 
          name="reason_for_deviation" 
          value={formData.reason_for_deviation} 
          onChange={handleChange}
          error={isFieldEmpty}
          helperText={isFieldEmpty ? '*This field is mandatory' : ''}
          fullWidth multiline rows={4} />
        </Grid>
        <Grid item xs={12}>
        <Button variant="contained" color="primary" onClick={handleSubmit}>Generate Certificate</Button>
        </Grid>
      </Grid>
    </ContainerStyled>
    </>
  );
};
 
export default GenerateCertificate;