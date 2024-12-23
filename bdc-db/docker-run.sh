#!/bin/sh

echo
echo Note: Use this command to run the image as a stand-alone container.
echo Use docker compose to run the app with all its compoentns together.
echo
echo 
# the bdc_db_data volume is originally created by running docker-dev-compose.yml
# we reuseit here in a stand-alone form
# you can access this service from other docker containers in localhost using the address: host.docker.internal:5432
docker run -p 5432:5432 \
    -v bdc_db_data:/var/lib/postgresql/data \
    -e POSTGRES_USER="bdc" \
    -e POSTGRES_PASSWORD="bdc" \
    -e POSTGRES_DB="bdc" \
    -d dtr.research.ge.com/blade_digital_certificate/bdc-db