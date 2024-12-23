# This is a Dockerfile that combines 3 components: UI, server and s3 access into one
# Was developed so we can use the gesos images as part of ONW CI-CD pipeline

#FROM python:3.10-bullseye
#FROM 144538309574.dkr.ecr.us-east-1.amazonaws.com/gesos-python:3.10-bullseye
#FROM 144538309574.dkr.ecr.us-east-1.amazonaws.com/gesos-ubuntu:22.04
FROM ubuntu:22.04

# ================================= bdc-ui NodeJS - common ============================

# RUN apt-get clean 

RUN apt-get update --fix-missing; apt-get install ca-certificates -y
#RUN apt-get update --fix-missing -y && apt-get upgrade -y

# required by the node.js installation script
RUN apt-get install curl gpg -y

# RUN curl  --insecure -sL https://deb.nodesource.com/setup_20.x -o nodesource_setup.sh
# RUN bash nodesource_setup.sh
# RUN DEBIAN_FRONTEND=noninteractive apt-get install nodejs -y
# RUN node --version

RUN apt-get update --fix-missing; apt-get install nodejs npm  --no-install-recommends -y



RUN npm config set strict-ssl false -g
RUN node --version

# this prevents an error: 'incompatible python 3.5 from ubuntu 16.01'
#RUN npm install --global npm@latest
#RUN npm --version
#RUN npm install --global node-gyp@latest
# RUN npm config set node_gyp $(npm prefix -g)/lib/node_modules/node-gyp/bin/node-gyp.js

# The default value is around 512. The server has 8GM of RAM
# Forces V8 garbage collection when memory reaches this value. 
# V8 will also kill the worker if the memory goes beyond this threshold.
# We need to increase it since the UI ng build and ng serve are using too much memory and crashing with 'Killed' by Linux
# Also, the bs-parser needs lots of memory to work with large reports. This value gives the UI & parser room to breath, while define a safety threshold.
ENV NODE_OPTIONS=--max-old-space-size=7168

# ================================= bdc-ui ===========================================

# Create app directory within the containeer
WORKDIR /app/bdc-ui

# Automatically reloads the app.js upon code change
# RUN npm install nodemon -g
#RUN rm /bin/sh && ln -s /bin/bash /bin/sh && npm install -g --unsafe-perm nodemon

# Copies package.json AND package-lock.json as well as config files as ormconfig.json
COPY ./bdc-ui/*.json ./

# generates node_modules within the container
RUN npm install --legacy-peer-deps

# Bundle app source
COPY ./bdc-ui/src ./src
COPY ./bdc-ui/public ./public

# ============================= bdc-src and bdc-s3-access Python common ===============================
#RUN apt-get install -y software-properties-common && add-apt-repository ppa:deadsnakes/ppa
#RUN apt-get update --fix-missing; apt-get install python3.12 python3.12-pip python3.12-setuptools --no-install-recommends -y

RUN apt-get update --fix-missing; apt-get install python3 python3-pip python3-setuptools --no-install-recommends -y
RUN pip config set global.trusted-host "pypi.org pypi.python.org files.pythonhosted.org"


# ========================================== bdc-s3-access ============================================

WORKDIR /app/bdc-s3-access
COPY ./bdc-s3-access/ ./

#RUN pip install pip setuptools
RUN pip install -r requirements.txt

# =========================================== bcd-srv requiremetns ==================================================

# Database access
RUN apt-get update --fix-missing; apt-get install --no-install-recommends -y libpq5 libpq-dev libgl1 libglib2.0-0 libsm6 libxrender1 libxext6

# pypy needs g++ if we use pypy:slim
# RUN apt-get install -y g++

# Note unoconv already install the fonts required for doc2pdf conversion
# RUN apt-get install --no-install-recommends -y unoconv

# doc2pdf requirement
RUN apt-get update --fix-missing; apt-get install -y --no-install-recommends libreoffice-writer libreoffice-java-common default-jre

# ---------
# Free alternative to MS CORE FONTS
# ---------
RUN apt-get update --fix-missing; apt-get install --no-install-recommends -y fontconfig fonts-liberation 
RUN fc-cache -f -v  


# ============================================= bdc-srv ==============================================

WORKDIR /app/bdc-srv
COPY ./bdc-srv/ ./

#RUN pip install pip setuptools
RUN pip install -r requirements.txt


# ====================================================================================================
WORKDIR /app

COPY ./dockerCMD.sh ./dockerCMD.sh

RUN mkdir /tmp/shared
RUN rm -rf /app/bdc-srv/shared
RUN rm -rf /app/bdc-s3-access/shared
RUN ln -sf /tmp/shared /app/bdc-srv/shared
RUN ln -sf /tmp/shared /app/bdc-s3-access/shared

RUN chmod +x ./dockerCMD.sh

#ENV UV_THREADPOOL_SIZE=16
ENV LANG=C.UTF-8


# This user has no write access to disk. Disabling it...
#USER gecloud

EXPOSE 3000
EXPOSE 8090
EXPOSE 9090

ENTRYPOINT ./dockerCMD.sh
