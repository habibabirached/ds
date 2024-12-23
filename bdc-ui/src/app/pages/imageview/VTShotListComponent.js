import React from "react";
import InputLabel from "@mui/material/InputLabel";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import LastPageIcon from "@mui/icons-material/LastPage";

import {
  Grid,
  Button,
  Typography,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from "@mui/material";
import {
  FirstPage,
  LastPage,
  ArrowBackIos,
  ArrowForwardIos,
} from "@mui/icons-material";

const VTShotListComponent = ({
  showScreenshots,
  vtshotList,
  selectedVTShotListIndex,
  snapWidth,
  snapHeight,
  getVTShotImageFileUrl,
  getVTShotThumbnailUrl,
  select2DVTShot,
  firstVTShotImage,
  prevVTShotImage,
  nextVTShotImage,
  lastVTShotImage,
  getVTShotImageSubtitle,
  changeShowScreenshots,
}) =>
  showScreenshots && (
    <Grid
      item
      md={12}
      sy={{ m: 2 }}
      rowSpacing={2}
      columnSpacing={{ xs: 1, sm: 2, md: 3 }}
      marginTop={-2}
      style={{
        minWidth: 1600,
        maxWidth: 1600,
        minHeight: 1090,
        maxHeight: 1090,
        overflow: "auto",
        backgroundColor: "whitesmoke",
        boxShadow: `0 0 0 2px lightgray`,
      }}
    >
      <Typography
        align="center"
        style={{
          paddingTop: 10,
          paddingBottom: 10,
          marginBottom: 5,
          fontWeight: "bold",
          fontSize: 20,
          color: "white",
          backgroundColor: "#003839",
        }}
      >
        View 2D Snapshots @Z ={" "}
        {vtshotList[selectedVTShotListIndex]?.distance?.toFixed(1)} m
      </Typography>
      {vtshotList[selectedVTShotListIndex] == null && (
        <div>
          <Typography>
            <InputLabel style={{ fontWeight: "bold", fontSize: 25 }}>
              No 2D Snapshots for this 360 image
            </InputLabel>
          </Typography>
          <Button
            startIcon={<ViewInArOutlinedIcon />}
            style={{
              top: 150,
              fontWeight: "bolder",
              backgroundColor: "seagreen",
              color: "white",
              fontSize: 16,
            }}
            variant="contained"
            size="large"
            onClick={() => changeShowScreenshots(false)}
          >
            View 360
          </Button>
        </div>
      )}
      {vtshotList[selectedVTShotListIndex] != null && (
        <div>
          <img
            width={snapWidth}
            height={snapHeight}
            src={getVTShotImageFileUrl(vtshotList[selectedVTShotListIndex]?.id)}
          />
          <Grid item md={12} align="center">
            <Button
              variant="contained"
              size="large"
              style={{
                right: 490,
                marginTop: -750,
                backgroundColor: "seagreen",
              }}
              onClick={firstVTShotImage}
            >
              <FirstPageIcon /> First
            </Button>
            <Button
              variant="contained"
              size="large"
              style={{
                right: 480,
                marginTop: -750,
                backgroundColor: "seagreen",
              }}
              onClick={prevVTShotImage}
            >
              <ArrowBackIosIcon />
            </Button>
            <Button
              variant="contained"
              size="large"
              style={{
                left: 600,
                marginTop: -750,
                backgroundColor: "seagreen",
              }}
              onClick={nextVTShotImage}
            >
              <ArrowForwardIosIcon />
            </Button>
            <Button
              variant="contained"
              size="large"
              style={{
                left: 610,
                marginTop: -750,
                backgroundColor: "seagreen",
              }}
              onClick={lastVTShotImage}
            >
              Last <LastPageIcon />
            </Button>
            <Button
              startIcon={<ViewInArOutlinedIcon />}
              style={{
                left: 480,
                marginTop: -100,
                fontWeight: "bolder",
                backgroundColor: "seagreen",
                color: "white",
                fontSize: 16,
              }}
              variant="contained"
              size="large"
              onClick={() => changeShowScreenshots(false)}
            >
              View 360
            </Button>
          </Grid>
        </div>
      )}
      <ImageList
        align="left"
        cols={vtshotList.length}
        gap={5}
        rowHeight={180}
        style={{ marginTop: -15 }}
      >
        {vtshotList.map((item, index) => (
          <ImageListItem key={item.id} align="center">
            <div>
              <img
                style={{
                  maxWidth: 200,
                  maxHeight: 100,
                  border: "4px solid",
                  borderColor:
                    selectedVTShotListIndex === index ? "royalblue" : "white",
                }}
                className="roll"
                src={getVTShotThumbnailUrl(item.id)}
                alt={`id# ${item.id}`}
                loading="lazy"
                onClick={() => select2DVTShot(index)}
              />
              <ImageListItemBar
                title={getVTShotImageSubtitle(item)}
                subtitle="{pitch, yaw, hfov}"
                position="below"
              />
            </div>
          </ImageListItem>
        ))}
      </ImageList>
    </Grid>
  );

export default VTShotListComponent;
