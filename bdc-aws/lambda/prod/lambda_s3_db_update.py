import boto3
import json
from botocore.exceptions import NoCredentialsError, PartialCredentialsError
import re
from datetime import datetime
import os
import pg8000

s3_client = boto3.client('s3')

# Database connection details from environment variables
DB_PARAMS = {
    'host': os.getenv('DB_HOST'),
    'database': os.getenv('DB_NAME'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'port': os.getenv('DB_PORT', 5432)
}

def connectDB():
    """Connect to the PostgreSQL database."""
    return pg8000.connect(**DB_PARAMS)

def generate_queries(field):
    """Generate SQL queries dynamically based on the field."""
    insert_query = f"""
        INSERT INTO public.blade_monitoring (blade_number, file_size, {field})
        VALUES (%s, %s, %s)
    """
    update_query = f"""
        UPDATE public.blade_monitoring SET file_size = %s, {field} = %s WHERE blade_number = %s
    """
    select_query = "SELECT * FROM public.blade_monitoring WHERE blade_number = %s"
    
    return insert_query, update_query, select_query

def update_database(blade_number, file_size, upload_time, field):
    """Update or insert database records for the given blade number."""
    insert_query, update_query, select_query = generate_queries(field)

    file_size_gb = f"{file_size/(1<<30):,.0f} GB"  # Convert bytes to GB
    conn = connectDB()
    cursor = conn.cursor()
    
    cursor.execute(select_query, (blade_number,))
    record = cursor.fetchone()

    if record:
        cursor.execute(update_query, (file_size_gb, upload_time, blade_number))
    else:
        cursor.execute(insert_query, (blade_number, file_size_gb, upload_time))
    
    conn.commit()
    cursor.close()
    conn.close()

def get_blade_folder_info(s3_object_key, bucket):
    """Get the blade folder name and total size of the folder."""
    folders = s3_object_key.split("/")
    date_pattern = r"\d{4}-\d{2}-\d{2}"

    # Find date folder and the folder after the date
    for i, folder in enumerate(folders):
        if re.match(date_pattern, folder):
            if i + 1 < len(folders):
                folder_after_date = folders[i + 1]
                total_size = get_folder_size(bucket, "/".join(folders[:i+2]))
                return folder_after_date, total_size

    raise ValueError("Date folder or folder after date not found")

def get_folder_size(bucket, prefix):
    """Calculate the total size of a folder in S3."""
    total_size = 0
    paginator = s3_client.get_paginator('list_objects_v2')
    
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        total_size += sum(obj['Size'] for obj in page.get('Contents', []))
    
    return f"{total_size/(1<<30):,.0f} GB"  # Convert bytes to GB

def lambda_handler(event, context):
    source_bucket = 'renewables-uai3062831-dbc-prod'

    cv_pipeline_input = 'blade_digital_certificate/cv-pipeline-input/'
    cv_pipeline_output = 'blade_digital_certificate/cv-pipeline-output/'
    lm_input = 'blade_digital_certificate/lm/'
    tpi_input = 'blade_digital_certificate/tpi/'

    try:
        for record in event['Records']:
            s3_object_key = record['s3']['object']['key']
            print(f"Processing {s3_object_key} from bucket {source_bucket}")

            if s3_object_key.startswith(cv_pipeline_input):
                folder_name, total_size = get_blade_folder_info(s3_object_key, source_bucket)
                print(f"Folder: {folder_name}, Size: {total_size}")
                update_database(folder_name, total_size, datetime.utcnow(), 's3_cvpl_input')

            elif s3_object_key.startswith(cv_pipeline_output):
                blade_name = processedFileName(s3_object_key)
                file_size = record['s3']['object']['size']
                update_database(blade_name, file_size, datetime.utcnow(), 's3_cvpl_output')

            elif s3_object_key.startswith(lm_input) or s3_object_key.startswith(tpi_input):
                folder_name, total_size = get_blade_folder_info(s3_object_key, source_bucket)
                print(f"Folder: {folder_name}, Size: {total_size}")
                update_database(folder_name, total_size, datetime.utcnow(), 's3_bucket')

        return {
            'statusCode': 200,
            'body': 'Sync complete.'
        }

    except (NoCredentialsError, PartialCredentialsError):
        return {
            'statusCode': 403,
            'body': 'Credentials error'
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': f"Error: {str(e)}"
        }

def processedFileName(s3_object_key):
    """Extract blade name from S3 object key."""
    prefix = 'blade_digital_certificate/cv-pipeline-output/'
    file_name = s3_object_key[len(prefix):]
    blade_name = file_name.split('_')[1]
    return blade_name
