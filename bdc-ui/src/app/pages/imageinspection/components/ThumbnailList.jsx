// Importing necessary React and Material-UI components
import React from "react";
import { ImageList, ImageListItem, ImageListItemBar } from "@mui/material";

/**
 * ThumbnailList component displays a list of image thumbnails.
 * When a thumbnail is clicked, it notifies the parent component.
 *
 * Props:
 * - images: An array of objects representing the images. Each object should have at least 'src' and 'alt' properties.
 * - onImageSelect: A function called when an image thumbnail is selected.
 */
const ThumbnailList = ({ images, onImageSelect }) => {
  return (
    // The ImageList component from Material-UI organizes the thumbnails in a grid.
    <ImageList sx={{ width: 500, height: 450 }} cols={3}>
      {/* Mapping through the images array to create an ImageListItem for each image */}
      {images.map((img, index) => (
        // ImageListItem represents a single thumbnail in the grid.
        <ImageListItem key={img.src} onClick={() => onImageSelect(index)}>
          {/* The image is displayed using an img element. */}
          {/* 'src' is the image source URL, and 'alt' is the alternative text for the image. */}
          <img
            src={img.src}
            alt={img.alt}
            loading="lazy"
            style={{ cursor: "pointer" }} // Change cursor to indicate the image is clickable.
          />
          {/* ImageListItemBar can be used to add a title or subtitle to the thumbnail. */}
          {img.title && <ImageListItemBar title={img.title} />}
        </ImageListItem>
      ))}
    </ImageList>
  );
};

// Exporting ThumbnailList for use in other parts of the application.
export default ThumbnailList;
