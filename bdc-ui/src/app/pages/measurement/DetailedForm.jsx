// DetailedForm.jsx
import PropTypes from "prop-types";
import React from "react";
import {
  TextField,
  TextareaAutosize,
  FormControl,
  Typography,
  Select,
  MenuItem,
} from "@mui/material";
import { getMeasurementLocation } from "../../utils/utils";

/**
 * This function component renders a detailed form using a table layout, designed to capture and display various details.
 * Each row in the table corresponds to a different field of the form, with a label and an input element.
 * The form includes various input types like text fields, date selectors, and dropdown menus, each tailored for the specific data type it is meant to collect.
 * The layout is structured and organized, facilitating user interaction and data entry.
 * The use of Material-UI components enhances the user experience with a consistent and visually appealing design.
 */

const DetailedForm = ({
  getDefectId,
  formatDate,
  getMeasurementProp,
  setMeasurementProp,
  bladeSections,
  distances,
  updateRootFaceDistance,
  measurementSeverityTable,
  defectDispositionOptions,
  getDefectTolerance,
  updateDisposition,
  updateRepairDate,
  measurementData,
  statusOptions,
}) => {
  return (
    <table>
      <tbody>
        <tr>
          <td>
            <Typography>Indication Id</Typography>
          </td>
          <td>
            <FormControl>
              <TextField disabled={true} size="small" value={getDefectId()}>
                {" "}
              </TextField>
            </FormControl>
          </td>
          {/* </tr>
        <tr> */}
          <td>
            <Typography sx={{ marginLeft: 3 }}>Date </Typography>
          </td>
          <td>
            <FormControl>
              <TextField
                type="date"
                InputLabelProps={{ shrink: true }}
                size="small"
                value={formatDate(getMeasurementProp("date"))}
                onChange={(e) => setMeasurementProp("date", e.target.value)}
              ></TextField>
            </FormControl>
          </td>
        </tr>{" "}
        {/* row 1 */}
        <tr>
          <td>
            <Typography>Blade Section </Typography>
          </td>
          <td>
            <FormControl size="small">
              <Select
                id="location"
                value={getMeasurementLocation(measurementData.location)}
                onChange={(e) => setMeasurementProp("location", e.target.value)}
              >
                {bladeSections.map((section, index) => (
                  <MenuItem key={index} value={section}>
                    {" "}
                    {section}{" "}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </td>
          {/* </tr>
        <tr> */}
          <td>
            <Typography sx={{ marginLeft: 3 }}> Distance from Root </Typography>
          </td>
          <td>
            <FormControl size="small">
              <Select
                id="root_face_distance"
                value={getMeasurementProp("root_face_distance")}
                onChange={(e) => updateRootFaceDistance(e.target.value)}
              >
                {distances.map((dist, index) => (
                  <MenuItem key={index} value={dist}>
                    {" "}
                    {dist}{" "}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </td>
        </tr>{" "}
        {/* row 2 */}
 {/*       
        <tr>
          <td>
            <Typography> Indication Type </Typography>
          </td>
          <td>
            <FormControl size="small">
              <Select
                id="finding_type"
                value={getMeasurementProp("finding_type")}
                onChange={(e) =>
                  setMeasurementProp("finding_type", e.target.value)
                }
              >
                {Object.keys(measurementSeverityTable).map((key, index) => (
                  <MenuItem key={index} value={key}>
                    {" "}
                    {key}{" "}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </td>

          <td>
            <Typography sx={{ marginLeft: 3 }}>
              Indication Length (mm)
            </Typography>
          </td>
          <td>
            <FormControl>
              <TextField
                size="small"
                value={getMeasurementProp("length")}
                onChange={(e) => setMeasurementProp("length", e.target.value)}
              ></TextField>
            </FormControl>
          </td>
        </tr>
      
        <tr>
          <td>
            <Typography> Indication Width (mm) </Typography>
          </td>
          <td>
            <FormControl>
              <TextField
                size="small"
                value={getMeasurementProp("width")}
                onChange={(e) => setMeasurementProp("width", e.target.value)}
              ></TextField>
            </FormControl>
          </td>

          <td>
            <Typography sx={{ marginLeft: 3 }}>
              {" "}
              Distance Tolerance Spec (mm){" "}
            </Typography>
          </td>
          <td>
            <FormControl>
              <TextField size="small" value={getDefectTolerance()}></TextField>
            </FormControl>
          </td>
  
          <td>
            <Typography> Disposition </Typography>
          </td>
          <td>
            <FormControl size="small">
              <Select
                id="ge_disposition"
                value={getMeasurementProp("ge_disposition")}
                onChange={(e) => updateDisposition(e.target.value)}
              >
                {defectDispositionOptions.map((disp, index) => (
                  <MenuItem key={index} value={disp}>
                    {" "}
                    {disp}{" "}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </td>

          <td>
            <Typography sx={{ marginLeft: 3 }}>
              {" "}
              Disposition Provided By
            </Typography>
          </td>
          <td>
            <FormControl>
              <TextField
                size="small"
                value={getMeasurementProp("sso")}
                onChange={(e) => setMeasurementProp("sso", e.target.value)}
              ></TextField>
            </FormControl>
          </td>
        </tr>
        
        <tr>
          <td>
            <Typography> Repair Report Id</Typography>
          </td>
          <td>
            <FormControl>
              <TextField
                size="small"
                value={getMeasurementProp("repair_report_id") || ""}
                onChange={(e) =>
                  setMeasurementProp("repair_report_id", e.target.value)
                }
              ></TextField>
            </FormControl>

            <Typography sx={{ marginLeft: 3 }}> Repair Approved By</Typography>
          </td>
          <td>
            <FormControl>
              <TextField
                size="small"
                value={getMeasurementProp("repair_approved_by") || ""}
                onChange={(e) =>
                  setMeasurementProp("repair_approved_by", e.target.value)
                }
              ></TextField>
            </FormControl>
          </td>
        </tr>
  
        <tr>
          <td>
            <Typography> Repair Date</Typography>
          </td>
          <td>
            <FormControl>
              <TextField
                size="small"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formatDate(getMeasurementProp("repair_date"))}
                onChange={(e) => updateRepairDate(e.target.value)}
              ></TextField>
            </FormControl>
          </td>

          <td>
            <Typography sx={{ marginLeft: 3 }}> Comments</Typography>
          </td>
          <td>
            <FormControl>
              <TextField
                InputProps={{
                  rows: 3,
                  multiline: true,
                  inputComponent: "textarea",
                }}
                placeholder="Enter general comments on indicator"
                value={getMeasurementProp("description") || ""}
                onChange={(e) =>
                  setMeasurementProp("description", e.target.value)
                }
                size="small"
              ></TextField>
            </FormControl>
          </td>
        </tr>
        
        <tr>
          <td>
            <Typography> Indication Status </Typography>
          </td>
          <td>
            
            <FormControl>
              <TextField
                size="small"
                value={getMeasurementProp("status")}
              ></TextField>
            </FormControl>
          </td>
        </tr> */}

        
      </tbody>
    </table>
  );
};

DetailedForm.propTypes = {
  measurementData: PropTypes.object.isRequired,
  setMeasurementData: PropTypes.func.isRequired,
  getDefectId: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
  getMeasurementProp: PropTypes.func.isRequired,
  setMeasurementProp: PropTypes.func.isRequired,
  bladeSections: PropTypes.arrayOf(PropTypes.string).isRequired,
  distances: PropTypes.arrayOf(PropTypes.number).isRequired,
  updateRootFaceDistance: PropTypes.func.isRequired,
  measurementSeverityTable: PropTypes.object.isRequired,
  defectDispositionOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  getDefectTolerance: PropTypes.func.isRequired,
  updateDisposition: PropTypes.func.isRequired,
  updateRepairDate: PropTypes.func.isRequired,
  getMeasurementLocation: PropTypes.func.isRequired,
  loggedUser: PropTypes.string, // Marked as optional assuming loggedUser can be null/undefined
  findInspectionImage: PropTypes.func.isRequired,
  statusOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  setDoIncludeAnnotations: PropTypes.func.isRequired,
  setMeasurementUrl: PropTypes.func.isRequired,
  getMeasurementUrl: PropTypes.func.isRequired,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default DetailedForm;
