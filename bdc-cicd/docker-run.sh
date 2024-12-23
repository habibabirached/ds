#!/bin/sh
echo
echo Note: Use this command to run the image as a stand-alone container.
echo Use docker compose to run the app with all its compoentns together.
echo 

docker run  --rm --name bdc-cicd -d dtr.research.ge.com/blade_digital_certificate/bdc-cicd