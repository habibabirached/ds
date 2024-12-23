#!/bin/sh

echo Note: this only works on dev environment for a db running in localhost 
echo running: "$@"

docker exec -it  bladedigitalcertificate-bdc-db-1 /bin/sh -c "psql -p 5436 -d bdc -U bdc -c '$@' " 