#!/bin/sh
echo
echo Note: Use this command to run the image as a stand-alone container.
echo Use docker compose to run the app with all its compoentns together.
echo
echo You can test the app by opening the browser: http://localhost:3000
echo 

docker run -p 3000:3000 --name bdc-ui --rm -v $(pwd)/.:/app/ -d dtr.research.ge.com/blade_digital_certificate/bdc-ui