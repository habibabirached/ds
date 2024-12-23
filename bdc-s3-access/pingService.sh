#!/bin/sh

# Test script used to post a file using the service
curl --header "Content-Type: application/json" \
  --request GET \
  http://localhost:9090/ping
