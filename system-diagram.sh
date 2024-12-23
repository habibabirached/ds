#!/bin/sh

#cat docker-compose.yml | docker run -i funkwerk/compose_plantuml --link-graph | docker run -i think/plantuml -tpng > system-diagram.png

echo Generating ./doc/system-diagram.png from docker-compose.yml
docker run --rm --name dcv -v .:/input -it pmsipilot/docker-compose-viz render -m image --force docker-compose.yml --output-file=./doc/system-diagram.png
echo Generating ./doc/system-diagram-dev.png from docker-compose-dev.yml
docker run --rm --name dcv -v .:/input -it pmsipilot/docker-compose-viz render -m image --force docker-compose-dev.yml --output-file=./doc/system-diagram-dev.png
echo Generating ./doc/system-diagram-aws.png from docker-compose-aws.yml
docker run --rm --name dcv -v .:/input -it pmsipilot/docker-compose-viz render -m image --force docker-compose-aws.yml --output-file=./doc/system-diagram-aws.png