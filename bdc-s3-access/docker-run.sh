#!/bin/sh
echo
echo Note: Use this command to run the image as a stand-alone container.
echo Use docker compose to run the app with all its compoentns together.
echo
echo You can test the app with the command: curl -i http://localhost:9090/ping
echo 
docker run -p 9090:9090 -d dtr.research.ge.com/blade_digital_certificate/bdc-s3-access