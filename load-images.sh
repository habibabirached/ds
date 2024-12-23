#!/bin/bash

echo loading images to local docker cache...
docker image load < bdc-srv_latest.tar.gz
docker image load < bdc-ui_latest.tar.gz