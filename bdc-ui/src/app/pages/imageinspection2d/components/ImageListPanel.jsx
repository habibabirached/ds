// Importing necessary React and Material-UI components
import React from "react";
import {
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
} from "@mui/material";

/**
 * The ImageListPanel component displays a list of images as thumbnails.
 * Users can click on these thumbnails to select an image.
 *
 * Props:
 * - imageList: An array of image objects to display.
 * - selectedImageIndex: The index of the currently selected image.
 * - onSelectImage: A function that is called when an image is selected.
 */
const ImageListPanel = ({ imageList, selectedImageIndex, onSelectImage }) => {
  return (
    // The List component from Material-UI is used to render the list of images.
    <List
      dense
      sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}
    >
      {/* Mapping each image object in the imageList to a ListItem component. */}
      {imageList.map((item, index) => (
        // ListItem represents an individual image in the list.
        // The `key` is essential for React to handle the list efficiently.
        // `selected` is a boolean that Material-UI uses to apply the selected style.
        // The `onClick` event triggers the onSelectImage function, passing the index of the clicked item.
        <ListItem
          key={index}
          selected={selectedImageIndex === index}
          onClick={() => onSelectImage(index)}
        >
          {/* ListItemAvatar contains the image thumbnail. */}
          <ListItemAvatar>
            {/* Avatar is a Material-UI component that displays the image. */}
            {/* The src attribute is dynamically set to display the image's thumbnail. */}
            <Avatar
              src={`/api/image/${item.id}/thumbnail`}
              alt={`id# ${item.id}`}
            />
          </ListItemAvatar>

          {/* ListItemText displays text information about the image. */}
          {/* In this case, it shows the image's location and its z-distance. */}
          <ListItemText
            primary={item.location}
            secondary={`z = ${item?.distance?.toFixed(1)} m`}
          />
        </ListItem>
      ))}
    </List>
  );
};

// Exporting ImageListPanel to be used in other parts of the application.
export default ImageListPanel;
