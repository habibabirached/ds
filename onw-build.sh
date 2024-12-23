#!/bin/bash

git describe --tags --first-parent > bdc-ui/src/TAG

# helper function
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

# docker pull docker.io/library/python:3.12-slim
# docker pull docker.io/library/postgres:15-alpine
# docker pull docker.io/jenkins/jenkins:lts-jdk17
# docker pull node:20-slim

docker pull ubuntu:22.04
docker build -t  dtr.research.ge.com/blade_digital_certificate/bdc-srv-ui-s3 . 


