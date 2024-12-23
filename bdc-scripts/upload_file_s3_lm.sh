#!/bin/sh
echo usage: ./upload_file_s3.sh filepath

# In case you need to configure npm proxy...

# export http_proxy=http://proxy.research.ge.com:80
# export https_proxy=http://proxy.research.ge.com:80 
# export no_proxy=host.docker.internal,localhost,127.0.0.1,.ge.com
# npm config set proxy "$http_proxy"
# npm config set https-proxy "$https_proxy"
# npm config set noproxy "$no_proxy"
# npm config set "strict-ssl" false -g

node ./test/uploadFileToS3.js LM $@