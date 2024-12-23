import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import FolderStructure from "./FolderStructure.jsx";
import "./FolderUpload.css";
import { Link } from 'react-router-dom';
import { MonitorIcon } from 'lucide-react';

const FolderUpload = () => {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadComplete, setIsUploadComplete] = useState(false);

  const CHUNK_SIZE = 30 * 1024 * 1024; // 30MB chunks
  const MAX_RETRIES = 15;
  const UPLOAD_FILE_NAME = "blade_upload_log.txt";
  const ROS_FOLDER_NAME = "Ros";
  const BLADE_SCAN_COLUMN_NAME = "blade_scan_time";

  const onDrop = useCallback((files) => {
    if (files.length > 0) {
      setSelectedFolder(files);
      setValidationErrors([]);
      setUploadProgress(0);
      setUploadStatus(
        `Folder selected successfully. ${files.length} files found.`
      );
    } else {
      setUploadProgress(0);
      setUploadStatus("No files found in the dropped folder.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    multiple: true,
  });

  const handleFolderSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      setSelectedFolder(files);
      setValidationErrors([]);
      setUploadProgress(0);
      setUploadStatus("Folder selected successfully.");
    } else {
      setUploadProgress(0);
      setUploadStatus("No files found in the selected folder.");
    }
  };

  const getFilePath = (file) => {
    if (file.webkitRelativePath && file.webkitRelativePath !== "") {
      return file.webkitRelativePath;
    } else if (file.path && file.path !== ""){
      return file.path.replace(/^\/+/, "");
    } else {
      return file.name;
    }
  };

  const isValidFile = (file) => {
    if (file.size === 0) {
      return { valid: false, error: `File ${file.name} is empty.` };
    }
    if (getFilePath(file).split("/").pop() !== UPLOAD_FILE_NAME) {
      const ext = file.name.split(".").pop().toLowerCase();
      if (!["360", "json", "db3"].includes(ext)) {
        return {
          valid: false,
          error: `File has an invalid extension. Only .360, .db3, .json and files are allowed.`,
        };
      }
    }
    return { valid: true };
  };

  const uploadPart = async (
    presignedUrl,
    file,
    start,
    end,
    partNumber,
    retries = 0
  ) => {
    const chunk = file.slice(start, end);
    try {
      const response = await fetch(presignedUrl, {
        method: "PUT",
        body: chunk,
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const eTag = response.headers.get("ETag");
      return {
        PartNumber: partNumber,
        ETag: eTag,
      };
    } catch (error) {
      if (retries < MAX_RETRIES) {
        console.log(
          `Retrying upload for part ${partNumber}. Attempt ${
            retries + 1
          } of ${MAX_RETRIES}`
        );
        return uploadPart(
          presignedUrl,
          file,
          start,
          end,
          partNumber,
          retries + 1
        );
      } else {
        throw new Error(
          `Failed to upload part ${partNumber} after ${MAX_RETRIES} attempts`
        );
      }
    }
  };

  const uploadFile = async (file, folderDate) => {
    setUploadStatus(`Uploading File: ${file.name}`);
    let objectName = getFilePath(file) || file.name;
    let uploadId;

    try {
      // Initiate multipart upload
      const initiateResponse = await fetch("/api/initiate_upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          object_name: objectName,
          file_size: file.size,
          folderDate: folderDate,
        }),
      });

      if (!initiateResponse.ok) {
        setUploadStatus(`An error occurred while uploading file: ${file.name}`);
        throw new Error(`HTTP error! status: ${initiateResponse.status}`);
      }

      const initiateData = await initiateResponse.json();
      uploadId = initiateData.upload_id;
      objectName = initiateData.object_name;

      // Calculate number of parts
      const partCount = Math.ceil(file.size / CHUNK_SIZE);

      // Get presigned URLs for all parts
      const presignedUrlsResponse = await fetch("/api/get_presigned_urls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          object_name: objectName,
          upload_id: uploadId,
          parts: partCount,
        }),
      });

      if (!presignedUrlsResponse.ok) {
        setUploadStatus(`An error occurred while uploading file: ${file.name}`);
        throw new Error(`HTTP error! status: ${presignedUrlsResponse.status}`);
      }

      const presignedUrlsData = await presignedUrlsResponse.json();
      const presignedUrls = presignedUrlsData.presigned_urls;

      // Upload parts with retry mechanism
      const uploadPromises = presignedUrls.map((urlData, index) => {
        const start = index * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        return uploadPart(
          urlData.PresignedUrl,
          file,
          start,
          end,
          urlData.PartNumber
        );
      });

      const uploadedParts = await Promise.all(uploadPromises);
      // Sort parts by PartNumber before completing the upload
      const sortedParts = uploadedParts.sort(
        (a, b) => a.PartNumber - b.PartNumber
      );

      // Complete multipart upload
      const completeResponse = await fetch("/api/complete_upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          object_name: objectName,
          upload_id: uploadId,
          parts: sortedParts,
        }),
      });

      if (!completeResponse.ok) {
        setUploadStatus(`An error occurred while uploading file: ${file.name}`);
        throw new Error(`HTTP error! status: ${completeResponse.status}`);
      }

      setUploadStatus(`Successfully uploaded file: ${file.name}`);
      return {
        success: true,
        objectName: objectName
      };
    } catch (error) {
      setUploadStatus(`An error occurred while uploading file: ${file.name}`);
      console.error(`Error uploading ${file.name}:`, error);

      // Attempt to abort the multipart upload if it was initiated
      if (uploadId) {
        try {
          const abortResponse = await fetch("/api/abort_upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              object_name: objectName,
              upload_id: uploadId,
            }),
          });

          if (!abortResponse.ok)
            throw new Error(`HTTP error! status: ${abortResponse.status}`);

          console.log(`Aborted multipart upload for ${file.name}`);
          return {
            success: false,
            error: error.message
          };
        } catch (abortError) {
          console.error(
            `Failed to abort multipart upload for ${file.name}:`,
            abortError
          );
          return {
            success: false,
            error: error.message
          };
        }
      }
    }
  };

  const uploadFiles = async () => {
    if (!selectedFolder) {
      setUploadStatus("Please select a folder first.");
      setIsUploading(false);
      return;
    }
    setIsUploading(true);
    setUploadStatus("Validating and uploading files...");
    setValidationErrors([]);

    const rosFiles = [];
    const regularFiles = [];
    const uploadedFiles = [];
    const folderLevelFiles = [];
    const bladeNumberDateSet = new Set();
    const folderDate = new Date().toISOString().split('T')[0];
    console.log("folderDate:", folderDate);

    // Separate ROS files and regular files and extract blade number and scan date
    for (let i = 0; i < selectedFolder.length; i++) {
        const file = selectedFolder[i];
        const validationResult = isValidFile(file);
        if (!validationResult.valid) {
          setValidationErrors((prev) => [
          ...prev,
          { fileName: file.name, error: validationResult.error },
          ]);
          setUploadStatus(`Validation error for file: ${file.name}`);
        } else {
          const relativePath = getFilePath(file);
          folderLevelFiles.push(relativePath);
          if (relativePath.includes(`/${ROS_FOLDER_NAME}/`)) {
            rosFiles.push(file);
          } else {
            regularFiles.push(file);
          }
          // Check if file is JSON to extract blade number and scan date
          if (file.name.toLowerCase().endsWith('.json')) {
            const bladeNum = relativePath.match(/Blade_(.*?)\//);
            const bladeNumber = bladeNum[1];
            // Check if we already have this blade number in the set
            const existingEntry = Array.from(bladeNumberDateSet).find(pair => pair.startsWith(`${bladeNumber},`));
            if (!existingEntry) {
                // Only proceed with file reading if blade number not found and file is JSON
                try {
                  const fileContent = await new Promise((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = (e) => resolve(e.target.result);
                      reader.onerror = reject;
                      reader.readAsText(file);
                  });

                  const jsonContent = JSON.parse(fileContent);
                  if (!jsonContent.datetime) {
                      console.log(`No datetime field in JSON file: ${file.name}`);
                      return;
                  }
                  let date = convertToTimestamp(jsonContent.datetime);

                  const bladeDatePair = `${jsonContent.esn},${date}`;
                  bladeNumberDateSet.add(bladeDatePair);
                } catch (error) {
                  console.log(`Error processing file ${file.name}:`, error);
                }
            }
          }
        }
    }

    // Check presence of Ros folder and atleast one .360, .json and .db3 file
    const rosfolderPresent = rosFiles.length > 0;
    const filesPresent = filePresenceValidator(folderLevelFiles);
    if (!filesPresent || !rosfolderPresent) {
      setUploadStatus(
        "Upload Cancelled: Please check the following:" +
        "\n 1.The selected blade folder name begins with 'Blade_' " +
        "\n 2.Each cavity folder contains both a .360 file and a .json file" +
        "\n 3.The Ros folder includes a .db3 file"
      );
      setIsUploading(false);
      return;
    }

    setUploadProgress(5);
    try {
      
      const bladeCavitiesArray = getBladeCavities(folderLevelFiles);
      // Upload ros files
      if (rosFiles.length > 0) {
        let validationResult = { errors: [] };
        if (rosFiles.length === 1) {
          validationResult = await validateRos(rosFiles, bladeCavitiesArray);
          const uploadRresult = await uploadRosFile(
            rosFiles[0],
            validationResult,
            folderDate
          );
          if (uploadRresult.success) {
            uploadedFiles.push(uploadRresult.objectName);
          } else {
            throw new Error(`File upload failed for: ${rosFiles[0].name}: ${uploadRresult.error}`)
          }
          setUploadProgress(20);
        } else {
          // Group files by their file paths
          const groupedFiles = rosFiles.reduce((grouped, file) => {
            const path = getFilePath(file).split('/').slice(0, -1).join('/');
            if (!grouped[path]) {
              grouped[path] = [];
            }
            grouped[path].push(file);
            return grouped;
          }, {});
          // Get unique file paths
          const uniquePaths = Object.keys(groupedFiles);

          // For each unique file path, if there are multiple files then bypass validation and upload
          let j = 0;
          for (const path of uniquePaths) {
            const filesForPath = groupedFiles[path];
            if (filesForPath.length > 1) {
              for (let k = 0; k < filesForPath.length; k++) {
                const file = filesForPath[k];
                const uploadRresult = await uploadRosFile(file, {
                  errors: [],
                }, folderDate);
                if (uploadRresult.success) {
                  uploadedFiles.push(uploadRresult.objectName);
                }
              }
            } else {
              validationResult = await validateRos(filesForPath, bladeCavitiesArray);
              const uploadRresult = await uploadRosFile(
                filesForPath[0],
                validationResult,
                folderDate
              );
              if (uploadRresult.success) {
                uploadedFiles.push(uploadRresult.objectName);
              }
            }
            setUploadProgress(Math.round(5 + ((j + 1) / uniquePaths.length) * 15));
            j++;
        }
      }
      }
      
      setUploadProgress(20);
      // Upload regular files
      for (let i = 0; i < regularFiles.length; i++) {
        const file = regularFiles[i];
        const result = await uploadFile(file, folderDate);
        if (result.success) {
          uploadedFiles.push(result.objectName);
        } else {
        console.error('File upload failed:', result.error);
        setValidationErrors((prev) => [
          ...prev,
          { fileName: file.name, error: `File upload failed: ${result.error}`}
          ]);
          setUploadStatus(`File Upload failed for: ${file.name}`);
          throw new Error(`File upload failed for: ${file.name}: ${result.error}`);
        }
        setUploadProgress(Math.round(20 + ((i + 1) / regularFiles.length) * 75));
      }

      setUploadProgress(95);
      
      
      const bladeNumberList = [];
      // Upload the blade files upload log file
      if (uploadedFiles.length > 0) {
        await generateAndUploadLog(uploadedFiles, bladeNumberList, folderDate);
      }

      setUploadProgress(100);
      setIsUploading(false);
      //update BladeMonitoring with blade scan time
      updateBladeScanTime(bladeNumberDateSet);
      setUploadStatus(
        bladeNumberList.length > 0
          ? "Processing complete for blade: " + bladeNumberList.join(", ")
          : "Processing complete."
      );
      setSelectedFolder(null);
      setIsUploadComplete(true);
    } catch (error) {
      console.error(`Error uploading files`, error);
      setIsUploading(false);
      setUploadProgress(100);
      setUploadStatus("An issue occurred while uploading your files to S3. Could you please try uploading the blade folder again? Thank you for your patience!");
    }
  };

  const generateAndUploadLog = async (uploadedFiles, bladeNumberList, folderDate) => {
    // Group files by s3FolderPath
    const groupedFiles = uploadedFiles.reduce((acc, filePath) => {
      const parts = filePath.split("/");
      const s3FolderPath = parts[4];
      if (!acc[s3FolderPath]) {
        acc[s3FolderPath] = [];
      }
      acc[s3FolderPath].push(filePath);
      return acc;
    }, {});
  
    // Generate and upload log for each group
    for (const [s3FolderPath, files] of Object.entries(groupedFiles)) {
      const csvContent = files.join("\n");
      //console.log("csvContent:", csvContent);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const logFileName = generateLogFileName(s3FolderPath);
      bladeNumberList.push(s3FolderPath);

    const logFile = new File([blob], `${logFileName}`, { type: "text/csv" });
  
    let resultU = null;
    try {
      resultU = await uploadFile(logFile, folderDate);
      if (resultU != null && !resultU.success) {
        console.error('File upload failed:', resultU.error);
        setValidationErrors((prev) => [
          ...prev,
          { fileName: logFile.name, error: `File upload failed: ${resultU.error}`}
          ]);
          setUploadStatus(`File Upload failed for: ${logFile.name}`);
      }
    } catch (error) {
      console.error("Error uploading blade upload log file to S3:", error);
      setValidationErrors((prev) => [
        ...prev,
        { fileName: logFile.name, error: `File upload failed: ${resultU.error}`}
        ]);
      }
    }
  };

  const generateLogFileName = (s3FolderPath) => {
    return `${s3FolderPath}/${UPLOAD_FILE_NAME}`;
  };

  const validateRos = async (rosFiles, bladeCavitiesArray) => {
    try {
        // Get file path and extract the Blade number
        const fileP = getFilePath(rosFiles[0]);
        const bladeMatch = fileP.match(/(Blade_[\w.-]+)/);
        if (!bladeMatch) {
          return { errors: [] }; 
        }
        const bladeIdentifier = bladeMatch[0];
        // Find the cavity count for the extracted Blade number
        let cavityCount = 0;
        for (const entry of bladeCavitiesArray) {
            const match = entry.match(/{(Blade_[\w.-]+), (\d+)}/);
            if (match && match[1] === bladeIdentifier) {
                cavityCount = parseInt(match[2], 10);  // Get the count as an integer
                break;
            }
        }
        console.log("cavityCount:", cavityCount);

        // Create form data for file upload
        const formData = new FormData();
        rosFiles.forEach((file) => {
            formData.append(`files`, file);
        });

        // Append cavity count to form data
        formData.append("cavityCount", cavityCount);

        // Make the API request
        const response = await fetch("/api/validate_ros", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result; // Expecting { errors: [] } structure from the server
    } catch (error) {
        console.error("Error validating ROS file:", error);
        return { errors: [] }; // Let file upload continue
    }
};

  const uploadRosFile = async (rosFile, validationResult, folderDate) => {
    if (validationResult.errors.length === 0) {
        const resultR = await uploadFile(rosFile, folderDate);
        if (resultR.success) {
          return { success: true, objectName: resultR.objectName };
        } else {
        console.error('File upload failed:', resultR.error);
        setValidationErrors((prev) => [
          ...prev,
          { fileName: rosFile.name, error: `File upload failed: ${resultR.error}`}
          ]);
          setUploadStatus(`File Upload failed for: ${rosFile.name}`);
          throw new Error(`File upload failed for: ${resultR.error}`);
        }
    } else {
      setValidationErrors((prev) => [
        ...prev,
        { fileName: rosFile.name, error: validationResult.errors[0] },
      ]);
      setUploadStatus(`File Validation failed for: ${rosFile.name}`);
      throw new Error(`File Validation failed for: ${rosFile.name}`);
    }
  };

  const filePresenceValidator = (folderLevelFiles) => {
    // Create an object to store file types based on second last folder
    const folderFiles = {};
    // Check if all file paths in folderLevelFiles start with 'Blade_'
    const allBladeFiles = folderLevelFiles.every((filePath) => filePath.startsWith("Blade_"));

    if (!allBladeFiles) {
      console.log("No folder with 'Blade_' prefix was found in the uploaded files.");
    return false;
    }

    folderLevelFiles.forEach((filePath) => {
      const pathParts = filePath.split("/");

      // Get second last folder
      const secondLastFolder = pathParts[pathParts.length - 2];

      // Initialize an object for the folder if not already present
      if (!folderFiles[secondLastFolder]) {
        folderFiles[secondLastFolder] = {
          has360: false,
          hasJson: false,
          hasDb3: false,
        };
      }

      // Check file extension and mark the presence of relevant file types
      if (filePath.endsWith(".360")) {
        folderFiles[secondLastFolder].has360 = true;
      }
      if (filePath.endsWith(".json")) {
        folderFiles[secondLastFolder].hasJson = true;
      }
      if (filePath.endsWith(".db3")) {
        folderFiles[secondLastFolder].hasDb3 = true;
      }
    });

    // Validate each folder
    for (const folder in folderFiles) {
      const files = folderFiles[folder];

      // For '/Ros/', validate it contains at least one .db3 file
      if (folder === ROS_FOLDER_NAME) {
        if (!files.hasDb3) {
          return false; // Invalid if Ros folder doesn't have .db3 file
        }
      } else {
        // For other folders, validate they contain at least one .360 and one .json file
        if (!files.has360 || !files.hasJson) {
          return false; // Invalid if folder doesn't have both .360 and .json files
        }
      }
    }
    return true;
  };

  const getBladeCavities = (folderLevelFiles) => { 
    const bladeCavities = {};

    folderLevelFiles.forEach((filePath) => {
        const pathParts = filePath.split("/");
        
        const bladeFolder = pathParts.find(folder => folder.startsWith("Blade_"));
        if (!bladeFolder) return;
        // Get the cavity folder
        const sectionFolder = pathParts[pathParts.length - 2];
        
        if (!bladeCavities[bladeFolder]) {
          bladeCavities[bladeFolder] = new Set();
        }
        if (!sectionFolder.includes(`${ROS_FOLDER_NAME}`)) {
        bladeCavities[bladeFolder].add(sectionFolder);
        }
    });

    const bladeCavitiesArray = Object.entries(bladeCavities).map(([blade, sections]) => {
        return `{${blade}, ${sections.size}}`;
    });

    return bladeCavitiesArray;
};

  const convertToTimestamp = (dateString) => {
    const dateParts = dateString.split(' ');
    const date = dateParts[0].split('/');
    const time = dateParts[1].split(':');
    const dateObject = new Date(`20${date[2]}`, date[0] - 1, date[1], time[0], time[1]);
  
    // Convert to ISO string with timezone offset
    const timestamptz = dateObject.toISOString();
    return timestamptz;
  }

  const updateBladeScanTime = async (bladeNumberDateSet) => {
      for (const item of bladeNumberDateSet) {
        try {
          const [bladeNumber, date] = item.split(',');
          const jsonBody = JSON.stringify({
            blade_number: bladeNumber.trim(),
            column_name: BLADE_SCAN_COLUMN_NAME,
            status: 'Upload Completed',
            date: date.trim(),
          });
  
          // API call to update blade monitoring
          const response = await fetch("/api/update_blade_monitoring", {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
            },
            body: jsonBody,
          });
  
          if (!response.ok) {
            console.log(`HTTP error! status: ${response.status} for blade number: ${bladeNumber}`);
          }
        } catch (error) {
          console.info("Error updating blade scan time:", error);
          throw error;
        }
      }
  }

  return (
    <div className="folder-upload-container">
      <div className="main-content">
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? "active" : ""}`}
        >
          <input {...getInputProps()} />
          <p>
            {isDragActive
              ? "Drop the folder here"
              : "Drag and drop a folder here"}
          </p>
        </div>
        <p> OR </p>

        <div className="folder-select-button">
          <label htmlFor="folder-input" className="btn">
            Select Folder
          </label>
          <input
            id="folder-input"
            type="file"
            directory=""
            webkitdirectory=""
            style={{ display: "none" }}
            onChange={(e) => {
              handleFolderSelect(e);
              setValidationErrors([]); // Clear validation errors when new folder is selected
            }}
          />
        </div>
        
        {isUploading && (<div className="warning-message">
          <strong>Warning:</strong> Please stay on this page until the upload is finished.
        </div>)}

        {uploadStatus && (
        <div className="upload-status-area">
          <p className="upload-status-text">{uploadStatus}</p>
          {uploadProgress > 0 && (
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>
        )}

        {!isUploading && validationErrors.length > 0 && (
          <div className="validation-errors">
            <h4>Upload incomplete: Below files skipped or failed due to validation or app errors:</h4>
            <ul>
              {validationErrors.map((error, index) => (
                <li key={index}>
                  {error.fileName}: {error.error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedFolder && (
          <div className="folder-structure">
            <div className="upload-button-container">
              <button
                onClick={uploadFiles}
                disabled={!selectedFolder || isUploading}
                className="upldbtn"
              >
                {isUploading ? "Uploading..." : "Upload Folder"}
              </button>
            </div>
            <FolderStructure files={selectedFolder} />
          </div>
        )}

        {isUploadComplete && !selectedFolder && (
          <div>
            <Link 
              to="/monitorblade"
              className="nav-link"
            >
              <MonitorIcon size={18} />
              Monitor Uploaded Blade
            </Link>
          </div>
        )}

        {!selectedFolder && (
          <div className="instructions-container">
            <ul className="instructions">
              <h4>Instructions for Upload:</h4>
              <li>
                Step 1: Prepare the Folder-
                <ul>
                  <li>
                    Folder Naming: Name the folder to match the Blade number
                    (e.g., BL_LM-000040)
                  </li>
                  <li>
                    Contents of the Folder:
                    <ul>
                      <li>
                        Ensure the folder contains subfolders with .360 video
                        files and a metadata.json file for each cavity.
                      </li>
                      <li>Include .db3 files inside a subfolder named Ros</li>
                    </ul>
                  </li>
                  <li>
                    Example of a file with correct folder path:
                    <ul>
                      <li>
                        BL_LM-000040\IIN-R-GEIN_serviceid_16623\Post_Mold_Inspection\Trailing_Edge\metadata.json
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
              <li>
                Step 2: Upload the Folder-
                <ul>
                  <li>
                    Option A: Drag and drop the prepared folder into the
                    designated upload area.
                  </li>
                  <li>
                    Option B: Click on 'Select Folder' and use the file browser
                    to manually select the folder for upload.
                  </li>
                </ul>
              </li>
              <li>
                Step 3: Start the Upload-
                <ul>
                  <li>
                    After selecting the folder, click the "Upload Folder" button to begin upload.
                  </li>
                </ul>
              </li>
              <li>
              Remember not to close or navigate away from this page until the upload is complete. This may take several minutes.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
  };

export default FolderUpload;
