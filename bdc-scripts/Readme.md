# Description
This folder contains scripts that help in the automation of the reading of images into the web application via command line. Scripts are developed using Node.js. 

# Installing

This script requires Node.js version 18 or later. It uses fetch to make REST calls.
After installing Node.js (https://nodejs.org/en), you will need to install dependencies with the command:

```
npm install
```

# Upload Single File To S3 Script

We have a new script to upload a single file to ONW S3 Bucket. The script takes an input file (e.g. the large .360 video file) as a parameter and a destinaiton path within the S3 bucket.

Example:
```
upload_file_s3.sh ./myVideo.360 /TPI-1234/2023-12-12/myVideo.360
```

It is up to us to define the destination folder format. in the example, we include the ESN/ISO-Date/VideoName.360.


# Upload Inspection Folder Script

## Running example:

The upload inspection script should be called with a hostname where the bdc-srv service is executing and a local folder where the inspection files are stored.

Example:

```
upload_inspection.sh localhost '../bdc-srv/input/50775-le'

```


# Sync Inspection Folder Script
This script compares a local folder data with an existing record in the DB. It uses the meta-data in metadata.yml file to search the database for a **esn**, **datetime**, **sect**, and **manufacture_stage** matching inspection. 

In the current version of the script, it looks for records with missing 360 images and uploads them, thus fixing a problem we found in older inspections stored in the GRC VM.

## Error situations
If the local folder metadata.yml field datetime is '' or null, it considers it a catchall. The same apply for the other search fields. 

However, doing so, it may find more than one matching inspection. If this happens, we cannot sync since we cannot pick the unique inspection to sync. An error will be produced and the script will stop. 

If you encounter that situation, just look at the inspection record (by its id) in the web app and copy the existing date to the metadata.yml file. it should uniquely identify the record. e.g. use ISO date: 2023-05-19 or 'May 19 2023'.

## Running example:

The sync inspection script should be called with a hostname where the bdc-srv service is executing and a local folder where the inspection files are stored.

Example:

```
sync_inspection.sh localhost '../bdc-srv/input/50775-le'

```

## Inspection folder format
 The inspection folder should be in the GRC crawler format. i.e. contain a metadata.json or metadata.yml file in the root folder, a sub-folder called images with the 360 images, and sub-folders within /images folder for each set of 2d screenshots taken for a 360 image. The screenshots folder must be named after the imageName with the post-fix _measurement. e.g. 2d images taken based on image01.png should be stored at image01_measurements folder. 360 images may contain .json meta-data files where distance from root are included. Also, 2d images (measurements) may contain .json annotations in the labelme (https://github.com/labelmeai/labelme) format. 

 e.g. inspection folder structure 
```
 /tpm-123
   metadata.yml
   /images
     image01.png
     image01.json
     /image01_measurements
       snapshot01.png
       snapshot01.json
       snapshot02.png
       snapshot02.json
     image02.png
     image02.json
     image03.png
     image03.json
```