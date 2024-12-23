#!/bin/sh

# note the test file should be within the container

# Test script used to post a file using the service
curl --header "Content-Type: application/json" \
  --request GET \
  http://localhost:9090/getFileMetadataFromS3/upload_test/test_file.txt
