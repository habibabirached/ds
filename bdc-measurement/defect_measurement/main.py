
import os
import re
import json
import datetime
import logging
import asyncio

from pydantic import BaseModel
from typing import Optional, List
from fastapi import FastAPI, File, UploadFile
from threading import Lock

# from defect_measurement.measure_defects import measure_defects
import defect_measurement.measure_defects as md

"""
    Setup the internal structures of the measurements
"""
sections = ["Central_Web","Leading_Edge","Trailing_Edge"]
model_paths = []
for section in sections:
    model_paths.append(os.path.join(os.getcwd(), f"defect_measurement/models/{section}-75.STL"))
md.init(model_paths)

app = FastAPI(title="Blade Digital Certificate - Measurement API",
            description="API for measuring defect annotations",
            contact={
                "responsibleOrganization": "GE Vernova Advanced Research",
                "responsibleDeveloper": "Roberto Silva Filho",
                "email": "silva_filho@ge.com",
            },
            version="0.0.1",
            summary="Uses CAD model projections of shapes to calculate accurate measurement sizes")


# --------------------------------- Turn on log to console ---------------------------
from logging.config import dictConfig
# Provides a more comprehensive way to configure logging
dictConfig({
    'version': 1,
    'formatters': {'default': {
        'format': '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
    }},
    'handlers': {'wsgi': {
        'class': 'logging.StreamHandler',
        'formatter': 'default'
    }},
    'root': {
        'level': 'INFO',
        'handlers': ['wsgi']
    }
})

# turn on logger.info output in the console
# logging.basicConfig(level=logging.INFO)
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# handler = logging.StreamHandler(sys.stdout)
# -----------------------------------------------------------------------------------


# class PanoramaImageProps(BaseModel):
#     eqHeight: int
#     eqWidth: int
#     r: List[List[float]]
#     tf: List[List[float]]
#     pos_lidar: List[float]


@app.get("/ping")
def ping_api():
    return {'message': 'Service is up and running!'}


# regex to match against the section name to standardize it, incase it comes in some weird form
cw_regex = r'[cC]entral[_]*[wW]eb'
le_regex = r'[lL]eading[_]*[Ee]dge'
te_regex = r'[tT]railing[_]*[Ee]dge'

# mutex so the async calls dont step on one another since the server needs to hold class references in memory.
mutex = Lock()
measure_lock = Lock()

@app.post("/measure_defects")
async def measure_defects_api(annotation_file:UploadFile = File(...), frame_file:UploadFile = File(...)):
    logger.info("measuring defects")
    annotation_data = None
    frame_data = None

    try:
        annotation_data = json.load(annotation_file.file)
        frame_data = json.load(frame_file.file)
    except Exception as e:
        logger.error("Could not read input json")
        logger.error(f"{e}")
        return {'message': 'Could not read input json'}
    
    logger.info(f'annotation_data: {annotation_data}')
    logger.info(f'frame_data in main: {frame_data}')

    # Process annotation shapes 
    if 'shapes'  in annotation_data:
        for shape in annotation_data['shapes']:
            if 'label' not in shape:
                logger.warning(f"Shape without label found: {shape}. Assigning default label 'noLabel'.")
                shape['label'] = 'noLabel'  # Assign default label
    
    section = frame_data["sect"]

    if re.match(cw_regex, section):
        section = "Central_Web"
    elif re.match(le_regex, section):
        section = "Leading_Edge"
    elif re.match(te_regex, section):
        section = "Trailing_Edge"
    else:
        # TODO: hide this behind some admin level access. shouldn't print input data from http requests if this is publicly exposed.
        logger.debug(f"section {section} not one of known sections.")
        logger.error("Failed to determine section input data applies to")
        return {'message': "Failed to determine section input data applies to"}
    
    # TODO: this needs to be updated when more models are available.
    model_path = os.path.join(os.getcwd(), f"defect_measurement/models/{section}-75.STL")
    
    logger.info("starting measurement calc")

    # set a timeout to finish the calculation or returns
    json_output =  await asyncio.wait_for(run_measurement(model_path, annotation_data, frame_data), 60 * 5)
    logging.info(f'returning json_output: {json_output}')
    
    return json_output


async def run_measurement(model_path, annotation_data, frame_data):
    logger.info("starting measurement calc")
    json_output = {}

    #measure_lock.acquire()
    begin = datetime.datetime.now()
    output_json_str = md.measure_defects(model_path, None, annotation_data, frame_data, visualize=False)
    end = datetime.datetime.now()
    #measure_lock.release()

    runtime = end.timestamp() - begin.timestamp()
    logger.info(f'runtime: {runtime} s')
    logger.info(f'output_json_str: {output_json_str}')
    
    if output_json_str == None:
        json_output = {}
    else:
        json_output = json.loads(output_json_str)
    return json_output


@app.get('/test_measure_defects')
def measure_defects_test_api():
    logger.info("starting measurement test")
    model_path = os.path.join(os.getcwd(), "defect_measurement/models/Central_Web-75.STL")
    image_path = os.path.join(os.getcwd(), "images/test.jpg")

    annotation_data = None
    frame_data = None
    with open(os.path.join(os.getcwd(), 'json/example_annotation.json')) as a: 
        annotation_data = json.load(a)
    with open(os.path.join(os.getcwd(), 'json/example_frame.json')) as s:
        frame_data = json.load(s)
    
    begin = datetime.datetime.now()
    output_json_str = "{}"
    try:
        output_json_str = md.measure_defects(model_path, image_path, annotation_data, frame_data, visualize=False)
    except Exception as e:
        logger.error(e)

    end = datetime.datetime.now()
    runtime = end.timestamp() - begin.timestamp()
    logger.info(f'runtime: {runtime} ms')

    logger.info(f'output_json: {output_json_str}')
    json_output = json.loads(output_json_str)
    json_output['runtime'] = runtime
    return json_output

@app.get('/test_annotation_data')
def get_test_annotation_data_api():
    with open('./json/example_annotation.json') as a: 
        annotation_data = json.load(a) 
    return annotation_data

@app.get('/test_frame_data')
def get_test_annotation_data_api():
    frame_data = None
    with open('./json/example_frame.json') as s:
        frame_data = json.load(s)
    return frame_data




