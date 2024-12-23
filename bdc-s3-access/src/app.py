#!/usr/bin/env python

import sys
import boto3
from os import listdir, system, popen
from os.path import isfile, join, abspath, exists
from botocore.client import Config

from flasgger import Swagger

import os
import time
import logging
from pathlib import Path

import json
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

import threading

# Disable 'InsecureRequestWarning: Unverified HTTPS request is being made.'
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger()

app = Flask(__name__)
# cors = CORS(app, resources={r'/*': {'origins': '*'}}) # NOSONAR

# =================================== Init swagger UI ===================================
template = {
    "swagger": "2.0",
    "info": {
    "title": "S3 Access API",
    "description": "API for uploading/downloading files from S3",
    "contact": {
        "responsibleOrganization": "GE Vernova Research",
        "responsibleDeveloper": "Roberto Silva Filho",
        "email": "silva_filho@ge.com",
    },
    "version": "0.0.1"
    },
    #"host": "mysite.com",  # overrides localhost:500
    #"basePath": "/api",  # base bash for blueprint registration
    #"schemes": [
    #  "http",
    #  "https"
    #],
    #"operationId": "getmyData"
}
# api = Api(app)
swagger = Swagger(app, template=template)
# Swagger will be running at: http://localhost:9090/apidocs/#
# ======================================================================================



DEFAULT_S3_BUCKET = None 
awsSession = None
s3 = None
KMS_KEY_NAME = None
BUCKET_DIRECTORY=None

DOWNLOAD_FILES_TIMEOUT = 600
TEMP_DOWNLOAD_FILES_DIR = os.path.join(os.path.normpath(os.getcwd() + os.sep ), "TEMP_DOWNLOAD_FILES") + os.sep
CLEAN_TEMP_INTERVAL = 60

S3_NOT_CONFIGURED_MSG = "S3 is not configured!"

# /app/shared
sharedFolder = os.path.join(os.path.normpath(os.getcwd() + os.sep ), "shared") + os.sep
sharedInputFolder = os.path.join(sharedFolder, "input") + os.sep
sharedOutputFolder = os.path.join(sharedFolder, "output") + os.sep

 
def get_object_list_from_s3(prefix):
    logger.info(BUCKET_DIRECTORY+prefix)
    # try: # NOSONAR
    #     s3.head_object(Bucket=DEFAULT_S3_BUCKET , Prefix=(BUCKET_DIRECTORY+prefix)) # NOSONAR
    # except Exception as e: # NOSONAR
    #     return [] # NOSONAR
    return s3.list_objects(Bucket=DEFAULT_S3_BUCKET , Prefix=(BUCKET_DIRECTORY+prefix))
    # return s3.list_objects_v2(Bucket=(BUCKET_DIRECTORY+prefix)) # NOSONAR

def get_object_metadata_from_s3(prefix):
    logger.info(BUCKET_DIRECTORY+prefix)
    
    return s3.head_object(Bucket=DEFAULT_S3_BUCKET , Key=(BUCKET_DIRECTORY+prefix))
    
# filepath is the destination
# key is relative to BUCKET + BUCKET_DIRECTORY    
def download_file_from_s3(key, destinationPath):
    global s3, DEFAULT_S3_BUCKET,awsSession, BUCKET_DIRECTORY

    logger.info(f"download file from S3: {str(BUCKET_DIRECTORY+key)}, {str(destinationPath)}")
    s3.download_file(DEFAULT_S3_BUCKET, (BUCKET_DIRECTORY+key), destinationPath)

# filepath is the local destination
# path is the full path including BUCKET_DIRECTORY and KEY
def download_file_from_s3_path(s3Path, destinationPath):
    global s3, DEFAULT_S3_BUCKET,awsSession

    logger.info("download file from S3 path: ", s3Path, destinationPath)
    s3.download_file(DEFAULT_S3_BUCKET, s3Path, destinationPath)

def create_get_presigned_url(key):
    global s3, DEFAULT_S3_BUCKET,awsSession, BUCKET_DIRECTORY

    response = s3.generate_presigned_url('get_object', Params={'Bucket': DEFAULT_S3_BUCKET, 'Key': (BUCKET_DIRECTORY+key)}, ExpiresIn=3600)
    return response

def create_put_presigned_url(key):
    global s3, DEFAULT_S3_BUCKET,awsSession, BUCKET_DIRECTORY

    response = s3.generate_presigned_url('put_object', Params={'Bucket': DEFAULT_S3_BUCKET, 'Key': (BUCKET_DIRECTORY+key)}, ExpiresIn=3600)
    return response

def download_object_from_s3(key):
    global s3, DEFAULT_S3_BUCKET,awsSession, BUCKET_DIRECTORY

    response = s3.get_object(Bucket=DEFAULT_S3_BUCKET, Key=(BUCKET_DIRECTORY+key))
    return response

def upload_object_to_s3(body, acl, key):
    global s3, DEFAULT_S3_BUCKET,awsSession, BUCKET_DIRECTORY

    response = s3.put_object(Bucket=DEFAULT_S3_BUCKET, Body=body, Key=(BUCKET_DIRECTORY+key), ServerSideEncryption ='aws:kms', SSEKMSKeyId=KMS_KEY_NAME)#, ServerSideEncryption="aws:kms", SSEKMSKeyId='15f4db8b-fbaf-4a12-b783-aced5894be7b') # NOSONAR
    return response

def upload_temp_file_to_s3(filename, acl, key):
    global s3, DEFAULT_S3_BUCKET,awsSession, BUCKET_DIRECTORY

    logger.info("POST to S3: filename="+filename+", KMSKEY="+KMS_KEY_NAME+", directory="+BUCKET_DIRECTORY+", key="+key)

    response = s3.put_object(Bucket=DEFAULT_S3_BUCKET, Body=open(filename, 'rb'), ACL=acl, Key=(BUCKET_DIRECTORY+key), ServerSideEncryption ='aws:kms', SSEKMSKeyId=KMS_KEY_NAME)
    # s3_client = boto3.client('s3', verify=False) # NOSONAR
    # response = s3_client.upload_file(filename, DEFAULT_S3_BUCKET, (BUCKET_DIRECTORY+key), ExtraArgs={"ServerSideEncryption":'aws:kms', "SSEKMSKeyId":KMS_KEY_NAME}) #, ServerSideEncryption="aws:kms", SSEKMSKeyId='15f4db8b-fbaf-4a12-b783-aced5894be7b') # NOSONAR
    return response


def aws_config(s3Bucket, bucketDirectory, kmsKeyName):
    global s3, DEFAULT_S3_BUCKET,BUCKET_DIRECTORY, KMS_KEY_NAME, awsSession
    BUCKET_DIRECTORY = bucketDirectory
    KMS_KEY_NAME = kmsKeyName
    DEFAULT_S3_BUCKET = s3Bucket
    #boto3.setup_default_session(region_name='us-east-1') # NOSONAR
    #s3 = boto3.resource('s3', verify=False) # NOSONAR
    logger.info(s3Bucket)
    # s3 = awsSession.client('s3', verify=False) # NOSONAR
    # config = Config(signature_version='s3v4') # NOSONAR

    # s3 = boto3.resource("s3", config=config, region_name="us-east-1", verify=False) # NOSONAR
    
    # logger.info(s3.list_objects(Bucket=DEFAULT_S3_BUCKET, Prefix="borescope-upload/")) # NOSONAR
    # s3.head_object(Bucket=str(s3Bucket), Key=borescope-upload/) # NOSONAR

    s3 = boto3.client('s3', config=Config(signature_version='s3v4'), verify=False)
    # s3 = awsSession.client('s3', verify=False) # NOSONAR

    logger.info(f"AWS configured for python web services: {s3}")


def cleanup_config():
    global s3, DEFAULT_S3_BUCKET, awsSession, BUCKET_DIRECTORY

    DEFAULT_S3_BUCKET = None 
    awsSession = None
    s3 = None
    KMS_KEY_NAME = None
    BUCKET_DIRECTORY=None

    logger.info("AWS configuration: Variables cleaned up before shutting down services.")


def cpf_2s3 (fileName,  localPathName, s3PathName ):  #path should end with / ex: cp2S3('carcour2/', '/Users/GE/python/junk/', 'test.py')
    my_key = join(s3PathName ,fileName)
    response = s3.put_object(Bucket=DEFAULT_S3_BUCKET, Body=open(join (localPathName , fileName) , 'rb'), ACL='bucket-owner-full-control')#, Key=my_key, ServerSideEncryption="aws:kms", SSEKMSKeyId='15f4db8b-fbaf-4a12-b783-aced5894be7b')


def cpd_2s3 (localPathName, s3PathName ):
    onlyfiles = [f for f in listdir(localPathName) if isfile(join(localPathName, f))]
    for f in onlyfiles :
        logger.info ("transfering file: ", f)
        cpf_2s3(f,  localPathName, s3PathName )


def cpd_from_s3 (dir, localDir):    
    global s3
    logger.info("In copy from s3 function", dir, localDir)
    resp = s3.list_objects(Bucket=DEFAULT_S3_BUCKET , Prefix=dir)
    for key in resp['Contents']:
        fileName = key['Key'].replace(    (dir+'/')  ,  ''  ) 
        logger.info(key['Key'], ' -- ',  dir , '  --  ', fileName)        
        s3.download_file(DEFAULT_S3_BUCKET, key['Key'], join (localDir, fileName ))#, ServerSideEncryption="aws:kms", SSEKMSKeyId='15f4db8b-fbaf-4a12-b783-aced5894be7b' )


def cpd_from_s3_file_extension (dir, localDir, fileExtension):    
    global s3
    logger.info("In copy from s3 function", dir, localDir)
    resp = s3.list_objects(Bucket=DEFAULT_S3_BUCKET , Prefix=dir)
    for key in resp['Contents']:
        fileName = key['Key'].replace(    (dir+'/')  ,  ''  ) 
        if fileExtension not in fileName or "/" in fileName:
            logger.info("skipping "+fileName)
            continue
        logger.info(key['Key'], ' -- ',  dir , '  --  ', fileName)        
        s3.download_file(DEFAULT_S3_BUCKET, key['Key'], join (localDir, fileName ) )



def clean_temp_folder():
    while(True):
        #logger.info("Clean up temp folder now...") # NOSONAR
        for root, dirs, files in os.walk(TEMP_DOWNLOAD_FILES_DIR, topdown=False):
            for name in files:
                filepath = join(TEMP_DOWNLOAD_FILES_DIR, name)
                lastUpdate = 0
                try:
                    file_stat = stat(filepath)
                    lastUpdate = file_stat.st_mtime
                except Exception as e:
                    logger.info(e)
                    pass
                    
                if time.time() - lastUpdate > DOWNLOAD_FILES_TIMEOUT:
                    os.remove(filepath)
                    #logger.info("ROMOVED", filepath)

        time.sleep(CLEAN_TEMP_INTERVAL)


#================================ REST APIs ==================================

@app.route('/ping', methods=['GET'])
def ping():
    """
    Ping this server to check whether it is alive
    ---
    responses:
        200:
          description: Ping message
          schema:
            id: PingObject
            properties:
            Status:
              type: string
              example: "S3 access service is running"
    """  
    logging.info('/ping called')  
    try: 
        resp = jsonify({"Status":"S3 access service is running"})
        resp.status_code = 200
        return resp     

    except Exception as e:
        resp = jsonify({"result": "error getting the status: "+str(e)})
        resp.status_code = 403
        return resp 

@app.route('/getFileMetadataFromS3/<path:prefix>', methods=['GET'])
def get_file_metadata_from_s3(prefix):
    """
    Get file metadata from S3
    ---
    parameters:
      - in: prefix
        required: true
        name: key
        schema:
          type: string
        example: upload_test/test_file.txt
        description: Path of the file to download relative to s3 bucket directory
    responses:
        200:
          description: file metadata json as produced by S3
          schema:
            type: object
    """
    try: 
        if not s3:
            logger.info(S3_NOT_CONFIGURED_MSG)
            raise Exception(S3_NOT_CONFIGURED_MSG)

        logger.info("trying to get file metadata from S3 bucket with prefix="+str(prefix))
        response = get_object_metadata_from_s3(prefix)
        logger.info(response)
        resp = jsonify(response)
        # resp = response['Contents'] # NOSONAR
        resp.status_code = 200
        return resp     

    except Exception as e:
        resp = jsonify({"result": "error retrieving metadata from file "+prefix+": "+str(e)})
        resp.status_code = 500
        return resp 

@app.route('/getListFromS3/<path:prefix>', methods=['GET'])
def get_list_from_s3(prefix):
    """
    Get file list from S3
    ---
    parameters:
      - in: path
        required: true
        name: prefix
        schema:
          type: string
        description: relative path from s3 bucket
    responses:
        200:
          description: Created inspection
          schema:
            id: ContentsFromS3
            properties: 
              Contents:
                type: array
                items:
                  schema:
                    type: string
                example: ["/a/b/c","a'b/d","a/b/e"]
    """
    try: 
        if not s3:
            logger.info(S3_NOT_CONFIGURED_MSG)
            raise Exception(S3_NOT_CONFIGURED_MSG)

        logger.info("trying to get list from S3 bucket with prefix="+str(prefix))
        response = get_object_list_from_s3(prefix)
        #logger.info(response)
        resp = jsonify({"Contents":response['Contents']})
        # resp = response['Contents'] # NOSONAR
        resp.status_code = 200
        return resp     

    except Exception as e:
        resp = jsonify({"result": "error retrieving list: "+str(e)})
        resp.status_code = 500
        return resp 

# key here is the relative path to the bucket + bucket_directory e.g. {serialNumeber}/{reportDate}/filename.ext
# if the the BUCKET_NAME is uai3028391-specpower-gp-power-us-east
# and if the BUCKET_DIRECTORY is : borescope-upload/stage
# the full s3 key will be: uai3028391-specpower-gp-power-us-east/borescope-upload/stage/{serialNumeber}/{reportDate}/filename.ext
@app.route('/getFileFromS3/<path:key>', methods=['GET'])
def get_file_from_s3(key):
    """
    Get file from S3
    ---
    parameters:
      - in: path
        required: true
        name: key
        schema:
          type: string
        description: Path of the file to download relative to s3 bucket directory
    responses:
        200:
          description: file content
          schema:
            type: file
    """

    try: 
        if not s3:
            logger.info(S3_NOT_CONFIGURED_MSG)
            raise Exception(S3_NOT_CONFIGURED_MSG)

        fileName = key.replace('/','_') 
        filepath = join(TEMP_DOWNLOAD_FILES_DIR,fileName)

        download_file_from_s3(key,filepath)

        if exists(filepath):
            resp = send_file(abspath(filepath), conditional=True)

            ext = Path(key).suffix
            if ext == '.png':
                resp.headers['Content-Type'] = 'image/png'
            elif ext == '.jpg':
                resp.headers['Content-Type'] = 'image/jpeg'
            elif ext == '.jpeg':
                resp.headers['Content-Type'] = 'image/jpeg'
            elif ext == '.m4v':
                resp.headers['Content-Type'] = 'video/mp4'
            elif ext == '.mpg':
                resp.headers['Content-Type'] = 'video/mpeg'
            elif ext == '.mpeg':
                resp.headers['Content-Type'] = 'video/mpeg'
            elif ext == '.mov':
                resp.headers['Content-Type'] = 'video/quicktime'
            elif ext == '.mp4':
                resp.headers['Content-Type'] = 'video/mp4'
            elif ext == '.avi':
                resp.headers['Content-Type'] = 'video/avi'
            elif ext == '.pdf':
                resp.headers['Content-Type'] = 'application/pdf'
            elif ext == '.csv':
                resp.headers['Content-Type'] = 'text/csv'

            resp.headers['Content-Disposition'] = 'attachment; filename='+Path(key).name
            return resp
        else:
            raise Exception("download error! cannot find filepath: "+ str(filepath))

    
    except Exception as e:
        resp = jsonify({"result": "error retrieving "+key+" obj from S3: "+str(e)})
        resp.status_code = 500
        return resp  

# key here is the full path to the file relative to bucket e.g. borescope-upload/stage/{serialNumeber}/{reportDate}/filename.ext 
# if the the BUCKET_NAME is uai3028391-specpower-gp-power-us-east
# and if the key is : borescope-upload/stage/{serialNumeber}/{reportDate}/filename.ext 
# the full s3 key will be: uai3028391-specpower-gp-power-us-east/borescope-upload/stage/{serialNumeber}/{reportDate}/filename.ext 
@app.route('/getFileFromS3Path/<path:key>', methods=['GET'])
def get_file_from_s3_path(key):
    """
    Get file from S3
    ---
    parameters:
      - in: path
        required: true
        name: key
        schema:
          type: string
        description: Relative path of the bucket
    responses:
        200:
          description: file content
          schema:
            type: file
    """
    try: 
        if not s3:
            logger.info(S3_NOT_CONFIGURED_MSG)
            raise Exception(S3_NOT_CONFIGURED_MSG)

        fileName = key.replace('/','_') 
        filepath = join(TEMP_DOWNLOAD_FILES_DIR,fileName)

        # e.g. 
        download_file_from_s3_path(key,filepath)

        if exists(filepath):
            resp = send_file(abspath(filepath), conditional=True)

            ext = Path(key).suffix
            if ext == '.png':
                resp.headers['Content-Type'] = 'image/png'
            elif ext == '.jpg':
                resp.headers['Content-Type'] = 'image/jpeg'
            elif ext == '.jpeg':
                resp.headers['Content-Type'] = 'image/jpeg'
            elif ext == '.m4v':
                resp.headers['Content-Type'] = 'video/mp4'
            elif ext == '.mpg':
                resp.headers['Content-Type'] = 'video/mpeg'
            elif ext == '.mpeg':
                resp.headers['Content-Type'] = 'video/mpeg'
            elif ext == '.mov':
                resp.headers['Content-Type'] = 'video/quicktime'
            elif ext == '.mp4':
                resp.headers['Content-Type'] = 'video/mp4'
            elif ext == '.avi':
                resp.headers['Content-Type'] = 'video/avi'
            elif ext == '.pdf':
                resp.headers['Content-Type'] = 'application/pdf'
            elif ext == '.csv':
                resp.headers['Content-Type'] = 'text/csv'

            resp.headers['Content-Disposition'] = 'attachment; filename='+Path(key).name
            return resp
        else:
            raise Exception("download error! cannot find filepath: "+ str(filepath))

    
    except Exception as e:
        resp = jsonify({"result": "error retrieving "+key+" obj from S3: "+str(e)})
        resp.status_code = 500
        return resp  

# method is an optional body parameter
@app.route('/getPresignedUrl', methods=['POST'])
def get_presigned_url_from_s3():
    """
    Presigned url based on the provided S3Key and method
    ---
    parameters:
        - name: PresignedUrlBody
          in: body
          required: true
          schema:
            id: PresignedUrlBody
            required:
            - S3Key
            - method
            properties: 
              S3Key:
                type: string
                example: "J80812"
              method:
                type: string
                example: GET
    responses:
        200:
          description: Created inspection
          schema:
            id: UlrObject
            properties:
              url:
                type: string
    """
    try: 
        if not s3:
            logger.info(S3_NOT_CONFIGURED_MSG)
            raise Exception(S3_NOT_CONFIGURED_MSG)

        raw_dict = request.get_json(force=True)
        my_key = raw_dict['S3Key']
        my_method = raw_dict['method']
        url = None
        if my_method == 'PUT' or my_method == 'put':
            url = create_put_presigned_url(my_key)
        else:
            url = create_get_presigned_url(my_key)
        resp = jsonify({"url":url})
        resp.status_code = 200
        return resp
        
    
    except Exception as e:
        resp = jsonify({"result": "error generating presigned url from S3: "+str(e)})
        resp.status_code = 500
        return resp

# method is an optional body parameter
@app.route('/getPresignedUrlArray', methods=['POST'])
def get_presigned_url_array_from_s3(): 
    """
    Presigned url list based on the provided S3Key list and method
    ---
    parameters:
        - name: PresignedUrlBody
          in: body
          required: true
          schema:
            id: PresignedUrlListBody
            required:
            - S3Key
            - method
            properties: 
              S3KeyArray:
                type: array
                items:
                  schema:
                    type: string
                example: ["/a/b/c","a'b/d","a/b/e"]
              method:
                type: string
                example: GET
    responses:
        200:
          description: Created inspection
          schema:
            id: UlrObject
            properties:
              urlArray:
                description: list of presigned urls
                type: array
                items:
                  schema:
                    type: string
                example: ["http://adsfasdfaf/a/b/c","http://adsfasdfaf/a/b/d","http://adsfasdfaf/a/b/e"]
    """
    try: 
        if not s3:
            logger.info(S3_NOT_CONFIGURED_MSG)
            raise Exception(S3_NOT_CONFIGURED_MSG)

        raw_dict = request.get_json(force=True)
        my_key_array = raw_dict['S3KeyArray']
        my_method = raw_dict['method']
        urls = []
        for my_key in my_key_array:
            url = None
            if my_method == 'PUT' or my_method == 'put':
                url = create_put_presigned_url(my_key)
            else:
                url = create_get_presigned_url(my_key)     
            urls.append(url)

        resp = jsonify({"urlArray":urls})
        resp.status_code = 200
        return resp
        
    
    except Exception as e:
        resp = jsonify({"result": "error generating presigned url from S3: "+str(e)})
        resp.status_code = 500
        return resp


@app.route('/submitFileToS3', methods=['POST'])
def submit_file_to_s3():
    """
    Upload a file to S3 using a local path
    ---
    parameters:
        - name: SubmitToS3Body
          in: body
          required: true
          schema:
            id: PresignedUrlListBody
            required:
            - Filepath
            - S3Key
            properties: 
              Filepath:
                type: string
                example: /app/shared/a/b/c
              S3Key:
                description: relative to the bucket name in s3
                type: string
                example: /a/b/c
    responses:
        200:
          description: Created inspection
          schema:
            id: StatusResponse
            properties:
              status:
                type: string
                example: message from S3 indicating success or failure
    """

    raw_dict = request.get_json(force=True)
    my_file = raw_dict['Filepath']
    my_key = raw_dict['S3Key']
    my_ACL = 'bucket-owner-full-control'

    logger.info('submitFileToS3 called with:')
    logger.info(f'Filepath: {my_file}')
    logger.info(f'S3Key: {my_key}')

    if my_file is None:
        return {'status':'missing Filepath parameter.'}
    if my_key is None:
        return {'status':'missing S3Key parameter.'}
    
    try: 
        logging.info(f'using s3: {s3}')
        if s3 is None:
            logger.info(S3_NOT_CONFIGURED_MSG)
            raise Exception(S3_NOT_CONFIGURED_MSG)

        if exists(my_file):
            upload_temp_file_to_s3(my_file, my_ACL, my_key)

            jsonResult = f"Success submitting file: {my_file}"
            resp = jsonify({"status":jsonResult})
            resp.status_code = 200
            return resp
        else:
            logging.info(f'Could not find file: {my_file}. File should be in /shared folder')
            raise Exception("no such filepath: "+ str(my_file))
        
    except Exception as e:
        jsonResult = f'error submitting file: {my_file}: {str(e)}'
        resp = jsonify({"status":jsonResult})
        resp.status_code = 500
        return resp 

@app.route('/configureS3', methods=['POST'])
def configure_s3():
    """
    Update s3 configuration at runtime
    ---
    parameters:
        - name: ConfigureS3Body
          in: body
          required: true
          schema:
            id: ConfigureS3Body
            required:
            - s3Bucket
            - kmsKeyName
            - s3BucketDirectory
            properties: 
              s3Bucket:
                type: string
              kmsKeyName:
                type: string
              s3BucketDirectory:
                type: string
                
    responses:
        200:
          description: Created inspection
          schema:
            id: StatusResponse
            properties:
              status:
                type: string
                example: message from S3 indicating success or failure
    """
    try: 
        raw_dict = request.get_json(force=True)
        my_s3Bucket = raw_dict['s3Bucket']
        
        try:
            my_kmsKeyName = raw_dict['kmsKeyName']
        except Exception as e:
            my_kmsKeyName = ""
        try:
            my_s3BucketDirectory = raw_dict['s3BucketDirectory']
        except Exception as e:
            my_s3BucketDirectory = ""

        logger.info(f's3Bucket:{s3Bucket}')
        logger.info(f'kmsKeyName:{kmsKeyName}')
        logger.info(f's3BucketDirectory:{s3BucketDirectory}')

        # my_s3Bucket = "uai3028391-specpower-gp-power-us-east" # NOSONAR
        aws_config(my_s3Bucket, my_s3BucketDirectory, my_kmsKeyName)

        jsonResult = "success configuring S3 connection"
        resp = jsonify({"status":jsonResult})
        resp.status_code = 200
        return resp 
        
    except Exception as e:

        jsonResult = "error configuring S3 connection: " + str(e)
        resp = jsonify({"status":jsonResult})
        resp.status_code = 500
        return resp 



# =================================== Init routine =========================================

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
#logging.basicConfig(level=logging.INFO)
logger = logging.getLogger()
#handler = logging.StreamHandler(sys.stdout)

# ---------------------------------------- Init temp dirs ------------------------------- 

#temp folder only for download
if not os.path.isdir(TEMP_DOWNLOAD_FILES_DIR):
    os.mkdir(TEMP_DOWNLOAD_FILES_DIR)

# shared drive
if not os.path.isdir(sharedFolder):
    os.mkdir(sharedFolder)
if not os.path.isdir(sharedInputFolder):
    os.mkdir(sharedInputFolder)
if not os.path.isdir(sharedOutputFolder):
    os.mkdir(sharedOutputFolder)

x = threading.Thread(target=clean_temp_folder)
x.start()

#---------------------------------------------------------------------------------------

def create_app():
    logger.info('create_app() called')

    app = Flask(__name__, static_url_path="")
    config_file_path = os.path.join(sys.path[0],'../s3_connection_info.json')
    # read from s3_connection_info.json 
    logger.info(f'config_file_path: {config_file_path}') 
    #try:
        #with open(os.path.join(sys.path[0],'s3_connection_info.json')) as f:
    try:
        data_set = {"s3Bucket":"uai3028391-specpower-gp-power-us-east","s3BucketDirectory":'blade_digital_certificate/',"kmsKeyName":"alias/uai3031357-dna-ds-s3-read-fed"}
        with open(config_file_path, mode="r") as f:
            data_set = json.load(f)
       
        #json_dump = json.dumps(data_set)
        #logger.info(f'config file content: {json_dump}')
        s3Config = data_set
            # '{"s3Bucket":"uai3028391-specpower-gp-power-us-east","s3BucketDirectory":"borescope-upload/dev/","kmsKeyName":"alias/uai3028391-specpower-s3"}'
            # Environment variables overwrite config file...
        # logger.info(s3Config) # NOSONAR
        # logger.info.log("Secret s3 bucket" + os.getenv('S3_BUCKET')) # NOSONAR
        # logger.info.log("Secret s3 directory" + os.getenv('S3_BUCKET_DIRECTORY')) # NOSONAR
        # logger.info.log("Secret s3 Key" + os.getenv('S3_KMS_KEY_NAME')) # NOSONAR
        
        #logger.info(f'using s3Config: {s3Config}')
        
        s3Bucket = os.getenv('S3_BUCKET')
        if s3Bucket:
            logger.info("Overwriting s3Bucket with ",s3Bucket)
            s3Config['s3Bucket'] = s3Bucket
        s3BucketDirectory = os.getenv('S3_BUCKET_DIRECTORY')
        if s3BucketDirectory:
            logger.info("Overwriting s3BucketDirectory with ",s3BucketDirectory)
            s3Config['s3BucketDirectory'] = s3BucketDirectory
        kmsKeyName = os.getenv('S3_KMS_KEY_NAME')
        if kmsKeyName:
            logger.info("Overwriting kmsKeyName with ",kmsKeyName)
            s3Config['kmsKeyName'] = kmsKeyName
            
        # s3Bucket = "uai3028391-specpower-gp-power-us-east/borescope-upload/" #NOSONAR
        logger.info(f's3Config: {s3Config}')
        
        # configure AWS
        aws_config(s3Config['s3Bucket'], s3Config['s3BucketDirectory'], s3Config['kmsKeyName'])
        logger.info(f"S3 connection is configured based on {config_file_path}")
    except Exception as e:
        logger.info(f"Error configuring S3 connection: {e}")
        pass
    # s3 = boto3.resource('s3') # NOSONAR
    # logger.info('Buckets:\n\t', *[b.name for b in s3.buckets.all()], sep="\n\t") # NOSONAR
    # s3  = boto3.client('s3') # NOSONAR
    # my_file = 'C:/Users/212332686/Documents/Development/SPEC/Repos/SpecBorescopeApp/bs-server-parser-s3/bs-parser/samples/sample1.pdf' # NOSONAR
    # my_file = 'C:/Users/212332686/Downloads/sample5.pdf' # NOSONAR
    # my_file = '/bs-parser/samples/sample1.pdf' # NOSONAR
    # my_key = 'test/sample1.pdf' # NOSONAR
    # my_ACL = 'bucket-owner-full-control' # NOSONAR
    # s3 = boto3.client("s3", verify=False) # NOSONAR
    # uploadTempFileToS3(my_file, my_ACL, my_key) # NOSONAR



    app.jinja_env.cache = {}
    app.logger.setLevel(logging.DEBUG)

    return app

if __name__ == '__main__':
    print('running app...') 
    create_app = create_app()
    #create_app.run(host='0.0.0.0', port=9090, debug=True, threaded=True)
    create_app.run(debug=True, threaded=True, processes=20)
else:
    gunicorn_app = create_app()

