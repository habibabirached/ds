import React from "react";
import {
  Grid,
  Button,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
} from "@mui/material";
import {
  FirstPage,
  LastPage,
  ArrowBackIos,
  ArrowForwardIos,
} from "@mui/icons-material";

import Badge from "@mui/material/Badge";
import { styled } from "@mui/material/styles";

const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: "#44b700",
    color: "#44b700",
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
  },
  "@keyframes ripple": {
    "0%": {
      transform: "scale(.8)",
      opacity: 1,
    },
    "100%": {
      transform: "scale(2.4)",
      opacity: 0,
    },
  },
}));

const ImageListComponent = ({
  imageList,
  selectedImageIndex,
  select360Image,
  getThumbnailUrl,
  first360Image,
  prev360Image,
  next360Image,
  last360Image,
}) => (
  <Grid item md={2}>
    <div
      align="center"
      style={{ marginTop: -35, fontWeight: "bold", maxWidth: 300 }}
    >
      <h3
        style={{
          paddingTop: 10,
          color: "white",
          backgroundColor: "#003839",
          paddingBottom: 10,
        }}
      >
        {"360-degree Images Roster"}
      </h3>
      <Button
        variant="contained"
        size="small"
        style={{
          minWidth: 50,
          marginBottom: 5,
          marginTop: -15,
          backgroundColor: "seagreen",
          color: "white",
        }}
        onClick={first360Image}
      >
        <FirstPage />
      </Button>
      <Button
        variant="contained"
        size="small"
        style={{
          marginLeft: 5,
          marginBottom: 5,
          marginTop: -15,
          backgroundColor: "seagreen",
          color: "white",
        }}
        onClick={prev360Image}
      >
        <ArrowBackIos />
      </Button>
      <Button
        variant="contained"
        size="small"
        style={{
          marginLeft: 5,
          marginTop: -15,
          marginBottom: 5,
          backgroundColor: "seagreen",
          color: "white",
        }}
        onClick={next360Image}
      >
        <ArrowForwardIos />
      </Button>
      <Button
        variant="contained"
        size="small"
        style={{
          minWidth: 50,
          marginLeft: 5,
          marginTop: -15,
          marginBottom: 5,
          backgroundColor: "seagreen",
          color: "white",
        }}
        onClick={last360Image}
      >
        <LastPage />
      </Button>
    </div>
    <Paper style={{ maxHeight: 900, maxWidth: 300, overflow: "auto" }}>
      <List
        dense
        sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}
      >
        {imageList.map((item, index) => (
          <ListItem
            alignItems="flex-start"
            key={index}
            selected={selectedImageIndex === index}
            onClick={() => select360Image(index)}
          >
            <ListItemAvatar>
              <StyledBadge
                overlap="circular"
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                variant="dot"
              >
                <Avatar src={getThumbnailUrl(item.id)} alt={`id# ${item.id}`} />
              </StyledBadge>
            </ListItemAvatar>
            <ListItemText
              primary={item.location}
              fontWeight="bold"
              secondary={` ${item?.distance?.toFixed(1)} m`}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  </Grid>
);

export default ImageListComponent;
