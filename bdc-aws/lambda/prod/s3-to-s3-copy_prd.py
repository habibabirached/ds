import json
import boto3
import os

def lambda_handler(event, context):
    # S3 Sync from Source to Destination bucket.
    #renewables-uai3062831-dbc-prod
    source_bucket = 's3://renewables-uai3062831-dbc-prod'
    dest_bucket = 's3://renewables-uai3062831-dbc-prod'

    source_dest_mapping = {
        'blade_digital_certificate/lm/': 'blade_digital_certificate/cv-pipeline-input/lm/',
        'blade_digital_certificate/tpi/': 'blade_digital_certificate/cv-pipeline-input/tpi/'
    }
    
    forward_slash = "/"
    aws_s3_sync_command = '/opt/aws s3 sync '
    aws_s3_sync_parameters = ' --sse aws:kms --sse-kms-key-id arn:aws:kms:us-east-1:180500816860:key/df3cbdb4-5fe7-4431-af82-d335edfe2163 --acl bucket-owner-full-control '

    try:
        # Extract the uploaded object's key from the event
        for record in event['Records']:
            folder_path = record['s3']['object']['key']
            print ('folder_path -----> '+folder_path)
            for source_prefix, dest_prefix in source_dest_mapping.items():
                if folder_path.startswith(source_prefix):
                    print(aws_s3_sync_command + source_bucket +forward_slash+ source_prefix + " "+ dest_bucket + forward_slash + dest_prefix + aws_s3_sync_parameters)
                    os.system(aws_s3_sync_command + source_bucket +forward_slash+ source_prefix + " "+ dest_bucket + forward_slash + dest_prefix + aws_s3_sync_parameters)
                    
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
        