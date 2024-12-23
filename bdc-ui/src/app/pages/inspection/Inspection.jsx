import './Inspection.css';
import { useState, useEffect, Suspense } from 'react';
import { useParams } from "react-router-dom";
import Loading from '../../components/Loading';

import { TextField, FormControl, FormLabel, Button, Typography, Stack, Card, Grid, Divider } from '@mui/material';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';

import dayjs from 'dayjs';
import { getInspectionById, getInspectionImageList, updateInspection } from '../../services/inspection_api';
import { updateImage } from '../../services/image_api';

import { Pannellum } from "pannellum-react";

function Inspection() {

    const routeParams = useParams();
    const id = routeParams.id;
    console.log('Inspection id:',id);

    const emptyInspection = {
        "app_type": "",
        "customer_name": "",
        "date": new Date(),
        "disp": "",
        "engine_type": "",
        "esn": "",
        "id": id,
        "location": "",
        "misc": "",
        "sect": "",
        "sso": "",

        "blade_type":"",
        "manufacture_date":"",
        "factory_name":"",
        "inspector_name":"",
        "manufacture_stage":"",
        "certification_status":""
    }

    const formatDate = (date) => {
        return dayjs(date).format('YYYY-MM-DD');
    }

    const [inspectionData, setInspectionData] = useState(emptyInspection);
    const [imageList, setImageList] = useState([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const [appType, setAppType] = useState(emptyInspection.app_type || '');
    const [customerName, setCustomerName] = useState(emptyInspection.customer_name || '');
    const [inspectionDate, setInspectionDate] = useState( formatDate(new Date() || new Date()) );
    const [disp, setDisp] = useState(emptyInspection.disp || '');
    const [engineType, setEngineType] = useState(emptyInspection.engine_type || '');
    const [esn, setEsn] = useState(emptyInspection.esn || '');
    const [location, setLocation] = useState(emptyInspection.location || '');
    const [misc, setMisc] = useState(emptyInspection.misc || '');
    const [sect, setSect] = useState(emptyInspection.sect || '');
    const [sso, setSso] = useState(emptyInspection.sso || '');

    const [bladeType, setBladeType] = useState(emptyInspection.blade_type || '');
    const [manufactureDate, setManufactureDate] = useState(emptyInspection.manufacture_date || '');
    const [factoryName, setFactoryName] = useState(emptyInspection.factory_name || '');
    const [inspectorName, setInspectorName] = useState(emptyInspection.inspector_name || '');
    const [manufactureStage, setManufactureStage] = useState(emptyInspection.manufacture_stage || '');
    const [certificationStatus, setCertificationStatus] = useState(emptyInspection.certification_status || '');


    // Use this method If we want to keep all within a single json object...
    const handleInspectionDataChange = (event) => {
        const { name, value } = event.target;
        setInspectionData((inspectionData) => ({ ...inspectionData, [name]: value }));
    }
      

    const readInspectionData = (data) => {
        setInspectionData(data);
                
        setEsn(data['esn'] || '');
        setInspectionDate( formatDate(data['date'] || new Date()) );
        setCustomerName(data['customer_name'] || '');
        setLocation(data['location'] || '');
        setEngineType(data['engine_type'] || '');
        setAppType(data['app_type'] || '');
        setDisp(data['disp'] || '');
        setMisc(data['misc'] || '');
        setSect(data['sect'] || '');
        setSso(data['sso'] || '');

        setBladeType(data['blade_type'] || '');
        setManufactureDate(formatDate(data['manufacture_date'] || new Date()) );
        setFactoryName(data['factory_name'] || '');
        setInspectorName(data['inspector_name'] || '');
        setManufactureStage(data['manufacture_stage'] || '');
        setCertificationStatus(data['certification_status'] || '');
        
    }
    
    // called after the component is created
    useEffect(() => {
      async function fetchData() {
        try {
            const data = await getInspectionById(id);
            console.log('Read Inspection data:',data);
            if (data != null && data.id > 0) {
                console.log('set inspection data...');
                readInspectionData(data);

                const imgListData = await getInspectionImageList(id);
                console.log('Read image list data:',imgListData);
                if (imgListData != null && imgListData.length > 0) {
                    console.log('set image list...');
                    setImageList(imgListData);
                }
            }
        } catch (error) {
          console.log(error);
        }
      }
  
      fetchData();
      // no return function.
      // we could return a cleanup function here.
    }, [id]);
    

    const handleSubmit = async (event) => {
        event.preventDefault();

        const inspectionBody =  {
            "app_type": appType,
            "customer_name": customerName,
            "date": inspectionDate,
            "disp": disp,
            "engine_type": engineType,
            "esn": esn,
            "location": location,
            "misc": misc,
            "sect": sect,
            "sso": sso,

            "blade_type": bladeType,
            "manufacture_date": manufactureDate,
            "factory_name": factoryName,
            "inspector_name": inspectorName,
            "manufacture_stage": manufactureStage,
            "certification_status": certificationStatus

        };

        let inspectionResp = await updateInspection(id, inspectionBody);
       
        const selectedImage = imageList[selectedImageIndex];
        const imageBody = {
            "blade_id": selectedImage.blade_id,
            "defect_desc": selectedImage.defect_desc,
            "defect_location": selectedImage.defect_location,
            "defect_severity": selectedImage.defect_severity,
            "defect_size": selectedImage.defect_size,
            "distance": selectedImage.distance,
            "inspection_id": selectedImage.inspection_id,
            "timestamp": selectedImage.timestamp
        }

        let imageResp = await updateImage(selectedImage.id, imageBody);

        alert(`Updated inspection record: ${await inspectionResp.text()} image record: ${await imageResp.text()}`);
        //todo: save data back to the form
    }

    const getImageUrl = (id) => {
        return `/api/image/${id}/file`
    }

    const getThumbnailUrl = (id) => {
        return `/api/image/${id}/thumbnail`
    }


 
    return (
      <Grid container sx={{ m: 2 }} className="Inspection">
   
        <Suspense fallback={<Loading />}>
            
            <Grid container sx={{ m: 2 }} rowSpacing={4} columnSpacing={{ xs: 2, sm: 3, md: 4 }}>
                <form onSubmit={handleSubmit}>
               
                    <Grid item md={12} >
                        <FormControl>
                            <FormLabel>ESN</FormLabel>
                            <TextField size='small' value={esn} onChange={(e) => setEsn(e.target.value) }> </TextField>
                        </FormControl>
                        <FormControl>
                            <FormLabel>Inspection Date</FormLabel>
                            <TextField type="date" InputLabelProps={{ shrink: true }} size='small' value={inspectionDate} onChange={ (e) => setInspectionDate(formatDate(e.target.value)) }>  </TextField>
                        </FormControl>
                        <FormControl>
                            <FormLabel>Customer</FormLabel>
                            <TextField size='small' value={customerName || ''} onChange={ (e) => setCustomerName(e.target.value) }>  </TextField>
                        </FormControl>
                   
                        <FormControl>
                            <FormLabel>Location</FormLabel>
                            <TextField size='small' value={location || ''} onChange={ (e) => setLocation(e.target.value) }>  </TextField>
                        </FormControl>
                    </Grid>

                    <Grid item md={12} sy={{ m: 2 }}>
                        <FormControl>
                            <FormLabel>Engine Type</FormLabel>
                            <TextField size='small' value={engineType || ''} onChange={ (e) => setEngineType(e.target.value) }> </TextField>
                        </FormControl>

                        <FormControl>
                            <FormLabel>App Type</FormLabel>
                            <TextField size='small' value={appType || ''} onChange={ (e) => setAppType(e.target.value) }> </TextField>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Disp</FormLabel>
                            <TextField size='small' value={disp || ''} onChange={ (e) => setDisp(e.target.value) }> </TextField>
                        </FormControl>
                    </Grid>

                    <Grid item md={12} sy={{ m: 2 }}>
                        <FormControl>
                            <FormLabel>Misc</FormLabel>
                            <TextField size='small' value={misc || ''} onChange={ (e) => setMisc(e.target.value) }> </TextField>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Sect</FormLabel>
                            <TextField size='small' value={sect || ''} onChange={ (e) => setSect(e.target.value) }> </TextField>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Sso</FormLabel>
                            <TextField size='small' value={sso || ''} onChange={ (e) => setSso(e.target.value) }> </TextField>
                        </FormControl>
                        
                    </Grid>

                    <Grid item md={12} sy={{ m: 2 }}>
                        <FormControl>
                            <FormLabel>Blade Type</FormLabel>
                            <TextField size='small' value={bladeType || ''} onChange={ (e) => setBladeType(e.target.value) }> </TextField>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Manufacture Date</FormLabel>
                            <TextField size='small' value={manufactureDate || ''} onChange={ (e) => setManufactureDate(e.target.value) }> </TextField>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Factory Name</FormLabel>
                            <TextField size='small' value={factoryName || ''} onChange={ (e) => setFactoryName(e.target.value) }> </TextField>
                        </FormControl>
                        
                    </Grid>

                    <Grid item md={12} sy={{ m: 2 }}>
                        <FormControl>
                            <FormLabel>Inspector Name</FormLabel>
                            <TextField size='small' value={inspectorName || ''} onChange={ (e) => setInspectorName(e.target.value) }> </TextField>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Manufacture Stage</FormLabel>
                            <TextField size='small' value={manufactureStage || ''} onChange={ (e) => setManufactureStage(e.target.value) }> </TextField>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Certification Status</FormLabel>
                            <TextField size='small' value={certificationStatus || ''} onChange={ (e) => setCertificationStatus(e.target.value) }> </TextField>
                        </FormControl>
                        
                    </Grid>

                    
                    <Button className="saveButton" variant="outlined" color="secondary" type="submit">Save</Button>
                        
                </form>
            </Grid>

            <Grid container  sx={{ m: 2 }}  rowSpacing={2} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
            
                <Grid item md={8}>
                    {/* <img align="center"
                         width = "400"
                         height = "300"
                         src={getImageUrl(imageList[selectedImageIndex]?.id)}
                         alt={`id# ${selectedImageIndex}`}
                         loading="lazy"
                    /> */}
                    <Pannellum
                        width="100%"
                        height="500px"
                        image={getImageUrl(imageList[selectedImageIndex]?.id)}
                        hfov={100}
                        haov={360}
                        yaw={0}
                        roll={30}
                        pitch={0}
                        autoLoad
                        onLoad={() => {
                            console.log(`image ${id} loaded`);
                        }}
                    />
                </Grid>
                <Grid item md={4}>
                    <form>    
                        <Stack>
                            <FormControl>
                                <FormLabel>Distance</FormLabel>
                                <TextField size='small' value={imageList[selectedImageIndex]?.distance.toFixed(2) || 0.0}></TextField>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Desc</FormLabel>
                                <TextField size='small' value={imageList[selectedImageIndex]?.defect_desc || ''}></TextField>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Location</FormLabel>
                                <TextField size='small' value={imageList[selectedImageIndex]?.defect_location || ''}></TextField>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Severity</FormLabel>
                                <TextField size='small' value={imageList[selectedImageIndex]?.defect_severity || ''}></TextField>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Size</FormLabel>
                                <TextField size='small' value={imageList[selectedImageIndex]?.defect_size || ''}></TextField>
                            </FormControl>
                        </Stack>
                    </form>
                </Grid>
            </Grid>                

            <Grid container sy={{ m: 2 }} rowSpacing={2} columnSpacing={{ xs: 1, sm: 2, md: 3 }} >
                <Divider />
            </Grid>
            
            <Grid container sy={{ m: 2 }} rowSpacing={2} columnSpacing={{ xs: 1, sm: 2, md: 3 }} >
                <ImageList  sx={{ m: 2 }} align="center" cols={Math.min(imageList.length,10)} gap={5} rowHeight={100}>
                    {imageList.map((item, index) => (
                        <ImageListItem key={item.id}>
                            <img src={getThumbnailUrl(item.id)}
                                 alt={`id# ${item.id}`}
                                 loading="lazy"
                                 onClick={() => setSelectedImageIndex(index)}
                            />
                            <ImageListItemBar
                                title={item.location}
                                subtitle={ `distance: ${item?.distance?.toFixed(1)} m`}
                                position="below"
                            />
                        </ImageListItem>
                    ))}
                </ImageList>
            </Grid>

        </Suspense>
        
      </Grid>
    );
  }
  
  export default Inspection;