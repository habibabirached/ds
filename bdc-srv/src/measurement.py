# Measurements service interface, abstracting port and hostname

import uuid
#import requests
import logging
import os
import json
import httpx

logger = logging.getLogger()


SHARED_FOLDER = '/app/shared' # absolute path of shared folder with bdc_s3_access

MEASUREMENT_PORT = 8001
MEASUREMENT_ENV_PORT = os.getenv('MEASUREMENT_PORT')
if MEASUREMENT_ENV_PORT is not None:
    MEASUREMENT_PORT= MEASUREMENT_ENV_PORT
    print(f'read MEASUREMENT_HOSTNAME from env: {MEASUREMENT_ENV_PORT}')

MEASUREMENT_HOSTNAME = "bdc_measurement"
MEASUREMENT_ENV_HOSTNAME = os.getenv('MEASUREMENT_HOSTNAME')
if MEASUREMENT_ENV_HOSTNAME is not None:
    MEASUREMENT_HOSTNAME= MEASUREMENT_ENV_HOSTNAME
    print(f'read MEASUREMENT_HOSTNAME from env: {MEASUREMENT_ENV_HOSTNAME}')

print(f'MEASUREMENT_HOST: {MEASUREMENT_HOSTNAME}')
print(f'MEASUREMENT_PORT: {MEASUREMENT_PORT}')


def get_measurement_url():
    return f'http://{MEASUREMENT_HOSTNAME}:{MEASUREMENT_PORT}'


# def ping_measurement():
#     logging.info('ping_measurement() called')
#     url = get_measurement_url()+'/ping'
#     print(url)
#     response = requests.get(url)
#     return json.loads(response.content)


def ping_measurement_httpx():
    logging.info('ping_measurement() called')
    url = get_measurement_url()+'/ping'
    print(url)
    response = httpx.get(url)
    return json.loads(response.content)


# def get_measurements_json(annotation_json_file_content, frame_json_file_content):
#     logging.info(f'get_measurements_json() called')
#     files_to_upload = [
#         ("annotation_file", json.dumps(annotation_json_file_content)),
#         ("frame_file", json.dumps(frame_json_file_content))
#     ]
#     url = get_measurement_url()+'/measure_defects'
#     response = None
#     try:
#         response = requests.post(url, files=files_to_upload, timeout=30)
#     except requests.exceptions.HTTPError as err:
#         logging.info(f'error calculating measurement: {err}')
#     except requests.Timeout:
#         logging.info('request timet out')
#     content = None
#     if response is not None:
#         logging.info(f'response.content: {response.content}')
#         try:
#             content =  json.loads(response.content)
#         except json.JSONDecodeError as e:
#             logging.info(f'Error parsing response: {e}')
#     return content

def get_measurements_json_httpx(annotation_json_file_content, frame_json_file_content):
    logging.info(f'get_measurements_json() called')
    files_to_upload = [
        ("annotation_file", json.dumps(annotation_json_file_content)),
        ("frame_file", json.dumps(frame_json_file_content))
    ]
    url = get_measurement_url()+'/measure_defects'
    response = None
    try:
        response = httpx.post(url, files=files_to_upload, timeout=None) 
    except httpx.RequestError as err:
        logging.info(f'error calculating measurement: {err}')
    except httpx.Timeout:
        logging.info('request timed out')
    content = None

    if response is not None:
        logging.info(f'response.content: {response.content}')
        try:
            content =  json.loads(response.content)
        except json.JSONDecodeError as e:
            logging.info(f'Error parsing response: {e}')
    return content


# def get_measurements_str(annotation_str_file_content, frame_str_file_content):
#     logging.info(f'get_measurements_str() called')
#     files_to_upload = [
#         ("annotation_file", annotation_str_file_content),
#         ("frame_file", frame_str_file_content)
#     ]
#     url = get_measurement_url()+'/measure_defects'
#     try:
#         response = requests.post(url, files=files_to_upload)
#     except requests.exceptions.HTTPError as err:
#         logging.info(f'error calculating measurement: {err}')
    
#     if response is not None:
#         logging.info(f'response.content: {response.content}')
#         content = None
#         try:
#             content =  json.loads(response.content)
#         except json.JSONDecodeError as e:
#             logging.info(f'Error parsing response: {e}')

#     return content



