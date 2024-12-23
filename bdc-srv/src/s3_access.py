# Interface between the server and teh s3 access service

import uuid
#import requests
import httpx

import logging
import os

logger = logging.getLogger()


SHARED_FOLDER = '/app/shared' # absolute path of shared folder with bdc_s3_access

S3_ACCESS_PORT = 9090
S3_ACCESS_ENV_PORT = os.getenv('S3_ACCESS_PORT')
if S3_ACCESS_ENV_PORT is not None:
    S3_ACCESS_PORT= S3_ACCESS_ENV_PORT
    print(f'read S3_ACCESS_HOSTNAME from env: {S3_ACCESS_ENV_PORT}')

S3_ACCESS_HOSTNAME = "bdc_s3_access"
S3_ACCESS_ENV_HOSTNAME = os.getenv('S3_ACCESS_HOSTNAME')
if S3_ACCESS_ENV_HOSTNAME is not None:
    S3_ACCESS_HOSTNAME= S3_ACCESS_ENV_HOSTNAME
    print(f'read S3_ACCESS_HOSTNAME from env: {S3_ACCESS_ENV_HOSTNAME}')

print(f'S3_ACCESS_HOST: {S3_ACCESS_HOSTNAME}')
print(f'S3_ACCESS_PORT: {S3_ACCESS_PORT}')

def get_inspection_s3key(inspection):
    esn = inspection.esn    
    if esn is None or esn.strip() == '':
        esn = 'unknown_esn'
    esn = esn.lower()

    business_key = esn.split('-')[0] # tpi or lm
    if business_key is None or business_key.strip() == '':
        business_key = 'unknown_business'
    elif (business_key.strip().lower() not in ['lm','tpi','bao']):
        business_key = 'LM'        
    business_key = business_key.lower()

    # 000112-77.4P3-32
    
    manufacture_stage = inspection.manufacture_stage
    if manufacture_stage is None or manufacture_stage.strip() == '':
        manufacture_stage = 'unknown_manufacture_stage'
    manufacture_stage = manufacture_stage.lower()

    # upload date is more trustworthy since it it set by the system and not the user
    key_date = inspection.date.isoformat()
    if inspection.upload_date is not None:
        key_date = inspection.upload_date.isoformat()

    if key_date is None or key_date.strip() == '':
        key_date = 'unknown_upload_date'
    
    sect = inspection.sect
    if sect is None or sect.strip() == '':
        sect = 'unknown_cavity'
    sect = sect.lower()

    # key_date iso date uses upper letter T so dont change that.
    s3key = (business_key+'/'+esn+'/'+manufacture_stage+'/'+key_date+'/'+sect).replace(' ','_')
    logging.info(f'get_inspection_s3key() returns: {s3key}')
    return s3key


def get_s3_access_url():
    return f'http://{S3_ACCESS_HOSTNAME}:{S3_ACCESS_PORT}'


def upload_content_to_s3(image_file_content, s3key):
    logging.info(f'upload_content_to_s3() called with: {s3key}')
    temp_image_path = None
    resp = None
    if image_file_content is not None and s3key is not None:
        file_name = s3key.split('/')[-1]
        unique_name = str(uuid.uuid4())
        temp_image_filename = unique_name+'_'+file_name
        temp_image_path = os.path.join(
            SHARED_FOLDER , temp_image_filename)
        with open(temp_image_path, "wb") as img_file:
            img_file.write(image_file_content)

        url = get_s3_access_url()+'/submitFileToS3'
        myobj = {
            "Filepath": temp_image_path,
            "S3Key": s3key
        }
        #resp = requests.post(url, json = myobj)
        resp = httpx.post(url, json = myobj)
        if os.path.isfile(temp_image_path):
            os.remove(temp_image_path)
    else:
        logging.info('Error s3key or image_file_content is None')
    return resp


def download_file_from_s3(s3key, destination_path):
    logging.info(f'download_file_from_s3() called with: {s3key}')
    resp = None
    if s3key is not None:
        #S3_BASE_PATH='/blade_digital_certificate'
        #baseUrl = get_s3_access_url()+'/getFileFromS3Path'+S3_BASE_PATH
        baseUrl = get_s3_access_url()+'/getFileFromS3'
        getFileUrl = baseUrl+'/'+s3key
        #resp = requests.get(getFileUrl)
        resp = httpx.get(getFileUrl)
        # TODO: check resp.status_code
        with open(destination_path, 'wb') as f:
            f.write(resp.content)
    else:
        logging.info('Error: s3key is None')


def get_file_content_from_s3(s3key):
    logging.info(f'get_file_content_from_s3() called with: {s3key}')
    file_content = None
    if s3key is not None:
        unique_name = str(uuid.uuid4())
        filename = s3key.split('/')[-1]
        temp_image_filename = unique_name+'_'+filename
        temp_image_path = os.path.join(SHARED_FOLDER , temp_image_filename) 
        download_file_from_s3(s3key, temp_image_path)
        with open(temp_image_path, mode="rb") as f:
            file_content = f.read()
        if os.path.isfile(temp_image_path):
            os.remove(temp_image_path)
    else:
        logging.info('Error: s3key is None')

    return file_content

