#!/bin/sh
docker stop $(docker ps -q --filter ancestor=borescope-s3-access )
docker run -p 9090:9090 borescope-s3-access