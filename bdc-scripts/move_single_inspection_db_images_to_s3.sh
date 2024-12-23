#!/bin/sh
echo usage: ./move_single_inspection_db_images_to_s3.sh <inspection_id>
echo e.g. ./move_single_inspection_db_images_to_s3.sh 123

curl -X GET "http://localhost:8090/api/maintenance/inspection/$1/move_image_files_to_s3" -H "accept: application/json"