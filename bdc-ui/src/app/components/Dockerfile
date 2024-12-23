# This is a Dockerfile that combines 3 components: UI, server and s3 access into one
# Developed to use the gesos images as part of ONW CI-CD pipeline

FROM ubuntu:22.04

# ================================= bdc-ui NodeJS - common ============================

# Refresh the repository and fix GPG key issues
RUN apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends ca-certificates curl gpg && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key | gpg --dearmor -o /usr/share/keyrings/nodesource.gpg && \
    apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 9FD3B784BC1C6FC31C88A08A3B5ADA74F55810C1

# Update the package list and install Node.js and npm
RUN apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends nodejs npm && \
    npm config set strict-ssl false -g && \
    node --version

# Set the NODE_OPTIONS to increase memory allocation for Node.js processes
ENV NODE_OPTIONS=--max-old-space-size=7168

# ================================= bdc-ui ===========================================

WORKDIR /app/bdc-ui

COPY ./bdc-ui/*.json ./

RUN npm install --legacy-peer-deps

COPY ./bdc-ui/src ./src
COPY ./bdc-ui/public ./public

# ============================= bdc-src and bdc-s3-access Python common ===============================

RUN apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends python3 python3-pip python3-setuptools

RUN pip config set global.trusted-host "pypi.org pypi.python.org files.pythonhosted.org"

# ========================================== bdc-s3-access ============================================

WORKDIR /app/bdc-s3-access
COPY ./bdc-s3-access/ ./

RUN pip install -r requirements.txt

# =========================================== bcd-srv requirements =====================================

# Install required libraries for PostgreSQL and other dependencies
RUN apt-get update --fix-missing && \
    apt-get install --no-install-recommends -y libpq5 libpq-dev libgl1 libglib2.0-0 libsm6 libxrender1 libxext6

# Install libreoffice and related dependencies for doc2pdf conversion
RUN apt-get update --fix-missing && \
    apt-get install --no-install-recommends -y libreoffice-writer libreoffice-java-common default-jre

# Install free fonts for PDF generation
RUN apt-get update --fix-missing && \
    apt-get install --no-install-recommends -y fontconfig fonts-liberation && \
    fc-cache -f -v

# ============================================= bdc-srv ==============================================

WORKDIR /app/bdc-srv
COPY ./bdc-srv/ ./

RUN pip install -r requirements.txt

# ====================================================================================================

WORKDIR /app

COPY ./dockerCMD.sh ./dockerCMD.sh

RUN mkdir /tmp/shared && \
    rm -rf /app/bdc-srv/shared && \
    rm -rf /app/bdc-s3-access/shared && \
    ln -sf /tmp/shared /app/bdc-srv/shared && \
    ln -sf /tmp/shared /app/bdc-s3-access/shared && \
    chmod +x ./dockerCMD.sh

# Set environment variables
ENV LANG=C.UTF-8

# Expose ports
EXPOSE 3000
EXPOSE 8090
EXPOSE 9090

ENTRYPOINT ./dockerCMD.sh
