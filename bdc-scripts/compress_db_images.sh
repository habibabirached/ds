#!/bin/sh
echo usage: ./compress_db_images.sh hosthame
echo e.g. ./compress_db_images.sh localhost

npm install
node ./src/compressDBImages.js $@