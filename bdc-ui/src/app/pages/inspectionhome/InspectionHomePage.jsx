import "./InspectionHomePage.css";
import { useEffect, useState, Suspense, Fragment } from "react";
import { Box, CircularProgress, Button } from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";

import { showDirectoryPicker } from "https://cdn.jsdelivr.net/npm/file-system-access/lib/es2018.js";

//import { useHistory } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Loading from "../../components/Loading";
import React from "react";

import DrawOutlinedIcon from "@mui/icons-material/DrawOutlined";

import { jsonrepair } from "jsonrepair";
import {
  createInspection,
  deleteInspection,
  getInspectionList,
  uploadImageFileAndMetadata,
} from "../../services/inspection_api";

import { uploadAnnotationMeasurementFile } from "../../services/measurement_api";

import { uploadMeasurementImageAndAnnotation } from "../../services/image_api";
import InputButton from "../../components/InputButton";
import LinearProgressWithLabel from "../../components/LinearProgressWithLabel";

function InspectionHomePage() {
  const [inspectionList, setInspectionList] = useState([]);
  const [selectedIdList, setSelectedIdList] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  //const history = useHistory();
  const navigate = useNavigate();

  const fetchInspectionList = async () => {
    try {
      const data = await getInspectionList();
      if (data != null) {
        console.log("set inspection list...");
        setInspectionList(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // called after the component is created
  useEffect(() => {
    fetchInspectionList();
    // no return function.
    // we could return a cleanup function here.
  }, []);

  const getReportUrl = (inspection_id) => {
    return `api/inspection/${inspection_id}/xls`;
  };

  // configure table columns
  const inspectionColumnsMeta = [
    { field: "id", headerName: "ID", width: 50 },
    {
      field: "date",
      headerName: "Date",
      width: 100,
      editable: false,
      valueGetter: (params) => {
        return new Date(params.row.date).toISOString().split("T")[0];
      },
    },
    {
      field: "customer_name",
      headerName: "Supplier",
      width: 150,
      editable: false,
    },
    {
      field: "location",
      headerName: "Location",
      type: "number",
      width: 150,
      editable: false,
    },
    {
      field: "sect",
      headerName: "Blade Cavity222",
      type: "number",
      width: 80,
      editable: false,
    },
    {
      field: "esn",
      headerName: "Blade Serial No.",
      description: "Blade serial number",
      sortable: true,
      width: 120,
    },
    {
      field: "sso",
      headerName: "SSO",
      description: "User SSO",
      sortable: true,
      width: 120,
    },
    {
      field: "status",
      headerName: "Annotation",
      description: "Annotation Status",
      sortable: true,
      width: 100,
    },
    {
      field: "edit",
      headerName: "",
      width: 100,
      renderCell: (params) => (
        <strong>
          <Button
            variant="contained"
            size="small"
            style={{ marginLeft: 16, backgroundColor: "seagreen" }}
            tabIndex={params.hasFocus ? 0 : -1}
            onClick={() => navigate(`/imageinspection/${params.row.id}`)}
            //onClick={() => navigate(`/inspection/${params.row.id}`)}
          >
            <DrawOutlinedIcon></DrawOutlinedIcon>Annotate
          </Button>
        </strong>
      ),
    },
    {
      //  field: "get_report",
      //  headerName: "",
      //  width: 140,
      //  renderCell: (params) => (
      //    <strong>
      //     <a href={`api/inspection/${params.row.id}/xls`} download="report.xlsx" target='_blank'>
      //      <Button
      //        variant="contained"
      //        size="small"
      //        style={{ marginLeft: 16, backgroundColor: 'seagreen' }}
      //        tabIndex={params.hasFocus ? 0 : -1}
      //      >
      //        Disposition
      //      </Button>
      //    </a>
      //  </strong>
      //),
    },
    {
      field: "get_esn_report",
      headerName: "",
      width: 200,
      renderCell: (params) => (
        <strong>
          <a
            href={`api/inspection/pdf?esn=${params.row.esn}`}
            download={`${params.row.esn}_report.pdf`}
            target="_blank"
          >
            <Button
              variant="contained"
              size="small"
              style={{ marginLeft: 16, backgroundColor: "seagreen" }}
              tabIndex={params.hasFocus ? 0 : -1}
            >
              {`${params.row.esn} Quality Cert`}
            </Button>
          </a>
        </strong>
      ),
    },
  ];

  const handleDirectoryEntry = async (dirHandle, out) => {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === "file") {
        const file = await entry.getFile();
        if (!file.name.startsWith(".")) out[file.name] = file;
      }
      if (entry.kind === "directory") {
        const newHandle = await dirHandle.getDirectoryHandle(entry.name, {
          create: false,
        });
        if (!entry.name.startsWith(".")) {
          const newOut = (out[entry.name] = {});
          await handleDirectoryEntry(newHandle, newOut);
        }
      }
    }
  };

  const rowsSelected = (indexList) => {
    setSelectedIdList(indexList);
    console.log("selectedIndices:", selectedIdList);
  };

  const delSelected = async () => {
    console.log("delSelected() called");
    for (let id of selectedIdList) {
      console.log("deleting inspection id:", id);
      let resp = await deleteInspection(id);
      console.log(resp);
      fetchInspectionList();
    }
  };

  // This method uploads an image.png file plus its required associated image.json meta-data file (which contains distance) and other info
  // It also looks for and processes the optional /imageName_measuremnets folder.
  // within the /imageName_measurements folder, annotations i.e. imageMeasurement.json files are optional.
  const processInspectionFile = async (
    filename,
    imagesFolder,
    inspectionId,
    bladeId,
    doneCallback
  ) => {
    console.log(`Name: ${filename}, value: ${imagesFolder[filename]}`);
    if (filename.endsWith(".png") || filename.endsWith(".jpg")) {
      // 360 image
      const imageFile = imagesFolder[filename];
      const imagePrefix = filename.split(".")[0];
      const metaFileName = imagePrefix + ".json";
      // search for corresponding meta-data .json file for the 360 image
      const imageMetaFile = imagesFolder[metaFileName];

      let resp = {};
      // found both image and .json files...
      if (imageMetaFile != null && imageFile != null) {
        resp = await uploadImageFileAndMetadata(
          inspectionId,
          bladeId,
          imageFile,
          imageMetaFile
        );
        console.log("resp:", resp);
      } else {
        console.log("skip upload of: ", filename);
      }

      let imageId = resp["image_id"];

      // --------------------------- process measurement folder (if any) -------------------------
      const measurementsFolderName = imagePrefix + "_measurements";
      if (imageId != null && imagesFolder[measurementsFolderName] != null) {
        let measurementFolder = imagesFolder[measurementsFolderName];
        console.log(
          "Processing measurements folder:",
          measurementsFolderName,
          " for imageId:",
          imageId,
          "filename:",
          filename
        );
        for (let entryName of Object.keys(measurementFolder)) {
          if (entryName.endsWith(".png") || entryName.endsWith(".jpg")) {
            const measurementImageFile = measurementFolder[entryName];
            const measurementImageFilePrefix = entryName.split(".")[0];

            const measurementAnnotationFilename =
              measurementImageFilePrefix + ".json";
            const measurementAnnotationFile =
              measurementFolder[measurementAnnotationFilename];

            let annotationUploadResp =
              await uploadMeasurementImageAndAnnotation(
                imageId,
                measurementImageFile,
                measurementAnnotationFile
              );
            console.log(
              "uploadMeasurementImageAndAnnotation resp:",
              annotationUploadResp
            );
          }
        }
      } else {
        console.log("No _measurements folder for: ", filename);
      }
    }
    doneCallback(filename);
  };

  const ANNOTATION_FILE_PATTERN = /\w+-\w+-\w+_mid\d+.json/g;

  const uploadAnnotationsDir = async () => {
    const annotationsFolder = {};

    const dirHandle = await showDirectoryPicker();

    await handleDirectoryEntry(dirHandle, annotationsFolder);
    console.log("Directory structure:", annotationsFolder);

    let skippedFilesList = [];
    let filesToImportList = [];
    setUploadProgress(1); // progress bar starts with 1%
    let callList = [];
    for (let filename of Object.keys(annotationsFolder)) {
      if (
        filename.endsWith(".json") &&
        filename.match(ANNOTATION_FILE_PATTERN)
      ) {
        filesToImportList.push(filename);
      } else {
        skippedFilesList.push(filename);
      }
    }

    let totalFiles = filesToImportList.length;
    let doneFilesSet = new Set();

    // Callback function used to track the completed uploads...
    const doneUploadCB = (filename) => {
      doneFilesSet.add(filename);
      let progress = Math.round(100 * (doneFilesSet.size / totalFiles));
      console.log("Progress:", progress);
      setUploadProgress(progress);
    };

    for (let filename of filesToImportList) {
      let annotationFile = annotationsFolder[filename];
      let suffix = filename.split("_mid")[1];
      let measurementId = suffix.split(".")[0];
      callList.push(
        uploadAnnotationFile(
          filename,
          measurementId,
          annotationFile,
          doneUploadCB
        )
      );
    }

    await Promise.all(callList);
    setUploadProgress(0); // reset progress bar

    if (skippedFilesList.length > 0) {
      console.log("skipped files: ", skippedFilesList);
      console.log("imported files: ", filesToImportList);
      alert(
        "Files skipped due to missing _mid[number] suffix:\n" +
          skippedFilesList.join("\n") +
          "\n\nFiles imported:\n" +
          filesToImportList.join("\n")
      );
    }
  };

  const uploadAnnotationFile = async (
    filename,
    measurementId,
    file,
    doneUploadCB
  ) => {
    console.log(
      "uploading File: ",
      filename,
      "using measurementId:",
      measurementId
    );

    try {
      let data = await uploadAnnotationMeasurementFile(measurementId, file);
      console.log("data:", data);
    } catch (err) {
      console.log(`error uploading file ${filename}:`, filename);
    }

    doneUploadCB(filename);
  };

  // each image can have: 1) a shadow .json file, 2) a shadow _measurement folder with more than one image and shadow .json filles
  // Measurements are screenshots taken on a given image. the folder has same image prefix + '_measurements' suffix
  const uploadDir = async () => {
    const out = {};
    //const dirHandle = await window.showDirectoryPicker();

    const dirHandle = await showDirectoryPicker();

    await handleDirectoryEntry(dirHandle, out);
    console.log("Directory structure:", out);

    // Process the output list of files and directories....

    // --------------------- parse metadata.yml file --------------------------
    let inspectionId = -1;
    let metadataFile = out["metadata.yml"];

    // try .json extension instead
    if (metadataFile == null) {
      metadataFile = out["metadata.json"];
    }

    if (metadataFile == null) {
      alert(
        "Import aborted. Could not find inspection folder metadata.yml or metadata.json file!"
      );
      return;
    }
    console.log("Create inspection using metadata");
    let textContent = await metadataFile.text();
    let repairedJsonText = jsonrepair(textContent); // the format within .yml is not standard json
    let jsonContent = JSON.parse(repairedJsonText);
    console.log("metadata.yml json content:", jsonContent);

    const inspectionBody = {
      app_type: jsonContent["app_type"],
      customer_name: jsonContent["cust"],
      date: jsonContent["datetime"],
      disp: jsonContent["disp"],
      engine_type: jsonContent["engine_type"],
      esn: jsonContent["esn"],
      location: jsonContent["loc"],
      misc: jsonContent["misc"],
      sect: jsonContent["sect"],
    };

    let newInspection = await createInspection(inspectionBody);
    console.log("createInspection resp:", newInspection);
    inspectionId = newInspection.id;

    // ------------------------ parse images/ folder --------------------------
    let imagesFolder = out["images"];
    if (imagesFolder == null) {
      alert("Could not find /images folder!");
      return;
    }
    let bladeId = 1; //TODO: obtain the blade id from the user

    let totalFiles = Object.keys(imagesFolder).length;
    let doneFilesSet = new Set();

    // Callback function used to track the completed uploads...
    const doneUploadCB = (filename) => {
      doneFilesSet.add(filename);
      let progress = Math.round(100 * (doneFilesSet.size / totalFiles));
      console.log("Progress:", progress);
      setUploadProgress(progress);
    };

    setUploadProgress(1); // start with 1%
    let callList = [];
    for (let filename of Object.keys(imagesFolder)) {
      callList.push(
        processInspectionFile(
          filename,
          imagesFolder,
          inspectionId,
          bladeId,
          doneUploadCB
        )
      );
    }
    // upload all files in parallel
    await Promise.all(callList);

    setInspectionList([...inspectionList, newInspection]);
    setUploadProgress(0); // reset
  };

  // Note: This method is not being used anymore...
  // Creates an empty inspection and open it with the videoinspection editor
  const newVideoInspection = async () => {
    const inspectionBody = {
      app_type: "",
      customer_name: "",
      date: new Date(),
      disp: "",
      engine_type: "",
      esn: "",
      location: "",
      misc: "",
      sect: "",
    };

    let newInspection = await createInspection(inspectionBody);
    console.log("createInspection resp:", newInspection);
    let inspectionId = newInspection.id;

    setInspectionList([...inspectionList, newInspection]);
    navigate(`/videoinspection/${inspectionId}`);
  };

  return (
    <div className="InspectionHomePage">
      {/* <InputButton onClick={uploadDir} > Upload New Inspection </InputButton> */}
      <Button onClick={uploadDir}>Upload Inspection</Button>
      <Button onClick={uploadAnnotationsDir}>Upload Annotations</Button>
      {/* <Button onClick={newVideoInspection}>New Video Inspection</Button> */}
      <Button disabled={selectedIdList.length === 0} onClick={delSelected}>
        Del Selected
      </Button>
      <Suspense fallback={<Loading />}>
        <Box sx={{ width: "100%" }}>
          {uploadProgress > 0 && (
            <LinearProgressWithLabel value={uploadProgress} />
          )}
        </Box>
        <Box sx={{ height: 800, width: "100%" }}>
          <DataGrid
            rows={inspectionList}
            // getRowHeight={() => 'auto'} //https://mui.com/x/react-data-grid/row-height/
            columns={inspectionColumnsMeta}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 20,
                },
              },
            }}
            onRowSelectionModelChange={rowsSelected}
            pageSizeOptions={[5]}
            checkboxSelection
            disableRowSelectionOnClick
          />
        </Box>
      </Suspense>
    </div>
  );
}

export default InspectionHomePage;
