#!/bin/sh

echo Note: This script was created to be executed under /no_backup/BladeDigitalCertificate folder of vrn1masda.crd.ge.com VM
echo Running backup now...
docker run --rm --name bdc_db_backup_cmdline \
    -v bladedigitalcertificate_db_data:/backup/db_data:ro \
    -v /home/liuya/bdc_db_backup:/archive \
    -v /home/liuya/tmp:/tmp \
    -v /var/run/docker.sock:/var/run/docker.sock:ro \
    -e BACKUP_RETENTION_DAYS='3' \
    --entrypoint backup \
    offen/docker-volume-backup:latest
