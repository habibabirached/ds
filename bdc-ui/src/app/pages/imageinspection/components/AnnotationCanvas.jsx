// Importing necessary React hooks for managing references and side effects
import React, { useRef, useEffect } from "react";

/**
 * AnnotationCanvas component provides a canvas over an image where users can draw annotations.
 *
 * Props:
 * - src: The source URL of the image to be annotated.
 * - onSave: A callback function that gets triggered when annotations are saved.
 */
const AnnotationCanvas = ({ src, onSave }) => {
  // useRef is used to get a reference to the canvas and image elements
  const canvasRef = useRef(null);
  const imageRef = useRef(new Image());

  // useEffect hook to load the image and set up the canvas once the component is mounted
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Setting up the image to be loaded into the canvas
    const image = imageRef.current;
    image.src = src;
    image.onload = () => {
      // Adjusting canvas size to match the image
      canvas.width = image.width;
      canvas.height = image.height;

      // Drawing the image onto the canvas
      context.drawImage(image, 0, 0, image.width, image.height);
    };
  }, [src]); // useEffect dependency array includes src to react to changes in the image source

  // Function to handle the saving of annotations
  // In a real-world scenario, this function would need to gather the annotations data
  // and potentially format it before calling onSave
  const handleSave = () => {
    // Calling onSave with the canvas data URL, which contains the image and drawings
    onSave(canvasRef.current.toDataURL());
  };

  return (
    <div>
      {/* Displaying the canvas */}
      <canvas ref={canvasRef} style={{ border: "1px solid black" }}></canvas>
      {/* Button to trigger save functionality */}
      <button onClick={handleSave}>Save Annotation</button>
    </div>
  );
};

// Exporting AnnotationCanvas for use in other parts of the application
export default AnnotationCanvas;
