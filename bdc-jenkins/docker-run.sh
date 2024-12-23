#!/bin/sh


docker run -p 9090:8080 -p 50000:50000 --restart=on-failure \
-v jenkins_home:/var/jenkins_home dtr.research.ge.com/blade_digital_certificate/bdc-jenkins \
-v /var/run/docker.sock:/var/run/docker.sock\
--group-add 0