#!/bin/bash


echo saving latest bdc-srv and bdc-ui images to local dir...
docker image save dtr.research.ge.com/blade_digital_certificate/bdc-srv:latest | gzip > bdc-srv_latest.tar.gz
docker image save dtr.research.ge.com/blade_digital_certificate/bdc-ui:latest | gzip > bdc-ui_latest.tar.gz
ls -l *.tar.gz