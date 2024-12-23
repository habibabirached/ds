import './Snapshot.css';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useParams } from "react-router-dom";
import Loading from '../../components/Loading';
import { ReactDOM } from 'react';

import { TextField, FormControl, FormLabel, Button, Typography, Stack, Card, Grid, Divider } from '@mui/material';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';

import dayjs from 'dayjs';
import { getInspectionById, getInspectionImageList, updateInspection } from '../../services/inspection_api';
import { updateImage } from '../../services/image_api';

import { Pannellum, PannellumVideo } from "pannellum-react";
import { gridColumnDefinitionsSelector } from '@mui/x-data-grid';

//import myVideo from "assets/videos/Sample-360-video.mp4";

function Video() {

    // const routeParams = useParams();
    // const id = routeParams.id;
    // console.log('Inspection id:',id);

    const WIDTH = 600;
    const HEIGHT = 400;

    const [videoWidth, setVideoWidth] = useState(String(WIDTH));
    const [videoHeight, setVideoHeight] = useState(String(HEIGHT));
    
    const panVideoRef = useRef();
    const videoRef = useRef();
    const canvasRef = useRef();
    const [dimensions, setDimensions] = useState({w: WIDTH, h: HEIGHT});
    const [videoInsidePannellumRef, setVideoInsidePannelumRef] = useState(null);

    let context;
    if (canvasRef.current) {
      context = canvasRef.current.getContext('2d');
    }

    // const getVideoSizeData = (videoRef) => {
    //     // const viewer = videoRef?.current?.getViewer();
    //     // const width =  viewer?.getWidth();
    //     // const height = viewer?.getHeight();

    //     const width = Number(videoRef.current.videoWidth);
    //     const height = Number(videoRef.current.videoHeight);

    //     const ratio = width / height;
    //     const w = width - 100;
    //     const h = parseInt(w / ratio, 10);
    //     return {
    //       ratio,
    //       w,
    //       h
    //     };
    // }

    // const getPanVideoSizeData = (video) => {
    //     // const viewer = videoRef?.current?.getViewer();
    //     // const width =  viewer?.getWidth();
    //     // const height = viewer?.getHeight();

    //     const width = video.width;
    //     const height = video.height;

    //     const ratio = width / height;
    //     const w = width - 100;
    //     const h = parseInt(w / ratio, 10);
    //     return {
    //       ratio,
    //       w,
    //       h
    //     };
    // }


    const snapPannellum = () => {
        if (context && videoInsidePannellumRef) {

          console.log('dimensions:', dimensions);

          context.fillRect(0, 0, dimensions.w, dimensions.h);
          //context.drawImage(videoRef.current.getViewer(), 0, 0, dimensions.w, dimensions.h);
          
          //context.drawImage(videoRef.current, 0, 0, dimensions.w, dimensions.h);
          
          //const videoInsidePannelum = document.getElementById('360video_html5_api');
          context.drawImage(videoInsidePannellumRef, 0, 0, dimensions.w, dimensions.h);
        }
    }

    useEffect(() => {
        console.log('useEffect() videoRef:',videoRef);
        console.log('useEffect panVideoRef:', panVideoRef);

        // if (videoRef.current) {
        //     videoRef.current.addEventListener('loadedmetadata', onVideoLoaded);
        // }

        //videoInsidePannelum = document.getElementById('360video_html5_api');
        //const videoInsidePannelum = document.querySelector("PannellumVideo.video");

        const videoNode = document.getElementById("360video_html5_api");
        // save video node reference
        setVideoInsidePannelumRef(videoNode);
        console.log('useEffect() pannellum video tag:', videoInsidePannellumRef); 
        configureCanvasDimensions()

        //videoInsidePannelum = ReactDOM.findDOMNode(videoNode)
       
        // we do not need this for pannellum because it has it own onLoad hook
        // if (videoInsidePannellum) {
        //     videoInsidePannellum.addEventListener('loadedmetadata', onVideoLoaded);
        // }


    }, []);

    // Update snapshot canvas dimensions when video is loaded
    const configureCanvasDimensions = () => {
        console.log('configureCanvasDimensions() called');
        //const { w, h } = getVideoSizeData(videoRef);


        //const { w, h } = getVideoSizeData(videoInsidePannellum);
        //const { w, h } = getPanVideoSizeData(videoInsidePannellum);
        
        const {w, h} = {w:videoWidth, h:videoHeight};

        canvasRef.current.width = w;
        canvasRef.current.height = h;
        let newDimensions = {
            w: w,
            h: h
        };

        console.log('updating dimensions:',newDimensions);
        setDimensions(newDimensions);
    }

    const showVideoDetails = () => {
        const viewer = videoRef?.current?.getViewer();
        console.log('showVideoDetails() pitch:', viewer?.getPitch(),'yaw:',viewer?.getYaw());
    }

    // photo is updated when we call takeScreenshot method
    //const [photo, takeScreenshot] = useScreenshot();
    //const takePhoto = () => takeScreenshot(videoRef.current);
    

    return (
      <Grid container sx={{ m: 2 }} className="Video">
   
        <Suspense fallback={<Loading />}>
            
            <Grid container sx={{ m: 2 }} rowSpacing={4} columnSpacing={{ xs: 2, sm: 3, md: 4 }}>
            
                {/* <img width="100" height="100" src="/logo512.png" /> */}
                
                {/* <video type="video/mp4" src="/videos/Sample-360-video.mp4">video goes here</video> */}
                
                {/* <video width="400" controls>
                    <source src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4"/>
                    Your browser does not support the video tag.
                </video> */}

                <br/>

                {/* <video ref={videoRef} width="400" controls>
                    <source src="/videos/Sample-360-video.mp4" type="video/mp4"/>
                    Your browser does not support the video tag.
                </video> */}
                
                <PannellumVideo
                    id="360video"
                    ref={panVideoRef}
                    width={videoWidth}
                    height={videoHeight}
                    video={"/videos/Sample-360-video.mp4"}
                    pitch={10}
                    yaw={180}
                    hfov={140}
                    minHfov={50}
                    maxHfov={180}
                    controls={true}
                    autoplay={false}
                    muted={true}
                    onLoad={() => {
                        console.log("onLoad(): Video loaded");
                        console.log('video ref:',this.myVideo);

                        // const videoNode = document.getElementById("360video_html5_api");
                        // setVideoInsidePannelumRef(videoNode);
                        // console.log('onLoad() videoInsidePannellum:', videoInsidePannellumRef); 
                        // configureCanvasDimensions();
                       
                    }}
                    onError={err => {
                        console.log("Error", err);
                    }}
                    onMousedown={evt => {
                        console.log("Mouse Down", evt);
                        console.log('viewer: ', videoRef?.current?.getViewer());
                    }}
                    
                />
            </Grid>
            
            <Grid container sx={{ m: 2 }} rowSpacing={4} columnSpacing={{ xs: 2, sm: 3, md: 4 }}>
                    {/* <Button onClick={showVideoDetails}>get video details</Button> */}
                    <Button onClick={snapPannellum}>take snapshot</Button>
                    
            </Grid>

            <Grid container sx={{ m: 2 }} rowSpacing={4} columnSpacing={{ xs: 2, sm: 3, md: 4 }}>
                    <canvas crossOrigin="anonymous" ref={canvasRef}/>
            </Grid>
            
           

        </Suspense>
        
      </Grid>
    );
  }
  
  export default Video;