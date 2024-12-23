# Defect Measurement Service

This dockerirzed service performs different measurements on annotations performed on 2d images of blades.
It utilizes a cad model and a projection of these points on the model to increase accuracy.

# Build, run and stop the service

This app requires docker engine to be pre-installed and running in the system.

1. Get Docker for your system: https://docs.docker.com/engine/install/
2. Clone this repository to a folder:

```
git clone git@github.build.ge.com:223114154/defect_measurement
```

## Build service

building can be done by running a docker build using the `Dockerfile` located in the docker directory

`docker built -t bdc-measurement -f docker/Dockerfile .`

### Building the wheel
```
./docker-build.sh
```
This will also generate two images one that builds the wheel and persists it to disk, and a second which the wheel is installed and used to run. 
The wheel will be generated to `dist/defect_measurement-0.0.1-py3-none-any.whl`
This wheel will be installale on most debian based linux distributions.

## Run service

```
./docker-run.sh
```

## Stop service

```
./docker-stop.sh
```



# Testing using the browser
The service provides a REST API and a SWAGGER UI interface that allows one to test its functionality.
1. Bulild and run the service using the instructions above
2. Open your browser using one the following Urls:

## Swagger UI:
http://localhost:8001/docs#/

## ReDoc documentation 
http://localhost:8001/redoc

# Testing using curl

```
curl -X 'GET' \
  'http://localhost:8001/measure_defects_test' \
  -H 'accept: application/json'
```

# Testing using command line

1. Install python dependences from requirements.txt file
```
python -m pip install -r requirements.txt
```
2. Run the test script:

```
python ./src/call_measure_defects_example
```