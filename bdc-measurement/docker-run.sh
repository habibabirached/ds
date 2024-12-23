#!/bin/sh
echo
echo Note: Use this command to run the image as a stand-alone container.
echo Use docker compose to run the app with all its compoentns together.
echo
echo Swagger UI documentation: http://localhost:8001/docs#/
echo ReDoc documentation: http://localhost:8001/redoc
echo 

CONTAINER_NAME=defect-measurement

docker rm -f $CONTAINER_NAME

#mkdir -p ./upload
docker run -p 8001:8001 \
    --rm \
    --name $CONTAINER_NAME \
    -d dtr.research.ge.com/blade_digital_certificate/bdc-measurement