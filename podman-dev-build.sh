#!/bin/bash

git describe > bdc-ui/src/TAG

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

makedirs './bdc-srv/upload'

#echo using environment options:
#cat .env

ulimit -c unlimited && ulimit -f unlimited

#docker compose --env-file ./.env -f ./docker-compose.yml build 
podman compose -f ./docker-compose-dev.yml build

# Since we are mounting the whole ./bdc-ui we need to have something in node_modules
# cd ./bdc-ui
# npm install
# cd ..


