#!/bin/sh

# note the test file should be within the container

# Test script used to post a file using the service
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"Filepath":"/app/test_file.txt", "S3Key":"upload_test/test_file.txt"} ' \
  http://localhost:9090/submitFileToS3
