ARG HTTP_PROXY
ARG HTTPS_PROXY 
ARG NO_PROXY

#FROM python:3.12-slim
#FROM debian:bullseye
FROM python:3.10-slim-bullseye

# ===================================== Python 3.12 ===============================

# WORKDIR /tmp

# RUN set -ex \
#   && apt-get update --fix-missing \
#   && apt-get upgrade -y \
#   && apt-get install --no-install-recommends -y wget

# RUN wget  --no-check-certificate https://www.python.org/ftp/python/3.12.4/Python-3.12.4.tgz
# RUN tar -xf Python-3.12.4.tgz
# WORKDIR /tmp/Python-3.12.4
# RUN ./configure --enable-optimizations
# RUN make -j8 build_all
# RUN make -j8 install
# RUN python --version

# ===================================== GE BASE IMAGES ====================================================
# This is only available in GE's AWS, will not work on localhost
#FROM 144538309574.dkr.ecr.us-east-1.amazonaws.com/gesos-base-ubuntu:22.04
#FROM 144538309574.dkr.ecr.us-east-1.amazonaws.com/gesos-base-debian:bullseye
#FROM 144538309574.dkr.ecr.us-east-1.amazonaws.com/gesos-python:3.10-bullseye

# Use one of these instead to build in your localhost + add python3 as below
# FROM ubuntu:22.04
# FROM debian:bullseye

# ENV LANG=C.UTF-8
# ENV DEBIAN_FRONTEND=noninteractive
# # USER root
# # RUN  apt-get install -y -q

# RUN chmod 777 /var/cache/debconf/
# RUN chmod 777 /var/cache/debconf/passwords.dat

# RUN apt-get update; apt-get install ca-certificates -y

# # ------------------------------------------- Python3 ----------------------------------------------------

# #RUN apt-get update --fix-missing -y
# #RUN apt-get install software-properties-common -y

# # RUN apt-get install -y --no-install-recommends apt-utils
# # RUN apt-get install gcc g++ -y
# # RUN apt-get install bash -y
# # RUN apt-get install unzip -y
# # RUN apt-get install curl -y

# RUN export LC_CTYPE=C.UTF-8
# RUN apt-get install python3 python3-dev python3-pip -y
# # RUN python3 -m ensurepip
# # RUN pip3 install pip setuptools
# # RUN pip3 install setuptools


# # ====================================================================================================


# pypy does not work with psycopg[binary]. It requires the pure python psycopg.
# Also, for sql queries, that use external libpg c libs, pypy is slower, so not worthit in this project.
#FROM pypy:latest

# Jenkins in masda needs the proxy config
ENV no_proxy=${NO_PROXY}
ENV http_proxy=${HTTP_PROXY}
ENV https_proxy=${HTTPS_PROXY}

USER root

ENV http_proxy="http://proxy.research.ge.com:80"
ENV https_proxy="http://proxy.research.ge.com:80"
ENV no_proxy="localhost,127.0.0.1,.ge.com,.build.ge.com,github.build.ge.com"

RUN set -ex \
  && apt-get update --fix-missing \
  && apt-get upgrade -y \
  && apt-get install --no-install-recommends -y libpq5 libpq-dev libgl1 libglib2.0-0 libsm6 libxrender1 libxext6 curl

RUN set -ex \
  && curl -fSsL "https://static.gecirtnotification.com/browser_remediation/packages/GE_External_Root_CA_2_1.crt" -o /etc/ssl/certs/GE_External_Root_CA_2_1.crt \
  && update-ca-certificates
 
# pypy needs g++ if we use pypy:slim
# RUN apt-get install -y g++

# Note unoconv already install the fonts required for doc2pdf conversion
# RUN apt-get install --no-install-recommends -y unoconv

# doc2pdf requirement
RUN apt-get update --fix-missing && apt-get install -y --no-install-recommends libreoffice-writer libreoffice-java-common default-jre

# ---------
# Free alternative to MS CORE FONTS
# ---------
RUN apt-get install  --no-install-recommends -y fontconfig fonts-liberation 
RUN fc-cache -f -v  

# remove apt cache
RUN apt-get clean -y

# ---------
# MS CORE FONTS
# ----------
# RUN echo "deb http://deb.debian.org/debian bookworm main contrib non-free \
#           deb-src http://deb.debian.org/debian bookworm main contrib non-free \
#           deb http://deb.debian.org/debian-security/ bookworm-security main contrib non-free \
#           deb-src http://deb.debian.org/debian-security/ bookworm-security main contrib non-free \
#           deb http://deb.debian.org/debian bookworm-updates main contrib non-free\ 
#           deb-src http://deb.debian.org/debian bookworm-updates main contrib non-free" | tee /etc/apt/sources.list
# RUN apt-get update && apt-get install -y --no-install-recommends fontconfig ttf-mscorefonts-installer

## set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# localtion where we store temp upload files
RUN mkdir -p /app/upload

COPY requirements.txt /app/requirements.txt

RUN pip config set global.trusted-host "pypi.org  pypi.python.org files.pythonhosted.org"
RUN pip install --upgrade pip
RUN pip install --user -r requirements.txt
RUN pip install watchdog


# RUN pip freeze > requirements_freeze.txt

# Clean up
RUN set -ex apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

# Install first then copy source so the requirements are not installed
# every time souce code changes

COPY /src /app/src

# Turn on debug mode
ENV FLASK_DEBUG=1

# same as python -u meaning unbuffered stdout and strerr
ENV PYTHONUNBUFFERED=1 


#CMD ["uvicorn", "src.app:app", "--reload", "--host=0.0.0.0", "--port=80"]
#CMD ["flask", "--app", "src/app", "run", "--host=0.0.0.0", "--port=80"]

# with debugpy on port 5678 using the folloiwng vscode debug config:
# {
#   "name": "Python: Remote Attach",
#   "type": "python",
#   "request": "attach",
#   "connect": { "host": "localhost", "port": 5679 },
#   "pathMappings": [
#     { "localRoot": "${workspaceFolder}", "remoteRoot": "." }
#   ],
#   "justMyCode": true
# }

# with debugpy
#RUN pip install debugpy
#CMD watchmedo auto-restart --directory=./ --pattern=*.py --recursive -- python -m debugpy --listen 0.0.0.0:5679 --wait-for-client -m flask --app src/app run --host=0.0.0.0 --port=88

# Multiple workers with gunicorn... 
# RUN pip install gunicorn
# WORKDIR /app/src
# CMD watchmedo auto-restart --directory=./ --pattern=*.py --recursive -- python -u -m gunicorn -w 4 --bind=0.0.0.0:88 --timeout 900 app:gunicorn_app

# Multiple workers with uWSGI... 
# RUN echo 'deb http://deb.debian.org/debian stable main' >> /etc/apt/sources.list && apt-get update && apt-get install -y --no-install-recommends -o APT::Immediate-Configure=false gcc g++
# RUN  pip install uWSGI
# #RUN echo 'deb http://deb.debian.org/debian stable main' >> /etc/apt/sources.list && apt-get update && apt-get install -y uwsgi-plugin-python3
# WORKDIR /app/src
# CMD watchmedo auto-restart --directory=./ --pattern=*.py --recursive -- python -u -m uwsgi --http 0.0.0.0:88 --master -p 4 -w app:gunicorn_app

EXPOSE 88

# very important to use --no-restart here otherwise the server will reload and freeze when docx files are produced.
CMD watchmedo auto-restart --directory /app/src --ignore-directories --patterns *.py --recursive -- python -u -m flask --app src/app run --no-reload --host=0.0.0.0 --port=88 --with-threads