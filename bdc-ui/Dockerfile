# Build time environment variables
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

#FROM node:lts-slim

# # =============================== GESOS base image + Node.js ==============================
# # use this image for localhost build
# #FROM debian:bullseye
# FROM python:3.10-bullseye
# #FROM 144538309574.dkr.ecr.us-east-1.amazonaws.com/gesos-base-debian:bullseye
# #FROM 144538309574.dkr.ecr.us-east-1.amazonaws.com/gesos-python:3.10-bullseye

# ENV http_proxy="http://proxy.research.ge.com:80"
# ENV https_proxy="http://proxy.research.ge.com:80"
# ENV no_proxy="localhost,127.0.0.1,.ge.com,.build.ge.com,github.build.ge.com"

# RUN apt-get update --fix-missing ; apt-get install ca-certificates -y
# #RUN apt-get update --fix-missing -y && apt-get upgrade -y

# # required by the node.js installation script
# RUN apt-get install curl gpg -y

# RUN curl --insecure -sL https://deb.nodesource.com/setup_20.x -o nodesource_setup.sh
# RUN bash nodesource_setup.sh
# RUN DEBIAN_FRONTEND=noninteractive apt-get install nodejs npm -y --no-install-recommends
# RUN node --version

# # RUN curl -fsSL http://deb.nodesource.com/setup_20.x | bash - 
# # RUN apt-get update --fix-missing; apt-get install -y --no-install-recommends nodejs npm
# # RUN node --version

# RUN npm config set strict-ssl false -g

# # this prevents an error: 'incompatible python 3.5 from ubuntu 16.01'
# RUN npm install --global npm@latest
# RUN npm --version
# # RUN npm install --global node-gyp@latest
# # RUN npm config set node_gyp $(npm prefix -g)/lib/node_modules/node-gyp/bin/node-gyp.js

# # The default value is around 512. The server has 8GM of RAM
# # Forces V8 garbage collection when memory reaches this value. 
# # V8 will also kill the worker if the memory goes beyond this threshold.
# # We need to increase it since the UI ng build and ng serve are using too much memory and crashing with 'Killed' by Linux
# # Also, the bs-parser needs lots of memory to work with large reports. This value gives the UI & parser room to breath, while define a safety threshold.
# ENV NODE_OPTIONS=--max-old-space-size=7168

# # ==========================================================================

FROM node:20-alpine3.19

# ENV no_proxy=$NO_PROXY
# ENV http_proxy=$HTTP_PROXY
# ENV https_proxy=$HTTPS_PROXY 

ENV no_proxy=${NO_PROXY}
ENV http_proxy=${HTTP_PROXY}
ENV https_proxy=${HTTPS_PROXY}

USER root

ENV http_proxy="http://proxy.research.ge.com:80"
ENV https_proxy="http://proxy.research.ge.com:80"
ENV no_proxy="localhost,127.0.0.1,.ge.com,.build.ge.com,github.build.ge.com"

#RUN apt-get update && apt-get upgrade -y

WORKDIR /app/

ENV NODE_OPTIONS=--max-old-space-size=7168
COPY package.json /app/package.json

RUN npm config set proxy "$http_proxy"
RUN npm config set https-proxy "$https_proxy"
RUN npm config set noproxy "$no_proxy"
RUN npm config set "strict-ssl" false -g
RUN npm config ls -l | grep proxy

# When using podman, we run out of file descriptors when using npm
# RUN ulimit -c unlimited && ulimit -f unlimited
RUN npm install -g npm
RUN npm install --legacy-peer-deps

# the solution was to use yarn instead of npm
#RUN npm install -g yarn --force
# RUN yarn config set proxy "$http_proxy"
# RUN yarn config set https-proxy "$https_proxy"
# RUN yarn config set noproxy "$no_proxy"
# RUN yarn config set "strict-ssl" false -g
# RUN yarn install

# Run install before copying the code so changes in the source code 
# will not trigger unecessary rebuild of ./node_modules
COPY public/ /app/public
COPY src/ /app/src

CMD ["npm", "start"]