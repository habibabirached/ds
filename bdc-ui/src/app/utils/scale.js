/**
 * Scales points plotted on an original image to a new size.
 * The points are assumed to be coordinates (x, y) within an array at annotationContent.shapes[0].points,
 * based on an image size defined by annotationContent.imageHeight and annotationContent.imageWidth.
 * This function scales the points to fit a new image size of 768x1024 pixels, adjusting each point's
 * x and y coordinates based on the ratio of new size to original size, and updates the points in-place
 * within the annotationContent.shapes[0].points array, allowing accurate mapping onto the new dimensions.
 *
 * @param {Object} annotationContent - The content containing the shapes and image dimensions.
 */
export function scalePointsToNewSize(annotationContent) {
  console.log('scalePointsToNewSize() called.')
  const originalHeight = annotationContent.imageHeight;
  const originalWidth = annotationContent.imageWidth;

  // Define the new dimensions we want to scale to
  const newHeight = 768;
  const newWidth = 1024;

  let xFactor = 1;
  if (newWidth != null)
    xFactor = newWidth/originalWidth;
  let yFactor = 1;
  if (newHeight != null)
    yFactor = newHeight/originalHeight;

  console.log(`scale factors: xFactor: ${xFactor}, yFactor: ${yFactor}`);

  // Iterate over each point in the shapes[0].points array
  for (let i = 0; i < annotationContent.shapes[0].points.length; i++) {
    // Extract the current point
    let point = annotationContent.shapes[0].points[i];

    // Scale the x-coordinate
    let scaledX = Math.round(point[0] * xFactor);

    // Scale the y-coordinate
    let scaledY = Math.round(point[1] * yFactor);

    // Replace the original point with the new, scaled point
    annotationContent.shapes[0].points[i] = [scaledX, scaledY];
  }

  // The annotationContent.shapes[0].points are now updated with the scaled points
}
