#!/bin/sh
echo usage: ./move_db_images_to_s3.sh hosthame
echo e.g. ./move_db_images_to_s3.sh localhost

npm install
node ./src/moveDBImagesToS3.js $@