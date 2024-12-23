#!/bin/sh
echo
echo Note: Use this command to run the image as a stand-alone container.
echo Use docker compose to run the app with all its compoentns together.
echo
echo Swagger UI documentation: http://localhost:8000/docs#/
echo ReDoc documentation: http://localhost:8000/redoc
echo 

#mkdir -p ./upload
docker run -p 8000:8000 --rm --name bdc-measurement -v ./src:/app/src -d dtr.research.ge.com/blade_digital_certificate/bdc-measurement