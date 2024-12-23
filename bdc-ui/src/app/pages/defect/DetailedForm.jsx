// DetailedForm.jsx
import PropTypes from "prop-types";
import React, { useState } from 'react';
import {
  TextField,
  TextareaAutosize,
  Button,
  FormControl,
  Typography,
  Select,
  MenuItem,
} from "@mui/material";
import { getMeasurementLocation } from "../../utils/utils";
import "./DefectPage.css";

/**
 * This function component renders a detailed form using a table layout, designed to capture and display various details.
 * Each row in the table corresponds to a different field of the form, with a label and an input element.
 * The form includes various input types like text fields, date selectors, and dropdown menus, each tailored for the specific data type it is meant to collect.
 * The layout is structured and organized, facilitating user interaction and data entry.
 * The use of Material-UI components enhances the user experience with a consistent and visually appealing design.
 */

const convertMeterToMM = (value) => {
  return (value * 1000).toFixed(2);
}

const convertMMToMeter = (value) => {
  return (value / 1000).toFixed(2);
}

const convertMM2ToMeter2 = (value) => {
  return (value / (1000 * 1000)).toFixed(2);
}

const convertMeter2ToMM2 = (value) => {
  return (value * (1000 * 1000)).toFixed(2);
}

const DetailedForm = ({
  getDefectId,
  formatDate,
  getDefectProp,
  setDefectProp,
  bladeSections,
  distances,
  updateRootFaceDistance,
  measurementSeverityTable,
  defectDispositionOptions,
  getDefectTolerance,
  updateDisposition,
  updateRepairDate,
  defectData,
  statusOptions,
}) => {

  const downloadAnnotationFragment = () => {
    let id = getDefectId().split('-').pop();
    console.log("downloadAnnotationFragment() called for:", id);

    const link = document.createElement("a");
    link.href = `/api/defect/${id}/annotation_fragment`;
    link.download = `defect_annotation_fragment_defect_id_${id}.json`;
    console.log("link.href:", link.href);
    link.click();
  };
  

  const downloadImageFrame = () => {
    let id = getDefectId().split('-').pop();
    console.log("downloadAnnotationFrame() called for:", id);

    const link = document.createElement("a");
    link.href = `/api/defect/${id}/frame`;
    link.download = `image_frame_defect_id_${id}.json`;
    console.log("link.href:", link.href);
    link.click();
  };
  
  const downloadMeasurement = () => {
    let measurement_id = defectData.measurement_id;
    console.log("downloadAnnotationFragment() called for measurment_id:", measurement_id);

    const link = document.createElement("a");
    link.href = `/api/measurement/${measurement_id}/annotation_file`;
    link.download = `measurement_annotation_mid_${measurement_id}.json`;
    console.log("link.href:", link.href);
    link.click();
  };
  
  // State to toggle rows visibility
  const [showRows, setShowRows] = useState(false);

  // Toggle function
  const toggleRows = () => {
    setShowRows(prevShowRows => !prevShowRows);
  };



  return (
    <table>
      <tbody>
        {/* -------------- Debug options to retrieve measurement data ------------------- */}
        {/* <tr>
          <td>
            <Button
                variant="contained"
                size="small"
                style={{
                  backgroundColor: "darkslategray",
                  color: "white",
                  marginLeft: 5,
                  marginBottom: 5,
                }}
                onClick={() => downloadAnnotationFragment()}
            >
              Annotation_Fragment.json
            </Button>
          </td>
        
          <td>
            <Button
                variant="contained"
                size="small"
                style={{
                  backgroundColor: "darkslategray",
                  color: "white",
                  marginLeft: 5,
                  marginBottom: 5,
                }}
                onClick={() => downloadImageFrame()}
            >
              Image_Frame.json
            </Button>
          </td>
          <td>
            <Button
                variant="contained"
                size="small"
                style={{
                  backgroundColor: "darkslategray",
                  color: "white",
                  marginLeft: 5,
                  marginBottom: 5,
                }}
                onClick={() => downloadMeasurement()}
            >
              Measurement_Annotation.json
            </Button>
          </td>
        </tr>{" "} */}
        
        {/* Button to toggle collapse/expand */}
        <tr>
          <td colSpan="4" className="expandButton">
            <Button onClick={toggleRows} >
              {showRows ? 'Collapse Details' : 'Expand Details'}
            </Button>
          </td>
        </tr>

        {/* Rows 1 to 5 - Conditional Rendering */}
        {showRows && (
          <>
          
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
                disabled={true}
                type="date"
                InputLabelProps={{ shrink: true }}
                size="small"
                value={formatDate(getDefectProp("date"))}
                onChange={(e) => setDefectProp("date", e.target.value)}
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
                disabled={true}
                id="location"
                value={getMeasurementLocation(defectData.location)}
                onChange={(e) => setDefectProp("location", e.target.value)}
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
          <td>
            <Typography sx={{ marginLeft: 3 }}> Distance from Root </Typography>
          </td>
          <td>
            <FormControl size="small">
              <Select
                disabled={true}
                id="root_face_distance"
                value={getDefectProp("root_face_distance")}
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
          <td>{" "}</td>
        </tr>{" "}

        {/* row 2 */}
        <tr>
          <td>
            <Typography> Indication Type </Typography>
          </td>
          <td>
            <FormControl size="small">
            <TextField
                disabled={true}
                size="small"
                id="finding_type"
                value={getDefectProp("finding_type")}
                onChange={(e) => setDefectProp("finding_type", e.target.value)}
              ></TextField>
              {/* <Select
                disabled={true}
                id="finding_type"
                value={getDefectProp("finding_type")}
                onChange={(e) =>
                  setDefectProp("finding_type", e.target.value)
                }
              >
                {Object.keys(measurementSeverityTable).map((key, index) => (
                  <MenuItem key={index} value={key}>
                    {" "}
                    {key}{" "}
                  </MenuItem>
                ))}
              </Select> */}
            </FormControl>
          </td>
          {/* </tr>
        <tr> */}
          <td>
            <Typography sx={{ marginLeft: 3 }}>
              Indication Length (mm)
            </Typography>
          </td>
          <td>
            <FormControl>
              <TextField
                size="small"
                id="length"
                value={convertMeterToMM(getDefectProp("length"))}
                onChange={(e) => setDefectProp("length", convertMMToMeter(e.target.value))}
              ></TextField>
            </FormControl>
          </td>
        </tr>{" "}

        {/* row 3 */}
        <tr>
          <td>
            <Typography> Indication Width (mm) </Typography>
          </td>
          <td>
            <FormControl>
              <TextField
                size="small"
                id="width"
                value={convertMeterToMM(getDefectProp("width"))}
                onChange={(e) => setDefectProp("width", convertMMToMeter(e.target.value))}
              ></TextField>
            </FormControl>
          </td>
          <td>
            <Typography> Indicator Area (mm²) </Typography>
          </td>
          <td>
            <FormControl>
              <TextField
                size="small"
                id="area"
                value={convertMeter2ToMM2(getDefectProp("area"))}
                onChange={(e) => setDefectProp("area", convertMM2ToMeter2(e.target.value))}
              ></TextField>
            </FormControl>
          </td>
        </tr>{" "}
        
        {/* row 4 */}
        <tr>
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
          <td>{" "}</td>
          <td>{" "}</td>
        </tr>{" "}

        </>
        )}

        {/* Row 5 */}
        <tr>
          <td>
            <Typography> Disposition </Typography>
          </td>
          <td>
            <FormControl size="small">
              <Select
                id="ge_disposition"
                value={getDefectProp("ge_disposition")}
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
                value={getDefectProp("sso")}
                onChange={(e) => setDefectProp("sso", e.target.value)}
              ></TextField>
            </FormControl>
          </td>
        </tr>{" "}
        


        {/* row 6 */}
        <tr>
          <td>
            <Typography> Repair Report Id</Typography>
          </td>
          <td>
            <FormControl>
              <TextField
                size="small"
                value={getDefectProp("repair_report_id") || ""}
                onChange={(e) =>
                  setDefectProp("repair_report_id", e.target.value)
                }
              ></TextField>
            </FormControl>
          </td>
          {/* </tr>
        <tr> */}
          <td>
            <Typography sx={{ marginLeft: 3 }}> Repair Approved By</Typography>
          </td>
          <td>
            <FormControl>
              <TextField
                size="small"
                value={getDefectProp("repair_approved_by") || ""}
                onChange={(e) =>
                  setDefectProp("repair_approved_by", e.target.value)
                }
              ></TextField>
            </FormControl>
          </td>
        </tr>{" "}

        {/* row 7 */}
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
                value={formatDate(getDefectProp("repair_date"))}
                onChange={(e) => updateRepairDate(e.target.value)}
              ></TextField>
            </FormControl>
          </td>
          {/* </tr>
        <tr> */}
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
                value={getDefectProp("description") || ""}
                onChange={(e) =>
                  setDefectProp("description", e.target.value)
                }
                size="small"
              ></TextField>
            </FormControl>

            {/* <FormControl>
              <TextareaAutosize
                minRows={3}
                maxRows={3}
                placeholder="Enter general comments on indicator"
                size="small"
                value={getMeasurementProp("description") || ""}
                onChange={(e) =>
                  setMeasurementProp("description", e.target.value)
                }
              ></TextareaAutosize>
            </FormControl>
             */}
          </td>
        </tr>{" "}

        {/* row 8 */}
        <tr>
          <td>
            <Typography> Indication Status </Typography>
          </td>
          <td>
            {/* <FormControl>
              <Select
                id="status"
                value={getMeasurementProp("status")}
                onChange={(e) => setMeasurementProp("status", e.target.value)}
              >
                {statusOptions.map((status, index) => (
                  <MenuItem key={index} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl> */}
            {/* status is a read-only prop now */}
            <FormControl>
              <TextField
                size="small"
                value={getDefectProp("status")}
              ></TextField>
            </FormControl>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

// DetailedForm.propTypes = {
//   defectData: PropTypes.object.isRequired,
//   setDefectData: PropTypes.func.isRequired,
//   getDefectId: PropTypes.func.isRequired,
//   formatDate: PropTypes.func.isRequired,
//   getDefectProp: PropTypes.func.isRequired,
//   setDefectProp: PropTypes.func.isRequired,
//   bladeSections: PropTypes.arrayOf(PropTypes.string).isRequired,
//   distances: PropTypes.arrayOf(PropTypes.number).isRequired,
//   updateRootFaceDistance: PropTypes.func.isRequired,
//   defectSeverityTable: PropTypes.object.isRequired,
//   defectDispositionOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
//   getDefectTolerance: PropTypes.func.isRequired,
//   updateDisposition: PropTypes.func.isRequired,
//   updateRepairDate: PropTypes.func.isRequired,
//   getDefectLocation: PropTypes.func.isRequired,
//   loggedUser: PropTypes.string, // Marked as optional assuming loggedUser can be null/undefined
//   findInspectionImage: PropTypes.func.isRequired,
//   statusOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
//   setDoIncludeAnnotations: PropTypes.func.isRequired,
//   setDefectUrl: PropTypes.func.isRequired,
//   getDefectUrl: PropTypes.func.isRequired,
//   id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
// };

export default DetailedForm;
