#!/bin/sh

export http_proxy=http://proxy.research.ge.com:80
export https_proxy=http://proxy.research.ge.com:80 
export no_proxy=host.docker.internal,localhost,127.0.0.1,.ge.com
npm config set proxy "$http_proxy"
npm config set https-proxy "$https_proxy"
npm config set noproxy "$no_proxy"
npm config set "strict-ssl" false -g