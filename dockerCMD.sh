#!/bin/bash

set -m

if [[ -z "${SERVER_HOSTNAME}" ]]; then
  echo "no SERVER_HOSTNAME, setting it to PROD"
  export SERVER_HOSTNAME=10.242.192.122
else
  echo SERVER_HOSTNAME is ${SERVER_HOSTNAME}
fi


echo linking shared folders...
rm -rf /app/bdc-srv/shared
rm -rf /app/bdc-s3-access/shared
ln -sf /tmp/shared /app/bdc-srv/shared
ln -sf /tmp/shared /app/bdc-s3-access/shared
ln -sf /tmp/shared /app/shared

# echo
# echo Starting bs-parser...
# echo 
# cd /bs-parser
# python3 parseInspectionReport.py &

echo python version:
python3 --version
echo node.js version:
node --version

sleep 5s # wait for the db to start...

echo
echo Starting bdc-s3-access...
echo 
cd /app/bdc-s3-access
python3 -u -m flask --app src/app run --host=0.0.0.0 --port=9090 &

sleep 5s

echo
echo Starting bdc-srv...
echo 
cd /app/bdc-srv
python3 -u -m flask --app src/app run --host=0.0.0.0 --port=8090 &


sleep 5s

echo
echo Starting bdc-ui...
echo 
cd /app/bdc-ui
# nodemon --ignore shared/ --ignore downloads/ src/app.js
npm start 
