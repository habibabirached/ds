#!/bin/sh

echo Stopping server, ui and s3 access running together in a single container...
echo Stopping db
echo

docker stop bdc-srv-ui-s3 
docker stop onw-bdc-db 

echo
echo currently running processes...
docker ps