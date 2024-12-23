#!/bin/bash

podman machine stop
podman machine set --cpus 8 --memory 8000 --disk-size 100
podman machine start

