#!/bin/bash

echo using environment options:
cat .env

sudo docker compose -f ./docker-compose-arc.yml restart bdc-srv bdc-ui bdc-db

#docker compose --env-file ./.env -f ./docker-compose.yml down bdc-srv bdc-ui dbc-db
#docker compose --env-file ./.env -f ./docker-compose.yml up -d --no-deps bdc-db bdc-srv bdc-ui 

#docker compose --env-file ./.env -f ./docker-compose.yml up --force-recreate --build -d bdc-db bdc-srv bdc-ui

host=$(hostname -f)
echo
echo Services: 
echo DB port: 5436
echo Server Swagger UI: http://$host:8090/apidocs/#/
#echo Jenkins: http://$host:9099
echo UI: http://$host:3000/
echo
echo For localhost access replace $host with "localhost" or 127.0.0.1
echo
