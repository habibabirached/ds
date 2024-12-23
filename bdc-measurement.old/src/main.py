
from os import environ
import json
from pydantic import BaseModel
from typing import Optional, List
import logging

from fastapi import FastAPI, File, UploadFile

app = FastAPI(title="Blade Digital Certificate - Measurement API",
            description="API for measuring defect annotations",
            contact={
                "responsibleOrganization": "GE Vernova Advanced Research",
                "responsibleDeveloper": "Roberto Silva Filho",
                "email": "silva_filho@ge.com",
            },
            version="0.0.1",
            summary="Uses CAD model projections of shapes to calculate accurate measurement sizes")


class PanoramaImageProps(BaseModel):
    eqHeight: int
    eqWidth: int
    r: List[List[float]]
    tf: List[List[float]]
    pos_lidar: List[float]

# TODO: use this code to wrap the function at: https://github.build.ge.com/223114154/defect_measurement


@app.get("/hello")
def say_hello():
    return {'message': 'Hello World!'}


@app.post("/measure_defects")
def measure_defects(annotation_file:UploadFile = File(...), input_data: PanoramaImageProps=None):
    logging.info(f'input_data: {input_data}')
    annotation_json_data = json.load(annotation_file.file)
    return {"data_in_file": annotation_json_data}