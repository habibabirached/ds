
# see .env file for default values

ARG HTTP_PROXY
ARG HTTPS_PROXY 
ARG NO_PROXY
ARG REQUIRE_AUTHENTICATION

# Arguments with default values

#ARG HTTP_PROXY=http://PITC-Zscaler-Americas-Cincinnati3PR.proxy.corporate.ge.com:80
#ARG HTTPS_PROXY=http://PITC-Zscaler-Americas-Cincinnati3PR.proxy.corporate.ge.com:80
ARG NO_PROXY=localhost,127.0.0.1,.ge.com,reninspect_backend,reninspect_ui_new

# ARG HTTP_PROXY=http://proxy.research.ge.com:8080/
# ARG HTTPS_PROXY=http://proxy.research.ge.com:8080/ 
# ARG NO_PROXY=localhost,127.0.0.1,.ge.com,reninspect_backend,reninspect_ui

FROM node:22-slim
#FROM node:14-alpine

ENV no_proxy=${NO_PROXY}
ENV http_proxy=${HTTP_PROXY}
ENV https_proxy=${HTTPS_PROXY}

# Cypres library require caps
ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
ENV NO_PROXY=${NO_PROXY}
ENV REQUIRE_AUTHENTICATION ${REQUIRE_AUTHENTICATION}

RUN apt-get update \
    && apt-get upgrade -y

# Installing cert package may allow resolving the error to https://registry.npmjs.org/
RUN apt-get install ca-certificates -y
#COPY cert/GE_External_Root_CA_2.1.crt /usr/local/share/ca-certificates

# Create app directory within the containeer
WORKDIR /app

#RUN npm config set proxy ${HTTP_PROXY}
#RUN npm config set https-proxy ${HTTPS_PROXY}
RUN npm config set noproxy ${NO_PROXY}
RUN npm config set strict-ssl false

# Automatically reloads the app.js upon code change
# RUN npm install nodemon -g

# Copies package.json AND package-lock.json as well as config files as ormconfig.json
COPY *.json ./

# generates node_modules within the container
RUN npm install

# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY ./src ./src
COPY ./CSR ./CSR

# Overwirte config with dev config which uses localhost
COPY ./config_prod.json config.json 

# nodemon automatically reloads the app.js upon code change
# we use this to support docker-sync
CMD [ "node", "--watch-path=./src",  "src/app.js" ]