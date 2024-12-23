#!/bin/sh

# install caddy first with: brew install Caddy

caddy reverse-proxy --from localhost:443 --to localhost:8080