#!/bin/sh
echo
echo building runtime image for defecte measurement service
echo

RUNTIME_IMAGE="dtr.research.ge.com/blade_digital_certificate/bdc-measurement"

echo "builder image"
echo $BUILDER_IMAGE

docker build \
    --build-arg http_proxy \
    --build-arg https_proxy \
    --build-arg no_proxy \
    -f docker/Dockerfile.aws \
    -t $RUNTIME_IMAGE .