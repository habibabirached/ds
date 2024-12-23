// Importing necessary React and Material-UI components
import React from "react";
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from "@mui/material";

/**
 * The MeasurementListPanel component displays a list of measurement items.
 * Users can select a measurement to view or edit further details.
 *
 * Props:
 * - measurementList: An array of measurement objects to be displayed.
 * - selectedMeasurementIndex: The index of the currently selected measurement.
 * - onSelectMeasurement: A function called when a measurement is selected.
 */
const MeasurementListPanel = ({
  measurementList,
  selectedMeasurementIndex,
  onSelectMeasurement,
}) => {
  return (
    // The List component from Material-UI is used to render the list of measurements.
    <List
      dense
      sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}
    >
      {/* Mapping each measurement object in the measurementList to a ListItem component. */}
      {measurementList.map((item, index) => (
        // ListItem represents an individual measurement in the list.
        // The `key` is essential for React to handle the list efficiently.
        // `selected` is a boolean that Material-UI uses to apply the selected style.
        // The `onClick` event triggers the onSelectMeasurement function, passing the index of the clicked item.
        <ListItem
          key={index}
          selected={selectedMeasurementIndex === index}
          onClick={() => onSelectMeasurement(index)}
        >
          {/* ListItemAvatar contains an icon or image associated with the measurement. */}
          <ListItemAvatar>
            <Avatar>
              {/* Placeholder text, can be replaced with an image or icon */}M
            </Avatar>
          </ListItemAvatar>

          {/* ListItemText displays text information about the measurement. */}
          {/* In this case, it's a generic description. Customize as needed. */}
          <ListItemText
            primary={`Measurement ${index + 1}`}
            secondary={item.description || "No description available"}
          />
        </ListItem>
      ))}
    </List>
  );
};

// Exporting MeasurementListPanel to be used in other parts of the application.
export default MeasurementListPanel;
