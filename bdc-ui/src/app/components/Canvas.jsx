import React, { useMemo, useRef, useState, useEffect } from "react";
import PolygonAnnotation from "./PolygonAnnotation";
import { Stage, Layer, Image } from "react-konva";
import CanvasButton from "./CanvasButton";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import DrawOutlinedIcon from "@mui/icons-material/DrawOutlined";
import UndoIcon from "@mui/icons-material/Undo";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

import { defectLabels, defectColors } from "../config";

// Note: This code was adapted from: https://devmuscle.com/blog/react-konva-image-annotation

//const videoSource = "./space_landscape.jpg";
const wrapperStyle = {
  display: "flex",
  justifyContent: "center",
  marginTop: 20,
  backgroundColor: "aliceblue",
};
const columnStyle = {
  display: "flex",
  justifyContent: "center",
  flexDirection: "column",
  alignItems: "center",
  marginTop: 20,
  backgroundColor: "aliceblue",
};

// width and height must be numbers
const Canvas = ({
  src,
  alt,
  width,
  height,
  onSave,
  loadPoints,
  isLoading,
  loadPolygons,
  validationInfo,
  onPolygonSelect,
}) => {
  const [image, setImage] = useState();
  const imageRef = useRef(null);
  const dataRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [size, setSize] = useState({ imageWidth: width, imageHeight: height });
  const [flattenedPoints, setFlattenedPoints] = useState();
  const [position, setPosition] = useState([0, 0]);
  const [isMouseOverPoint, setMouseOverPoint] = useState(false);
  const [isPolyComplete, setPolyComplete] = useState(false);
  const [polygons, setPolygons] = useState([]); // added bH.
  const [checked, setChecked] = React.useState(false);
  const [showEditButtons, setShowEditButtons] = useState(false);
  const [isAnnotationMode, setAnnotationMode] = useState(false);
  const [selectedPolygonIndex, setSelectedPolygonIndex] = useState(null);

  // useEffect(() => {
  //   setPolygons([...polygons, { points: [[176, 501], [303, 372], [439, 518], [290, 619]], flattenedPoints: [176, 501, 303, 372, 439, 518, 290, 619], isComplete: true }]);
  // }, [])

  const imageElement = useMemo(() => {
    // console.log('src:',src);
    // console.log('width:',width);
    // console.log('height:',height);
    // console.log('alt:',alt);

    const element = new window.Image();
    element.src = src;
    element.alt = alt;
    element.width = width;
    element.height = height;

    console.log("created image:", element);

    return element;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, alt, width, height]); //it may come from redux so it may be dependency that's why I left it as dependecny...

  useEffect(() => {
    const onload = function () {
      setSize({
        imageWidth: imageElement.width,
        imageHeight: imageElement.height,
      });
      setImage(imageElement);
      imageRef.current = imageElement;
      console.log("image loaded size:", size);
      console.log("loadPoints:", loadPoints);
      console.log("loadPolygons: ", loadPolygons);
    };
    imageElement.addEventListener("load", onload);

    return () => {
      imageElement.removeEventListener("load", onload);
    };
  }, [imageElement]);

  useEffect(() => {
    // We consider saved annotations to be completed.
    if (loadPoints != null && Array.isArray(loadPoints) && false) {
      setPoints(loadPoints);
      console.log("setPolyComplete(true) line 93, loadPoints = ", loadPoints);
      setPolyComplete(true); // have to click edit to change polygon
      setAnnotationMode(false);
      setShowEditButtons(false); // Ensure buttons are hidden when the polygon is closed
    } else {
      // start with empty points
      setPoints([]);
      setPolyComplete(true);
      setShowEditButtons(false); // Ensure buttons are hidden when the polygon is closed
      setAnnotationMode(false); // Reset annotation mode when polygon is complete, so we can allow to right click inside polygons
    }

    if (loadPolygons != null) {
      setPolygons(loadPolygons);
      console.log(
        "I just loaded back the polygons: loadPolygons = ",
        loadPolygons
      );
    }
  }, [imageElement, loadPoints]);

  const getMousePos = (stage) => {
    return [stage.getPointerPosition().x, stage.getPointerPosition().y];
  };

  //drawing begins when mousedown or touchstart event fires.
  const [firstTouchDown, setFirstTouchDown] = useState(false);
  const [firstTouchDownXY, setFirstTouchDownXY] = useState([0, 0]);

  const handlePointerDown = (e) => {
    if (isPolyComplete) return;
    // Determine whether the event is from a touch device
    if (e.evt.touches) {
      e.evt.preventDefault(); // Prevents the default action of touch events
      const touch = e.evt.touches[0]; // Get the first touch
      const stage = e.target.getStage();
      // const touchPos = getMousePos(stage);
      const touchPos = {
        x: touch.clientX - stage.content.getBoundingClientRect().left,
        y: touch.clientY - stage.content.getBoundingClientRect().top,
      };
      const mousePos = [touchPos.x, touchPos.y];
      if (!firstTouchDown) {
        setFirstTouchDown(true);
        setFirstTouchDownXY(mousePos);
      }

      if (
        points.length >= 3 &&
        ((touchPos.x - firstTouchDownXY[0]) ^ 2) < 17 && // and the last touch iPad is on top of the first point.
        ((touchPos.y - firstTouchDownXY[1]) ^ 2) < 17
      ) {
        // add it to the polys
        setPolygons([
          ...polygons,
          {
            points: points,
            flattenedPoints: flattenedPoints,
            isComplete: true,
          },
        ]);
        setPoints([]);
        setFlattenedPoints([]);
        setPolyComplete(true);
        setAnnotationMode(false);
        setShowEditButtons(false); // Hide the buttons when polygon is closed
        setFirstTouchDown(false);
      } else {
        setPoints([...points, mousePos]);
        setPosition(mousePos);
      }
    }
  };

  //drawing begins when mousedown event fires.
  const handleMouseDown = (e) => {
    if (isPolyComplete) return;
    const stage = e.target.getStage();

    const mousePos = getMousePos(stage);
    console.log("refz_412 mousePos = ", mousePos, stage);
    if (isMouseOverPoint && points.length >= 3) {
      // add it to the polys
      setPolygons([
        ...polygons,
        { points: points, flattenedPoints: flattenedPoints, isComplete: true },
      ]);
      setPoints([]);
      setFlattenedPoints([]);
      setPolyComplete(true);
      setAnnotationMode(false);
      setShowEditButtons(false); // Ensure buttons are hidden when the polygon is closed
    } else {
      setPoints([...points, mousePos]);
    }
  };

  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    const mousePos = getMousePos(stage);
    setPosition(mousePos);
  };

  const getCategoryColor = (category) => {
    const index = defectLabels.indexOf(category);
    return index >= 0 ? defectColors[index % defectColors.length] : "#00F1FF"; // Default color if not found
  };

  const handleCategorySelect = (polygonIndex, category) => {
    const color = getCategoryColor(category); // Function to get color based on category
    setPolygons(
      polygons.map((polygon, index) => {
        if (index === polygonIndex) {
          return {
            ...polygon,
            category: category,
            defectName: category,
            color: color,
          };
        }
        return polygon;
      })
    );
  };

  // toto
  const handleVertexUpdate = (polygonIndex, vertexIndex, newPosition) => {
    const updatedPolygons = polygons.map((polygon, index) => {
      if (index === polygonIndex) {
        console.log("polygon.points = ", polygon.points);
        console.log("new position = ", newPosition);
        const updatedPoints = [...polygon.points];
        updatedPoints[vertexIndex] = newPosition;
        // Flatten the updated points to update the flattenedPoints array
        const updatedFlattenedPoints = updatedPoints.flat();

        // Return the updated polygon object with both updated points and flattenedPoints
        return {
          ...polygon,
          points: updatedPoints,
          flattenedPoints: updatedFlattenedPoints,
        };
      }
      return polygon;
    });

    setPolygons(updatedPolygons);
  };

  const handleCategorySelectMenu = (polygonIndex, category) => {};

  const toggleAnnotationsVisibility = (event) => {
    setPolygons(
      polygons.map((polygon) => ({
        ...polygon,
        makeInvisibleAnnotations: !polygon.makeInvisibleAnnotations, // Toggle the visibility
      }))
    );
    setChecked(event.target.checked);
  };

  const handleMouseOverStartPoint = (e) => {
    if (isPolyComplete || points.length < 3) return;
    e.target.scale({ x: 3, y: 3 });
    setMouseOverPoint(true);
  };

  const handleMouseOutStartPoint = (e) => {
    e.target.scale({ x: 1, y: 1 });
    setMouseOverPoint(false);
  };

  const handlePointDragMove = (e) => {
    const stage = e.target.getStage();
    const index = e.target.index - 1;
    const pos = [e.target._lastPos.x, e.target._lastPos.y];
    if (pos[0] < 0) pos[0] = 0;
    if (pos[1] < 0) pos[1] = 0;
    if (pos[0] > stage.width()) pos[0] = stage.width();
    if (pos[1] > stage.height()) pos[1] = stage.height();
    setPoints([...points.slice(0, index), pos, ...points.slice(index + 1)]);
  };

  useEffect(() => {
    setFlattenedPoints(
      points
        .concat(isPolyComplete ? [] : position)
        .reduce((a, b) => a.concat(b), [])
    );
  }, [points, isPolyComplete, position]);
  const undo = () => {
    setPoints(points.slice(0, -1));
    setPolyComplete(false);
    setShowEditButtons(true);
    setAnnotationMode(true); // Set annotation mode to true when annotating so that I cannot right click inside polygons when I am in annotation mode
    setPosition(points[points.length - 1]);
  };
  const measureDistance = () => {};
  const reset = () => {
    setPoints([]);
    setPolyComplete(true);
    setAnnotationMode(false);
    setShowEditButtons(false); // Ensure buttons are hidden when the polygon is closed
  };

  const edit = () => {
    console.log("points ==", points);
    setPolyComplete(false);
    setShowEditButtons(true); // Show the buttons when Annotate is clicked
    setAnnotationMode(true); // Set annotation mode to true when annotating so that I cannot right click inside polygons when I am in annotation mode
  };

  const handleGroupDragEnd = (e) => {
    //drag end listens other children circles' drag end event
    //...that's, why 'name' attr is added, see in polygon annotation part
    console.log("Here");
    if (e.target.name() === "polygon") {
      let result = [];
      let copyPoints = [...points];
      copyPoints.map((point) =>
        result.push([point[0] + e.target.x(), point[1] + e.target.y()])
      );
      e.target.position({ x: 0, y: 0 }); //needs for mouse position otherwise when click undo you will see that mouse click position is not normal:)
      setPoints(result);
    }
  };

  // Update position of the polygon group when dragged
  const handleGroupDragEnd2 = (e, pIndex) => {
    if (e.target.name() === "polygon") {
      // Calculate the new position of the group
      const newPosition = { x: e.target.x(), y: e.target.y() };
      console.log(newPosition);

      const updatedPolygons = polygons.map((polygon, index) => {
        if (index === pIndex) {
          const updatedPoints = polygon.points.map(([px, py]) => [
            px + newPosition.x,
            py + newPosition.y,
          ]);

          // Flatten the updated points to update the flattenedPoints array
          const updatedFlattenedPoints = updatedPoints.flat();

          // Return the updated polygon object with both updated points and flattenedPoints
          return {
            ...polygon,
            points: updatedPoints,
            flattenedPoints: updatedFlattenedPoints,
          };
        }
        return polygon;
      });

      setPolygons(updatedPolygons);
      // Reset the position of the polygon group
      e.target.position({ x: 0, y: 0 });
    }
  };

  const erasePolygon = (pIndex) => {
    console.log(pIndex);
    const updatedPolygons = polygons.map((polygon, index) => {
      if (index === pIndex) {
        // Return the updated polygon object with both updated points and flattenedPoints
        return {
          ...polygon,
          points: [],
          category: "",
          defectName: "",
          flattenedPoints: [],
        };
      }
      return polygon;
    });

    setPolygons(updatedPolygons);
  };

  // console.log("points ==>", points);
  // console.log("flattenedPoints ==>", flattenedPoints);
  // console.log("isPolyComplete ==>", isPolyComplete);

  const [selectedPolygon, setSelectedPolygon] = useState(null);

  const handlePolygonClick = (index) => {
    setSelectedPolygonIndex(index);
    const selected = polygons[index];
    console.log("Selected Polygon:", selected);
    setSelectedPolygon(selected);
    onPolygonSelect(selected, index);
  };

  return (
    <div style={wrapperStyle}>
      <div style={columnStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Button
            variant="outlined"
            style={{
              right: 150,
              marginTop: -15,
              marginBottom: 5,
              fontWeight: "bolder",
              borderWidth: "thick",
              color: "seagreen",
            }}
            onClick={edit}
          >
            <DrawOutlinedIcon /> Annotate
          </Button>
          {!showEditButtons && (
            <Button
              variant="outlined"
              style={{
                right: 150,
                marginTop: -15,
                marginBottom: 5,
                fontWeight: "bolder",
                borderWidth: "thick",
                color: "seagreen",
              }}
              onClick={measureDistance}
            >
              <DrawOutlinedIcon /> Measure Distance
            </Button>
          )}

          {showEditButtons && (
            <Button
              variant="outlined"
              style={{
                right: 150,
                marginTop: -15,
                marginLeft: 5,
                marginBottom: 5,
                fontWeight: "bolder",
                borderWidth: "thick",
                color: "red",
              }}
              onClick={undo}
            >
              <UndoIcon /> Undo
            </Button>
          )}
          {showEditButtons && (
            <Button
              variant="outlined"
              style={{
                right: 150,
                marginTop: -15,
                marginLeft: 5,
                marginBottom: 5,
                fontWeight: "bolder",
                borderWidth: "thick",
                color: "red",
              }}
              onClick={reset}
            >
              <RestartAltIcon /> Reset
            </Button>
          )}
          <Button
            variant="outlined"
            style={{
              right: 150,
              marginTop: -15,
              marginLeft: 5,
              marginBottom: 5,
              fontWeight: "bolder",
              borderWidth: "thick",
              color: "seagreen",
            }}
            onClick={() => {
              const saveData = {
                points: points,
                size: size,
                imgSrc: src,
                polygons: polygons,
              };
              console.log("validationInfo = ", validationInfo);

              if (validationInfo !== null) {
                saveData.validationInfo = validationInfo;
              }

              onSave(saveData);
            }}
          >
            <InsertDriveFileIcon /> Save
          </Button>
          <Button
            variant="outlined"
            style={{
              right: 150,
              marginTop: -15,
              marginLeft: 5,
              marginBottom: 5,
              fontWeight: "bolder",
              borderWidth: "thick",
              color: "grey",
            }}
            onClick={toggleAnnotationsVisibility}
          >
            Toggle Category display
          </Button>
          {/* <Button variant="text" onClick={() => {}}>
            New Cathegory
          </Button> */}

          {/* <CanvasButton name = "Annotate" onClick={edit}/>  
          <CanvasButton name = "Undo" onClick={undo}/>
          <CanvasButton name = "Reset" onClick={reset}/>
          <CanvasButton name = "Save" onClick={() => onSave({'points':points,'size':size, 'imgSrc':src})}/> */}
        </div>
        <Stage
          width={size.imageWidth || 650}
          height={size.imageHeight || 302}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onTouchStart={handlePointerDown}
        >
          <Layer>
            <Image
              ref={imageRef}
              image={image}
              x={0}
              y={0}
              width={size.imageWidth}
              height={size.imageHeight}
            />
            {!isLoading &&
              polygons.map((polygon, index) => (
                <PolygonAnnotation
                  AI={polygon.AI}
                  key={index}
                  polygonIndex={index}
                  points={polygon.points}
                  flattenedPoints={polygon.flattenedPoints}
                  isFinished={true}
                  color={polygon.AI == true ? "#ff0000" : "#ffffff"}
                  defectName={
                    polygon.AI == true
                      ? polygon.defectName + " (AI)"
                      : polygon.defectName
                  }
                  makeInvisibleAnnotations={polygon.makeInvisibleAnnotations}
                  erasePolygon={(polygonIndex) => erasePolygon(polygonIndex)}
                  isAnnotationMode={isAnnotationMode}
                  handleVertexUpdate={(
                    polygonIndex,
                    vertexIndex,
                    newPosition
                  ) =>
                    handleVertexUpdate(polygonIndex, vertexIndex, newPosition)
                  }
                  onCategorySelect={(category) =>
                    handleCategorySelect(index, category)
                  }
                  handleGroupDragEnd={(e) => handleGroupDragEnd2(e, index)}
                  onCategorySelectMenu={(category) =>
                    handleCategorySelectMenu(index, category)
                  }
                  onPolygonClick={handlePolygonClick}
                  isSelected={index === selectedPolygonIndex}
                />
              ))}

            <PolygonAnnotation
              color={"yellow"}
              points={points}
              flattenedPoints={flattenedPoints}
              handlePointDragMove={handlePointDragMove}
              handleGroupDragEnd={handleGroupDragEnd}
              handleMouseOverStartPoint={handleMouseOverStartPoint}
              handleMouseOutStartPoint={handleMouseOutStartPoint}
              isFinished={isPolyComplete}
              isAnnotationMode={isAnnotationMode}
            />
          </Layer>
        </Stage>
      </div>
      {/* <div
        ref={dataRef}
        style={{
          width: 375,
          height: 302,
          boxShadow: ".5px .5px 5px .4em rgba(0,0,0,.1)",
          marginTop: 20,
        }}
      >
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(points)}</pre>
      </div> */}
    </div>
  );
};

export default Canvas;
