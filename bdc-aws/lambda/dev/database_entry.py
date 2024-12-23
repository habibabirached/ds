import boto3
import json
from botocore.exceptions import NoCredentialsError, PartialCredentialsError
import re
from datetime import datetime
import os
import pg8000

s3_client = boto3.client('s3')

def generateSQLQuery():

    insert_query = """
        INSERT INTO public.blade_monitoring
        ( blade_number, file_size,  s3_cvpl_input )
        VALUES( %s, %s, %s)        
    """

    update_query = """
        update public.blade_monitoring set file_size = %s , s3_cvpl_input = %s where blade_number = %s 
    """

    select_query = " select * from public.blade_monitoring where blade_number = %s "

    return insert_query, update_query, select_query


def connectDB():
    # Database connection details (these should be stored in environment variables)
    db_host = os.getenv('DB_HOST')  # This should be the public/private IP of your EC2 instance
    db_name = os.getenv('DB_NAME')
    db_user = os.getenv('DB_USER')
    db_password = os.getenv('DB_PASSWORD')
    db_port = os.getenv('DB_PORT', 5432)  # Default PostgreSQL port

    # Connect to the PostgreSQL database on the EC2 instance
    conn = pg8000.connect(
        host='10.232.225.253',
        database='bdc',
        user='bdc',
        password='bdc',
        port=db_port
    )
    
    return conn

def updateCVPipeLineOutput(blade_number, file_size):
    insert_query, update_query, select_query = generateSQLQuery()

    upload_time = datetime.utcnow()
    conn = connectDB()
    cursor = conn.cursor()
    cursor.execute(select_query, (blade_number,))
    record = cursor.fetchone()
    print(" select output ", record)
    
    cvpl_insert_query = """
        INSERT INTO public.blade_monitoring
        ( blade_number, file_size,  s3_cvpl_output )
        VALUES( %s, %s, %s)        
    """

    cvpl_update_query = """
        update public.blade_monitoring set file_size = %s , s3_cvpl_output = %s where blade_number = %s 
    """
    file_size = f"{file_size/(1<<30):,.0f} GB"
    if record == None:
        cursor.execute(cvpl_insert_query, (blade_number, file_size, upload_time))
    else:
        cursor.execute(cvpl_update_query, (file_size, upload_time, blade_number))

    cursor.execute(select_query, (blade_number,))
    after = cursor.fetchone()
    print(" select output after ", after)

    conn.commit()

    # Close the cursor and connection
    cursor.close()
    conn.close()
        


def modifyDatabaseRecords(folder_name, file_size):
    a, blade_number = folder_name.split('_', 1)
    print (blade_number)
    insert_query, update_query, select_query = generateSQLQuery()

        # Get the current datetime
    upload_time = datetime.utcnow()
    conn = connectDB()
    cursor = conn.cursor()
    cursor.execute(select_query, (blade_number,))
    record = cursor.fetchone()
    print(" select output ", record)

    if record == None:
        cursor.execute(insert_query, (blade_number, file_size, upload_time))
    else:
        cursor.execute(update_query, (file_size, upload_time, blade_number))

    cursor.execute(select_query, (blade_number,))
    after = cursor.fetchone()
    print(" select output after ", after)

    conn.commit()

    # Close the cursor and connection
    cursor.close()
    conn.close()

def processedFileName(s3_object_key):

    bucket = 'renewables-uai3031357-dna-ds-dev'
    # Regex pattern to match date format YYYY-MM-DD
    prefix = 'blade_digital_certificate/cv-pipeline-output/'
    
    # Remove the prefix from the file key to get the file name
    file_name = s3_object_key[len(prefix):]
    # Split the file name by underscore and extract the string between the first and second underscores
    file_parts = file_name.split('_')
    blade_name = file_parts[1]

    return blade_name


def getBladeFolderName(s3_object_key):
        # Split the path into folders
    folders = s3_object_key.split("/")
    bucket = 'renewables-uai3031357-dna-ds-dev'
    # Regex pattern to match date format YYYY-MM-DD
    date_pattern = r"\d{4}-\d{2}-\d{2}"
    
    # Find the folder matching the date pattern and the folder after it
    date_folder = None
    folder_after_date = None
    for i, folder in enumerate(folders):
        print (i)
        print('folder --> ', folder)
        if re.match(date_pattern, folder):
            date_folder = folder
            print(date_folder)
            if i + 1 < len(folders):
                folder_after_date = folders[i + 1]
            break
    # If the folder after the date is found, calculate the size
    if folder_after_date:
        total_size = get_folder_size(bucket, "/".join(folders[:i+2]))
    else:
        return {
            'statusCode': 400,
            'body': json.dumps("Date folder or folder after date not found")
        }
    
    return folder_after_date, total_size


# Function to calculate the total size of a folder in S3
def get_folder_size(bucket, prefix):
    total_size = 0
    print('Calculating size of ', prefix)
    # Paginate through the objects in the given folder (prefix)
    paginator = s3_client.get_paginator('list_objects_v2')
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get('Contents', []):
            total_size += obj['Size']
    
    total_size = f"{total_size/(1<<30):,.0f} GB"
    return total_size
    

def lambda_handler(event, context):
    source_bucket = 'renewables-uai3031357-dna-ds-dev'

    cv_pipeline_input = 'blade_digital_certificate/cv-pipeline-input/'
    
    cv_pipeline_output = 'blade_digital_certificate/cv-pipeline-output/'

    blade_name = None

    try:
        # Extract the uploaded object's key from the event
        # Checking for a files in cv-pipeline-input folder on S3
        # e.g. - s3://renewables-uai3031357-dna-ds-dev/blade_digital_certificate/cv-pipeline-input/lm/2024-09-09/Blade_VAD-000121-75.7-0062/
        # This code relies on folder cv-pipeline-input and folder with date pattern YYYY-MM-DD folder
        for record in event['Records']:
            s3_object_key = record['s3']['object']['key']
            
            print ('s3_object_key ---> ', s3_object_key)
            if s3_object_key.startswith(cv_pipeline_input):
                folder_name, total_size = getBladeFolderName(s3_object_key)    # Split the path into folders
                print(' Folder Name ---> ', folder_name)
                print('Total Size ---> ', total_size)
                modifyDatabaseRecords(folder_name, total_size)
                print (' cv ppl input done')
                
            if s3_object_key.startswith(cv_pipeline_output):    
                # get the filename after AI processing and make the db entry 
                blade_name =  processedFileName(s3_object_key)
                file_size = record['s3']['object']['size']
                updateCVPipeLineOutput(blade_name, file_size)
                print (' cv ppl output done')

        return {
            'statusCode': 200,
            'body': 'Sync complete.'
        }
    except NoCredentialsError:
        return {
            'statusCode': 403,
            'body': 'Credentials not available'
        }
    except PartialCredentialsError:
        return {
            'statusCode': 403,
            'body': 'Incomplete credentials'
        }


# cv-pipeline-input blade_digital_certificate/cv-pipeline-input/
# Check for the date folder in the s3_object_key
# Get the folder name inside this date folder 
# Get the size of the folder 
