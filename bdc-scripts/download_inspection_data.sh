#!/bin/sh
echo usage: ./download_inspection_data.sh hosthame esn
echo e.g. ./download_inspection_data.sh localhost esn

node ./src/downloadInspectionData.js $@