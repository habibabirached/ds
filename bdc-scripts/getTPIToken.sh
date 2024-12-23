#!/bin/sh

curl --location --request POST 'https://apis-dev.rendigital.apps.ge.com/auth/realms/RENDS/protocol/openid-connect/token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'client_id=digital-blade-cert-client' \
--data-urlencode 'client_secret=1d01683d-d71a-4e7e-b027-6fb9634db3c3' \
--data-urlencode 'grant_type=client_credentials' \
--data-urlencode 'scope=profile'