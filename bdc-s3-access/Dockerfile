ARG HTTP_PROXY
ARG HTTPS_PROXY 
ARG NO_PROXY

#FROM python:3.12-slim
# FROM python:3.10-bullseye
#FROM python:3.10-alpine3.19
FROM python:3.10-slim-bullseye

# Jenkins needs the proxy config
# ENV no_proxy=${NO_PROXY}
# ENV http_proxy=${HTTP_PROXY}
# ENV https_proxy=${HTTPS_PROXY}

USER root

# ENV http_proxy="http://proxy.research.ge.com:80"
# ENV https_proxy="http://proxy.research.ge.com:80"
# ENV no_proxy="localhost,127.0.0.1,.ge.com,.build.ge.com,github.build.ge.com"

RUN set -ex && apt-get update --fix-missing && apt-get upgrade -y

## set environment variables
#ENV PYTHONDONTWRITEBYTECODE=1

# same as python -u meaning unbuffered stdout and strerr
ENV PYTHONUNBUFFERED=1

# Turn on debug mode
ENV FLASK_DEBUG=1

WORKDIR /app

# temp download files folder
RUN mkdir -p /app/TEMP_DOWNLOAD_FILES_DIR

COPY requirements.txt /app/requirements.txt

RUN pip config set global.trusted-host "pypi.org  pypi.python.org files.pythonhosted.org"
RUN pip install --upgrade pip
RUN pip install --user -r requirements.txt
RUN pip install watchdog

# RUN pip freeze > requirements_freeze.txt

# Clean up
# RUN set -ex apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Install first then copy source so the requirements are not installed
# every time souce code changes

COPY /src /app/src

# Note we mount the actual config over this file in docker-compose.yml
COPY s3_connection_info.json /app/s3_connection_info.json
COPY shared/test_file.txt /app/test_file.txt


#CMD watchmedo auto-restart --directory=./ --pattern=*.py --recursive -- python src/app.py 
CMD watchmedo auto-restart --directory=./ --pattern=*.py --recursive -- python -u -m flask --app src/app run --no-reload --host=0.0.0.0 --port=9090