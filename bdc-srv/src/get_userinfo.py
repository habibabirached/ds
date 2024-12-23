from flask import Flask, jsonify, request
#import requests
import httpx


def get_user_claims(request):
  """
  This function checks for the presence of X-AMZN-OIDC-* headers and optionally extracts specific claims.

  Args:
      request: A WSGI request object (e.g., Flask request object)

  Returns:
      A dictionary containing extracted user claims or None if headers are not found.
  """

  headers = request.headers
  claims = {}

  if 'X-AMZN-OIDC-USERID' in headers:
    claims['user_id'] = headers['X-AMZN-OIDC-USERID']
  if 'X-AMZN-OIDC-USERNAME' in headers:
    claims['username'] = headers['X-AMZN-OIDC-USERNAME']
  else:
    claims = headers
    print(f'Sso part of DL: {is_sso_in_dl_group("503419305")}')
  return claims

def get_esn_prefix(userSso):
  user_dl = get_user_dl_group(userSso)
  esn_prefix = []
  if user_dl == 'TPI':
    esn_prefix = ['TPI','tpi']
  else:
    esn_prefix = None 
    
  return esn_prefix

def is_sso_in_dl_group(userSso):
  """
  This function checks for the presence of userSso in the DL group list.
  Args:
      userSso: User Sso to check for DL validity

  Returns:
      A true or false value if the sso id part of the idm group DL.
  """  
  access_token = generate_auth_token()
  members_list = generate_dl_members_list("g03042086", access_token) # tpi g03042085 onw g03043884
  members_list = members_list + generate_dl_members_list("g03042085", access_token) + generate_dl_members_list("g03043884", access_token)
  members_list = members_list + generate_dl_members_list("g03045613", access_token)
  print("China ---> ",generate_dl_members_list("g03045613", access_token))
  
  if userSso in members_list:
    return True
  else:
    return False
  
def get_user_dl_group(userSso):
  """
  This function checks for the presence of userSso in the DL group list.
  Args:
      userSso: User Sso to check for DL validity

  Returns:
      A true or false value if the sso id part of the idm group DL.
  """  
  access_token = generate_auth_token()
  if userSso in generate_dl_members_list("g03043780", access_token):
    return "ADM"
  elif userSso in generate_dl_members_list("g03043884", access_token):
    return "ONW"
  elif userSso in generate_dl_members_list("g03042085", access_token):
    return "TPI"
  elif userSso in generate_dl_members_list("g03042086", access_token):
    return "LM"
  elif userSso in generate_dl_members_list("g03045613", access_token):
    return "CHN"  
  else:
    return None


def generate_dl_members_list(group_id, access_token):
  """
  This function generates a list of members part of the groupId
  Args:
      groupId: The distribution list group id. 

  Returns:
      A list of member sso, part of the group.
  """  
  url = 'https://api.ge.com/digital/idm/group-api/v1/distributionLists/'
  
  headers = {
      "Content-Type": "application/json",  
      "Accept": "application/json",
      "Authorization": "Bearer "+ access_token
  }

  #response = requests.get(url + group_id, headers=headers)
  response = httpx.get(url + group_id, headers=headers)
  

  if response.status_code == 200:
    data = response.json()
    return data.get("members")
  else:
    print(f'Error: {response.status_code}, {response.text}')
    return []


def generate_auth_token():
  """
  This function is used to generate the idm auth token.

  Returns:
      A IDM authorization token.
  """ 
  client_id = "uPeVGRk6Ip3q9bvknnGvdcp5FhtlrgFK0grMEEHGGNxyikeJ"
  client_secret = "XcOWlDznsufRobwd7OJxZGG0k8gmVaXogGGeY3z4xnWZEfPaNGrHAbM6jERLVel6"

  url = "https://fssfed.ge.com/fss/as/token.oauth2"
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
  
def logout_user():
  """
  This function is called to logoff from the application

  Returns:
      A logged out response.
  """ 
  url = "https://ssologin.ssogen2.corporate.ge.com/logoff/logoff.jsp?referrer=https://digitalhealthrecord-dbc.gevernova.net/"
  headers = {"Content-Type": "application/x-www-form-urlencoded; charset=utf-8"}
  
  #response = requests.get(url, headers=headers)
  response = httpx.get(url, headers=headers)
  
  if response.status_code == 200:
    data = response.status_code
    return data
  else:
    return None  
