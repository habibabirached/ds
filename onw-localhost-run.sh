#!/bin/sh

echo Running server, ui and s3 access running together in a single container...
echo ports: ui: 3000 srv:8090 s3-access:9090
echo

docker run -p:5436:5432 \
           --rm --name onw-bdc-db \
           -e POSTGRES_USER=bdc \
           -e POSTGRES_PASSWORD=bdc \
           -e POSTGRES_DB=bdc \
           -v "bladedigitalcertificate_db_data:/var/lib/postgresql/data" \
           -d postgres:15-alpine

sleep 10s

# Note For this localhost, we will ignore the s3 access by setting SAVE_FILES_TO_DB=True
docker run -p 3000:3000 -p 8090:8090 -p 9090:9090 \
            --rm --name bdc-srv-ui-s3 \
            -e SERVER_HOSTNAME=host.docker.internal \
            -e DATABASE_HOSTNAME=host.docker.internal \
            -e DATABASE_USERNAME=bdc \
            -e DATABASE_PASSWORD=bdc \
            -e DATABASE_PORT=5436 \
            -e DATABASE_NAME=bdc \
            -e S3_ACCESS_HOSTNAME=host.docker.internal \
            -e S3_ACCESS_PORT=9090 \
            -e SAVE_FILES_TO_DB=True \
            -v "./bdc-ui/public:/app/bdc-ui/public" \
            -v "./bdc-ui/src:/app/bdc-ui/src" \
            -v "./bdc-srv/src:/app/bdc-src/src" \
            -v "./bdc-s3-access/src:/app/bdc-s3-access/src" \
            -v "./bdc-s3-access/s3_connection_info_prod.json:/app/bdc-s3-access/s3_connection_info.json" \
            -d dtr.research.ge.com/blade_digital_certificate/bdc-srv-ui-s3

echo currently running processes...
docker ps