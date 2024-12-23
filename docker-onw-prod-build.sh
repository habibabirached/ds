#!/bin/bash

git describe --tags --first-parent > bdc-ui/src/TAG

makedirs()
{
    dir=$1
    if [[ ! -e $dir ]]; then
        mkdir $dir
    elif [[ ! -d $dir ]]; then
        echo "$dir already exists but is not a directory" 1>&2
    fi
}

# example on how to call the function above
#makedirs './analytics/mainshaft_drift_estimation/input'
#makedirs './analytics/mainshaft_drift_estimation/output'

makedirs './bdc-srv/upload'

#echo using environment options:
#cat .env

aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 057064532517.dkr.ecr.us-east-1.amazonaws.com 
docker pull 057064532517.dkr.ecr.us-east-1.amazonaws.com/gesos-base-debian:bullseye
docker pull 057064532517.dkr.ecr.us-east-1.amazonaws.com/gesos-python:3.10-slim-bullseye
docker pull 057064532517.dkr.ecr.us-east-1.amazonaws.com/gesos-node:20-alpine3.19
docker pull 057064532517.dkr.ecr.us-east-1.amazonaws.com/gesos-python:3.10-alpine3.19


# docker pull docker.io/library/python:3.12-slim
# docker pull docker.io/library/postgres:15-alpine
# docker pull docker.io/library/node:lts-slim

#docker pull docker.io/jenkins/jenkins:lts-jdk17


#docker compose --env-file ./.env -f ./docker-compose.yml build 
sudo docker compose -f ./docker-compose-onw-prod.yml build 


