#!/bin/sh
echo usage: ./sync_inspection.sh hosthame dirpath
echo e.g. ./sync_inspection.sh localhost ./my_inspection

node ./src/syncFolder.js $@