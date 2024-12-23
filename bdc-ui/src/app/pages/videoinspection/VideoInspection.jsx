import './VideoInspection.css';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useParams } from "react-router-dom";
import Loading from '../../components/Loading';

import { TextField, FormControl, FormLabel, Button, Typography, Stack, Card, Grid, Divider } from '@mui/material';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';

import dayjs from 'dayjs';
import { getInspectionById, getInspectionImageList, updateInspection } from '../../services/inspection_api';
import { updateImage } from '../../services/image_api';

import { Pannellum, PannellumVideo } from "pannellum-react";

import {
    uploadImageFileAndMetadata,
  } from "../../services/inspection_api";

function VideoInspection() {

    const routeParams = useParams();
    const id = routeParams.id;
    console.log('Inspection id:',id);

    const emptyInspection = {
        "app_type": "",
        "customer_name": "",
        "date": new Date().toISOString(),
        "disp": "",
        "engine_type": "",
        "esn": "",
        "id": id,
        "location": "",
        "misc": "",
        "sect": "",
        "sso": ""
    }

    const emptyImage = {
        "blade_id": 1,
        "defect_desc": "",
        "defect_location": "",
        "defect_severity": "",
        "defect_size": 0,
        "distance": 0,
        "id": -1,
        "inspection_id": id,
        "timestamp": new Date().toISOString()
    }

    const formatDate = (date) => {
        return dayjs(date).format('YYYY-MM-DD');
    }

    const [inspectionData, setInspectionData] = useState(emptyInspection);
    const [imageList, setImageList] = useState([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // Inspection properties used in the form
    const [appType, setAppType] = useState(emptyInspection.app_type);
    const [customerName, setCustomerName] = useState(emptyInspection.customer_name);
    const [inspectionDate, setInspectionDate] = useState( formatDate(new Date()) );
    const [disp, setDisp] = useState(emptyInspection.disp);
    const [engineType, setEngineType] = useState(emptyInspection.engine_type);
    const [esn, setEsn] = useState(emptyInspection.esn);
    const [location, setLocation] = useState(emptyInspection.location);
    const [misc, setMisc] = useState(emptyInspection.misc);
    const [sect, setSect] = useState(emptyInspection.sect);
    const [sso, setSso] = useState(emptyInspection.sso);

    // Defect properties used in the form
    const [defectDesc, setDefectDesc] = useState(emptyImage.defect_desc);
    const [defectLocation, setDefectLocation] = useState(emptyImage.defect_location);
    const [defectSeverity, setDefectSeverity] = useState(emptyImage.defect_severity);
    const [defectSize, setDefectSize] = useState(emptyImage.defect_size);
    const [distance, setDistance] = useState(emptyImage.distance);

    // Use this method If we want to keep all within a single json object...
    const handleInspectionDataChange = (event) => {
        const { name, value } = event.target;
        setInspectionData((inspectionData) => ({ ...inspectionData, [name]: value }));
    }
      
    const selectImage = (index) => {
        console.log('selectImage() called for:',index);
    
        if (index >=0) {
            setSelectedImageIndex(index);

            let selectedImage = imageList[selectedImageIndex];
            if (selectedImage != null) {
                setDistance(selectedImage.distance);
                setDefectDesc(selectedImage.defect_desc);
                setDefectLocation(selectedImage.defect_location);
                setDefectSeverity(selectedImage.defect_severity);
                setDefectSize(selectedImage.defect_size);
            }
            console.log('selected image:',selectedImage);
        }
    }

    const unpackInspectionData = (data) => {
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
    }
    
    const fetchImageList = async () => {
        console.log('fetchCurrentImageList()');
        const imgListData = await getInspectionImageList(id);
        console.log('Read image list:',imgListData);
        if (imgListData != null && imgListData.length > 0) {
            console.log('set image list...');
            sortListByDistance(imgListData);
            console.log('sotted image list:',imgListData);
            setImageList(imgListData);
        }
        // update defect data in UI form
        selectImage(selectedImageIndex);

    }

    // in place sort
    const sortListByDistance = (data) => {
        data = data.sort((a, b) => {
            if (! a.distance) a.distance = 0;
            if (! b.distance) b.distance = 0;
            return a.distance - b.distance;
          });
    }

    // called after the component is created
    useEffect(() => {

      async function fetchInspectionData() {
        try {
            const data = await getInspectionById(id);
            console.log('Read Inspection data:',data);
            if (data != null && data.id > 0) {
                console.log('set inspection data...');
                unpackInspectionData(data);
                await fetchImageList();
            }

            // Set the url only after receiving the inspection data from the server, to prevent
            // re-rendering
            setInspectionVideoUrl("/videos/Sample-360-video.mp4");


        } catch (error) {
          console.log(error);
        }
      }
  
      console.log('useEffect()');
      fetchInspectionData();
      // no return function.
      // we could return a cleanup function here.

    }, [id]);
    

    const handleInspectionSubmit = async (event) => {
        event.preventDefault();
        console.log('handleInspectionSubmit()');
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
            "sso": sso
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
       
    }

    const handleDefectSubmit = async (event) => {
        event.preventDefault();
        console.log('handleDefectSubmit()');
        const selectedImage = imageList[selectedImageIndex];
        selectedImage.defect_desc = defectDesc;
        selectedImage.defect_loc = defectLocation;
        selectedImage.defect_severity = defectSeverity;
        selectedImage.defect_size = defectSize;
        selectedImage.distance = distance;

        const imageBody = {
            "blade_id": inspectionData.blade_id,
            "defect_desc": defectDesc,
            "defect_location": defectLocation,
            "defect_severity": defectSeverity,
            "defect_size": defectSize,
            "distance": distance,
            "inspection_id": inspectionData.id,
        }
        console.log('new image body:',imageBody);
        let imageResp = await updateImage(selectedImage.id, imageBody);

        alert(`Updated inspection image record: ${await imageResp.text()}`);

        await fetchImageList();
    }


    const getImageUrl = (id) => {
        return `/api/image/${id}/file`
    }

    const getThumbnailUrl = (id) => {
        return `/api/image/${id}/thumbnail`
    }

    // ============================= Video Helpers ================================

    const [inspectionVideoUrl, setInspectionVideoUrl] = useState("");
    const panVideoRef = useRef(); // pannello video
    const canvasRef = useRef(); // canvas where screenshot is saved
 
    const WIDTH = 600;
    const HEIGHT = 400;
    
    const videoWidth = String(WIDTH);
    const videoHeight = String(HEIGHT);

    // take a snapshot of the video
    const snapPannellumVideo = () => {
        console.log('snapPannellum() called');

        const dimensions = {w: WIDTH, h: HEIGHT};     

        let videoInsidePannellumRef = document.getElementById("360video_html5_api");
        console.log('pannellum video tag:', videoInsidePannellumRef); 

        let canvas2DContext = canvasRef.current.getContext('2d');
      
        if (canvas2DContext && videoInsidePannellumRef) {
            console.log('dimensions:', dimensions);
            canvas2DContext.fillRect(0, 0, dimensions.w, dimensions.h);
            canvas2DContext.drawImage(videoInsidePannellumRef, 0, 0, dimensions.w, dimensions.h);
        }
    }

    const emptyImageMeta = {
        "image_id": "",
        "image_ts": new Date().toISOString(),
        "image_distance": 0.0,
        "defect_severity": "",
        "defect_location": "",
        "defect_size": 0.0,
        "defect_desc": "",
        "image_path": ""
    }

    const base64ToBytes = (base64) => {
        const binString = atob(base64);
        return Uint8Array.from(binString, (m) => m.codePointAt(0));
    }

    const snapPannellumVideoAndSave = async () => {
        console.log('snapPannellumVideoAndSave() called');

        const dimensions = {w: WIDTH, h: HEIGHT};        

        let videoInsidePannellumRef = document.getElementById("360video_html5_api");
        console.log('pannellum video tag:', videoInsidePannellumRef); 

        if (videoInsidePannellumRef) {
            let canvas = document.createElement('canvas');
            canvas.width = dimensions.w;
            canvas.height = dimensions.h;
            console.log('dimensions:', dimensions);

            let context2d = canvas.getContext('2d');
            context2d.fillStyle = "rgb(0, 0, 0)";
            context2d.fillRect(0, 0, dimensions.w, dimensions.h);
            context2d.drawImage(videoInsidePannellumRef, 0, 0, dimensions.w, dimensions.h);

            let dataUrlContent = canvas.toDataURL("image/png");
            let bareImageContent = dataUrlContent.replace('data:image/png;base64,', '');
            let metadataContent = JSON.stringify(emptyImageMeta);
            
            //TODO: handle .jpg files here
            let imageMetaFile = new File([metadataContent], "snapshot.json", {type: "application/json", lastModified: new Date()});
            let imageFile = new File([base64ToBytes(bareImageContent)], "snapshot.png", {type: "image/png", lastModified: new Date()});
            let bladeId = 1;
            let inspectionId = id;
            let filename = imageFile.name;

            let resp = {};
            if (imageMetaFile != null && imageFile != null) {
              resp = await uploadImageFileAndMetadata(
                inspectionId,
                bladeId,
                imageFile,
                imageMetaFile
              );
              console.log("resp:", resp);
            } else {
              console.log("skip upload of: ", filename);
            }
            
            let imageId = resp["image_id"];
            
            if (imageId != null) {
                await fetchImageList();
            } else {
                console.log('could not find new imageId');
            }

        }
    }

    // ============================= End Video Helpers ==============================
 
    return (
      <Grid container sx={{ m: 2 }} className="Inspection">
   
        <Suspense fallback={<Loading />}>
            
            <Grid container sx={{ m: 2 }} rowSpacing={4} columnSpacing={{ xs: 2, sm: 3, md: 4 }}>
                <form onSubmit={handleInspectionSubmit}>
               
                    <Grid item md={12} >
                        <FormControl>
                            <FormLabel>ESN</FormLabel>
                            <TextField size='small' value={esn || ''} onChange={(e) => setEsn(e.target.value) }> </TextField>
                        </FormControl>
                        <FormControl>
                            <FormLabel>Inspection Date</FormLabel>
                            <TextField type="date" InputLabelProps={{ shrink: true }} size='small' value={inspectionDate || new Date()} onChange={ (e) => setInspectionDate(formatDate(e.target.value)) }>  </TextField>
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

                    <Button className="saveButton" variant="outlined" color="secondary" type="submit"> Save Inspection2 </Button>
                        
                </form>

                <a href={`api/inspection/${id}/xls`} download="report.xlsx" target='_blank'>
                    <Button
                        variant="contained"
                        size="small"
                        style={{ marginLeft: 16 }}
                    >
                    Get Report
                    </Button>
                </a>

            </Grid>

             {/* =================================== Begin Video Snapshots ============================================ */}

            <Grid container sx={{ m: 2 }} rowSpacing={4} columnSpacing={{ xs: 2, sm: 3, md: 4 }}>
                
                <PannellumVideo
                    id="360video"
                    ref={panVideoRef}
                    width={videoWidth}
                    height={videoHeight}
                    video={inspectionVideoUrl}
                    pitch={10}
                    yaw={180}
                    hfov={140}
                    minHfov={50}
                    maxHfov={180}
                    controls={true}
                    autoplay={false}
                    muted={true}
                    onError={err => {
                        console.log("Error", err);
                    }}
                    onMousedown={evt => {
                        console.log("Mouse Down", evt);
                        //console.log('viewer: ', videoRef?.current?.getViewer());
                    }}
                    
                />
            </Grid>
           
            
            <Grid container sx={{ m: 2 }} rowSpacing={4} columnSpacing={{ xs: 2, sm: 3, md: 4 }}>

                    <Button onClick={snapPannellumVideoAndSave}> Save snapshot </Button>
                    
            </Grid>


            {/* =================================== End Video Snapshots ============================================ */}


            <Grid container  sx={{ m: 2 }}  rowSpacing={2} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
            
                <Grid item md={8}>
 
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
                    <form onSubmit={handleDefectSubmit} >    
                        <Stack>
                            <FormControl>
                                <FormLabel>Distance</FormLabel>
                                <TextField size='small' value={distance.toFixed(2) || 0.0} onChange={ (e) => setDistance( parseFloat(e.target.value) ) }></TextField>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Desc</FormLabel>
                                <TextField size='small' value={defectDesc || ''} onChange={ (e) => setDefectDesc(e.target.value) }></TextField>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Location</FormLabel>
                                <TextField size='small' value={defectLocation || ''} onChange={ (e) => setDefectLocation(e.target.value) }></TextField>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Severity</FormLabel>
                                <TextField size='small' value={defectSeverity || ''} onChange={ (e) => setDefectSeverity(e.target.value) }></TextField>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Size</FormLabel>
                                <TextField size='small' value={defectSize.toFixed(2) || 0.0} onChange={ (e) => setDefectSize(parseFloat(e.target.value)) }></TextField>
                            </FormControl>
                        </Stack>

                        <Button className="saveButton" variant="outlined" color="secondary" type="submit"> Save Defect </Button>

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
                                 onClick={() => selectImage(index)}
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
  
  export default VideoInspection;