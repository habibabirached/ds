#!/bin/sh
echo
echo building runtime image for defecte measurement service
echo

BUILDER_IMAGE="dtr.research.ge.com/blade_digital_certificate/bdc-measurement:builder"
RUNTIME_IMAGE="dtr.research.ge.com/blade_digital_certificate/bdc-measurement"

if [ ! -f .builder ]; then
    docker build \
        --build-arg http_proxy \
        --build-arg https_proxy \
        --build-arg no_proxy \
        -f docker/Dockerfile.builder \
        -t $BUILDER_IMAGE .

    docker run -it -v $(pwd)/dist:/app/dist -w /app $BUILDER_IMAGE
    touch .builder
fi

echo "builder image"
echo $BUILDER_IMAGE

docker build \
    --build-arg http_proxy \
    --build-arg https_proxy \
    --build-arg no_proxy \
    --build-arg BUILDER_IMAGE=$BUILDER_IMAGE \
    -f docker/Dockerfile.im \
    -t $RUNTIME_IMAGE .
