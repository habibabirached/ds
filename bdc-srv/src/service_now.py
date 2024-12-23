from flask import Flask, jsonify, request
#import requests
import httpx
import json
import os


def get_all_service_tasks(sso):
  """
  This is the method to get all the service now task raised by user sso. 
  """

  service_now_url = os.getenv('SERVICE_NOW_URL')
  # Assignment Group is the code for - @GE Vernova Digital Blades Certificate L2 Support Group
  #  and sys_update_by sso indicates created via Service Now Integration API e.g.
  # https://stage.api.ge.com/digital/servicenowqa/v1/task/querytable/assignment_group=06eb8e2afb06de50d2b2f4cf45efdc69^active=true^sys_updated_by=502762115/sc_req_item?sso=503419305

  query = 'querytable/assignment_group=06eb8e2afb06de50d2b2f4cf45efdc69^active=true^sys_updated_by=502762115/sc_req_item?sso='
  url = service_now_url + '/task/'+ query + sso
  headers = generate_headers()
  
  response = httpx.get(url,  headers=headers)
  
  if response.status_code == 200:
    return response.json()
  else:
    print(f'Error: {response.status_code}, {response.text}')
    return []


def get_all_service_incident(sso):
  """
  This is the method to get all the servince now incident ticket raised by user sso. 
  """

  service_now_url = os.getenv('SERVICE_NOW_URL')
  url = service_now_url + '/incident/sso/'+ sso
  headers = generate_headers()
  
  response = httpx.get(url,  headers=headers)
  
  if response.status_code == 200:
    return response.json()
  else:
    print(f'Error: {response.status_code}, {response.text}')
    return []


def create_service_incident(data):
  """
  This is the method to create a servince now incident ticket. 
  """
  service_now_url = os.getenv('SERVICE_NOW_URL')
  url = service_now_url + '/incident'  
  headers = generate_headers()
  data = generate_sn_service_json(data)
  json_payload = json.dumps(data)
  print('Payload ', json_payload)

  response = httpx.post(url, headers=headers, data = json_payload)
  
  if response.status_code == 201:
    data = response.json()
    req_number = data.get("result").get("number")
    return "The Service-Now incident has been raised. " + req_number
  else:
    print(f'Error: {response.status_code}, {response.text}')
    return []


def generate_sn_service_json(request_data):
  """
   
  """

  userSSO =  request_data.get("userSSO")
  shortDesc = request_data.get("shortDesc")
  desc = request_data.get("desc")

  return {
    "insert": {
        "partnerInfo": {
            "name": "com.vernova.ren.postgres"
        },
        "opened_by": userSSO,
        "caller_id": userSSO,
        "u_on_behalf_of": userSSO,
        "business_service": "1101367209",
        "u_environment": "1101395768",
        "short_description": shortDesc,
        "description": desc,
        "work_notes": ""
    }
}

def create_service_request(request_data):
  """
  This function is used to create a service request
  Args:
      Request Data - with userSSO, short description and description.

  Returns:
      A GERITM servince now request number.
  """  

  service_now_url = os.getenv('SERVICE_NOW_URL')
  url = service_now_url + '/sc_request'  
  headers = generate_headers()
  data = generate_sn_request_json(request_data)
  json_payload = json.dumps(data)

  response = httpx.post(url, headers=headers, data = json_payload)
  
  if response.status_code == 201:
    data = response.json()
    req_number = data.get("result").get("number")
    return "The Service-Now request has been raised. " + req_number
  else:
    print(f'Error: {response.status_code}, {response.text}')
    return []


def generate_sn_request_json(request_data):
  """
  This method is user to create json for a servince request.
  """

  userSSO =  request_data.get("userSSO")
  shortDesc = request_data.get("shortDesc")
  desc = request_data.get("desc")

  return {
    "insert": {
        "partnerInfo": {
            "name": "com.vernova.ren.postgres"
        },
        "item": "General Service Request",
        "itemVariables": {
            "v_requested_for": userSSO,
            "v_configuration_item": "1101367209",
            "v_short_description": shortDesc,
            "v_detailed_description": desc
        }
    }
  }

def generate_auth_token():
  """
  This function is used to generate the auth token.

  Returns:
      A service now authorization token.
  """ 
  client_id = os.getenv('SN_CLIENT_ID')
  client_secret = os.getenv('SN_CLIENT_SECRET')
  url = os.getenv('OAUTH_URL')

  headers = {"Content-Type": "application/x-www-form-urlencoded; charset=utf-8"}
  data = {
      "grant_type": "client_credentials",
      "scope": "api",
      "client_id": client_id,
      "client_secret": client_secret
  }

  #response = requests.post(url, headers=headers, data=data)
  response = httpx.post(url, headers=headers, data=data)

  if response.status_code == 200:
    data = response.json()
    token = data.get("access_token")
    return token
  else:
    return None

def generate_headers():
  access_token = generate_auth_token()
  headers = {
      "Content-Type": "application/json",  
      "Accept": "application/json",
      "Authorization": "Bearer "+ access_token
  }
  return headers
  
