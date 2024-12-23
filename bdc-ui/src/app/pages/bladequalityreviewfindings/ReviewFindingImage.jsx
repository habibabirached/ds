import React, { useState, useEffect } from "react";
import { Typography, Box, Slider } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import NavigateBeforeOutlinedIcon from "@mui/icons-material/NavigateBeforeOutlined";
import { Gallery } from "react-grid-gallery";
import { searchDefectList } from "../../services/defect_api";

function getDefectImageUrl(defectId, includeAnnotations = true) {
  return `/api/defect/${defectId}/image_file?includeAnnotations=${includeAnnotations}&ts=${new Date().getTime()}`;
}

function ReviewFindingImageGallery() {
  const [searchParams] = useSearchParams();
  const [defectList, setDefectList] = useState([]);
  const [images, setImages] = useState([]);
  const [thumbnailSize, setThumbnailSize] = useState(170); // Default thumbnail size
  const [page, setPage] = useState(1); // Pagination state
  const imagesPerPage = 20; // Number of images per page
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDefects = async () => {
      try {
        const esn = searchParams.get("esn"); // Get the Blade Serial Number
        const defectData = await searchDefectList(esn); // Fetch defect data

        // Calculate the range of images to fetch based on the page number
        const startIndex = (page - 1) * imagesPerPage;
        const endIndex = startIndex + imagesPerPage;
        const limitedDefects = defectData.slice(startIndex, endIndex);

        // Transform defect data into gallery-compatible image objects
        const formattedImages = limitedDefects.map((defect) => ({
          src: getDefectImageUrl(defect.id, true),
          thumbnail: getDefectImageUrl(defect.id, true),
          caption: `ID: ${defect.id}, Type: ${defect.finding_type}, Status: ${defect.status}`,
          isSelected: false,
          customData: defect, // Attach entire defect object if needed
        }));

        setDefectList(defectData);
        setImages(formattedImages);
      } catch (error) {
        console.error("Error fetching defects:", error);
      }
    };

    fetchDefects();
  }, [searchParams, page]); // Re-fetch when `page` or `searchParams` changes

  const handleThumbnailSizeChange = (event, newValue) => {
    setThumbnailSize(newValue);
  };

  return (
    <div className="bladequality">
      <div>
        <div className="indicatorReviewTitle" style={{ fontSize: 20 }}>
          <NavigateBeforeOutlinedIcon
            className="backButton"
            onClick={() => navigate(`/bladequality?esn=${searchParams.get("esn")}`)}
            style={{
              display: "grid",
              alignItems: "center",
              fontSize: 30,
              margin: 5,
              color: "seagreen",
              borderColor: "seagreen",
              fontWeight: "bold",
            }}
          />
        </div>
      </div>
      {/* Section to display blade details */}
      <div style={{ marginLeft: 12, paddingTop: 20 }}>
        <span style={{ fontSize: 20 }}>
          Blade Serial Number:{" "}
          <span style={{ fontWeight: "bold" }}>{searchParams.get("esn")}</span>{" "}
        </span>
      </div>

      {/* Slider for thumbnail size */}
      <div style={{ marginTop: 20, padding: "0 12px" }}>
        <Typography gutterBottom>Adjust Thumbnail Size</Typography>
        <Slider
          value={thumbnailSize}
          onChange={handleThumbnailSizeChange}
          min={50}
          max={300}
          step={10}
          valueLabelDisplay="auto"
        />
      </div>

      {/* Image Gallery */}
      <div style={{ marginTop: 20, padding: "0 12px" }}>
        <Gallery
          images={images}
          rowHeight={thumbnailSize} // Dynamically sets thumbnail height
          enableImageSelection={false} // Disable image selection if not needed
        />
      </div>

      {/* Pagination Controls */}
      <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: "10px" }}>
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          style={{
            padding: "10px 20px",
            backgroundColor: page === 1 ? "lightgray" : "seagreen",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: page === 1 ? "not-allowed" : "pointer",
          }}
        >
          Previous
        </button>
        <Typography variant="h6">Page {page}</Typography>
        <button
          disabled={defectList.length <= page * imagesPerPage}
          onClick={() => setPage(page + 1)}
          style={{
            padding: "10px 20px",
            backgroundColor: defectList.length <= page * imagesPerPage ? "lightgray" : "seagreen",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: defectList.length <= page * imagesPerPage ? "not-allowed" : "pointer",
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default ReviewFindingImageGallery;
