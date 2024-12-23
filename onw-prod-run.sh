#!/bin/sh

echo Running server, ui and s3 access running together in a single container...
echo ports: ui: 3000 srv:8090 s3-access:9090
echo

# Prod uses RDS database, so we don't need to start it here
# Node for prod we mount a different s3_connectin_info.json file with the s3 credentials
docker run -p 3000:3000 -p 8090:8090 -p 9090:9090 \
            --rm --name bdc-srv-ui-s3 \
            -e SERVER_HOSTNAME=10.242.192.122 \
            -e DATABASE_HOSTNAME=renewables-uai3062831-dbc-prod-postgres.cj6vgoan29oe.us-east-1.rds.amazonaws.com \
            -e DATABASE_USERNAME=dpc_web \
            -e DATABASE_PASSWORD=J1-0lPRhIltjTGT \
            -e DATABASE_PORT=5432 \
            -e DATABASE_NAME=postgres \
            -e S3_ACCESS_HOSTNAME=bdc_s3_access \
            -e S3_ACCESS_PORT=9090 \
            -e SAVE_FILES_TO_DB=False \
            -v "./bdc-ui/public:/app/bdc-ui/public" \
            -v "./bdc-ui/src:/app/bdc-ui/src" \
            -v "./bdc-srv/src:/app/bdc-src/src" \
            -v "./bdc-s3-access/src:/app/bdc-s3-access/src" \
            -v "./bdc-s3-access/s3_connection_info_prod.json:/app/bdc-s3-access/s3_connection_info.json" \
            -d dtr.research.ge.com/blade_digital_certificate/bdc-srv-ui-s3

echo currently running processes...
docker ps