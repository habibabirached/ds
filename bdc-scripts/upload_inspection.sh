#!/bin/sh
echo usage: ./upload_inspection.sh hosthame dirpath
echo e.g. ./upload_inspection.sh localhost ./my_inspection

node ./src/importFolder.js $@