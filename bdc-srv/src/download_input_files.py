import boto3
import os
import logging
from botocore.exceptions import NoCredentialsError, PartialCredentialsError
from botocore.signers import CloudFrontSigner
from botocore.config import Config
from datetime import datetime, timedelta


# Parameters
BUCKET_NAME = os.getenv('S3_BUCKET_NAME')
FOLDER_PREFIX = os.getenv('S3_BASE_FOLDER') # Make sure it ends with "/"
EXPIRATION = 3600  # Signed URL expiration in seconds (1 hour)

def get_s3_client():
    """Initialize and return an S3 client."""
    try:
        region = os.getenv('AWS_REGION')
        config=Config(
            signature_version='s3v4',
            s3={'use_accelerate_endpoint': True})   
        s3_client = boto3.client(
                    service_name='s3',
                    region_name=region,
                    config=config
                )
        return s3_client
    except (NoCredentialsError, PartialCredentialsError):
        print("AWS credentials not found. Please configure them.")
        exit(1)

def find_folder_in_s3(s3_client, bucket_name, search_prefix, folder_to_search):
    """
    Search for a folder with the specified name under a given prefix.
    Returns the path to the folder if found, otherwise None.
    """
    paginator = s3_client.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket_name, Prefix=search_prefix):
        if "Contents" in page:
            for obj in page["Contents"]:
                key = obj["Key"]
                # Check if the folder name appears as part of the path
                if f"/{folder_to_search}/" in key or key.endswith(f"/{folder_to_search}"):
                    folder_path = key.split(f"{folder_to_search}/")[0] + f"{folder_to_search}/"
                    logging.info(f"Folder '{folder_to_search}' found at: {folder_path}")
                    return folder_path
    return None

def generate_signed_urls(s3_client, bucket_name, file_keys, expiration):
    """Generate signed URLs for a list of files in the S3 bucket."""
    signed_urls = {}
    for key in file_keys:
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket_name, "Key": key},
            ExpiresIn=expiration,
        )
        signed_urls[key] = url
    return signed_urls

def list_files_in_folder(s3_client, bucket_name, folder_prefix):
    """
    List all files (including subfolders) under a specific folder prefix in an S3 bucket.
    Returns a list of file keys.
    """
    file_keys = []
    paginator = s3_client.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket_name, Prefix=folder_prefix):
        if "Contents" in page:
            for obj in page["Contents"]:
                # Add only keys that are not directories (i.e., no trailing '/')
                if not obj["Key"].endswith("/"):
                    file_keys.append(obj["Key"])
    return file_keys

def download_s3_input_files(blade_number):
    s3_client = get_s3_client()
    FOLDER_TO_SEARCH = "Blade_" + blade_number
    logging.info(f"Searching for folder '{FOLDER_TO_SEARCH}' under prefix '{FOLDER_PREFIX}' in bucket '{BUCKET_NAME}'...")
    
    # Step 1: Find the folder
    folder_path = find_folder_in_s3(s3_client, BUCKET_NAME, FOLDER_PREFIX, FOLDER_TO_SEARCH)
    if not folder_path:
        logging.info(f"Folder '{FOLDER_TO_SEARCH}' does NOT exist under the specified prefix.")
        return
    
    # Step 2: List all files under the folder and its subfolders
    logging.info(f"Listing all files under folder '{folder_path}'...")
    file_keys = list_files_in_folder(s3_client, BUCKET_NAME, folder_path)

    # Generate signed URLs
    signed_urls = generate_signed_urls(s3_client, BUCKET_NAME, file_keys, EXPIRATION)
    for file_key, url in signed_urls.items():
        logging.info(f"File: {file_key}\nSigned URL: {url}\n")
    
    print("All signed URLs have been generated.")

    if not file_keys:
        logging.info(f"No files found under the folder '{folder_path}'.")
        return
    
    logging.info(f"Found {len(file_keys)} files under folder '{folder_path}':")
    for key in file_keys:
        print(key)

    return signed_urls
