#!/bin/sh
echo
echo Note: due to GE proxy, please run it from within Internet to download the base image.
echo Then run it again from within BLUESSO 
echo
docker build -t dtr.research.ge.com/blade_digital_certificate/bdc-s3-access .
