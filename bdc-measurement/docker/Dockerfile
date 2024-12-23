# setup the runtime image, this is mostly just removing stuff from the builder image

ARG HTTP_PROXY
ARG HTTPS_PROXY 
ARG NO_PROXY

ARG http_proxy
ARG https_proxy
ARG no_proxy

ARG BUILDER_IMAGE

FROM python:3.10-bullseye

USER root

RUN apt-get update --fix-missing && apt-get install -y --no-install-recommends libgomp1 libx11-6 libgl1 libglib2.0-0 libsm6 libxrender1 libxext6 ffmpeg tk

EXPOSE 8001

# Keeps Python from generating .pyc files in the container
ENV PYTHONDONTWRITEBYTECODE=1

# Turns off buffering for easier container logging
ENV PYTHONUNBUFFERED=1

ENV PYTHONPATH=.

# Install pip requirements
# COPY requirements.txt .
# RUN python -m pip install -r requirements.txt
RUN pip3 install --upgrade setuptools[core] build

# add project source to image to build and install
WORKDIR /app
COPY defect_measurement /app/defect_measurement
COPY pyproject.toml /app/

RUN python3 -m build

RUN pip3 install dist/*.whl
RUN rm -rf /app/dist

# COPY /src ./src
COPY /json ./json
COPY /images ./images

# Creates a non-root user and adds permission to access the /app folder
# RUN useradd appuser && chown -R appuser /app
# USER appuser

ENTRYPOINT ["uvicorn", "defect_measurement.main:app", "--port", "8001", "--host", "0.0.0.0", "--reload"]