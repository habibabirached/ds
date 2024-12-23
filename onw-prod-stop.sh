#!/bin/sh

echo Stopping server, ui and s3 access running together in a single container...
echo

docker stop bdc-srv-ui-s3 

echo
echo currently running processes...
docker ps