#FROM timescale/timescaledb:latest-pg11
FROM postgres:15-alpine

# Note this line should be disabled the first time the image and volume for this container is created.
# the reason is an internal script that will run inittab to create  /var/lib/postgresql/data
# After that, it should be enabled so we can post our own configuration on top of the existing one
#COPY postgresql.conf /var/lib/postgresql/data/postgresql.conf