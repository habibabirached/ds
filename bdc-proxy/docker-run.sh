#!/bin/sh
echo
echo Note: Use this command to run the image as a stand-alone container.
echo Use docker compose to run the app with all its compoentns together.
echo
echo You can test the app by opening the browser: https://localhost:443
echo 
docker run -p 443:443 -d dtr.research.ge.com/reninspect/reninspect_proxy2