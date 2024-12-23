#!flask/bin/python

from views import bdc_view
from flask import Flask, jsonify, request, abort, make_response
from flask_restful import Api, Resource, reqparse, fields, marshal
from flask_httpauth import HTTPBasicAuth
from flask_compress import Compress
from flasgger import Swagger
import logging
from werkzeug.utils import secure_filename
import os
import sys

from sqlalchemy.orm import Session
from flask_cors import CORS


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
# logging.basicConfig(level=logging.INFO)
logger = logging.getLogger()
# handler = logging.StreamHandler(sys.stdout)

# ---------------------------------------- End logger -------------------------------

# SHARED_FOLDER = '/app/shared' # absolute path of shared folder with bdc_s3_access
UPLOAD_FOLDER = 'upload'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'json'}


def create_app():
    app = Flask(__name__, static_url_path="")
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
    app.config['JSON_AS_ASCII'] = False
    cors = CORS(app, resources={r'/*': {'origins': '*'}}) # NOSONAR   
    # app.config['SHARED_FOLDER'] = SHARED_FOLDER
    # app.logger.addHandler(handler)

    # Compression middleware
    Compress(app)

    template = {
        "swagger": "2.0",
        "info": {
            "title": "Blade Digital Certificate API",
            "description": "API for interacting with teh BDC database",
            "contact": {
                "responsibleOrganization": "GE Vernova Research",
                "responsibleDeveloper": "Roberto Silva Filho",
                "email": "silva_filho@ge.com",
            },
            "version": "0.0.1"
        },
        # "host": "mysite.com",  # overrides localhost:500
        # "basePath": "/api",  # base bash for blueprint registration
        # "schemes": [
        #  "http",
        #  "https"
        # ],
        # "operationId": "getmyData"
    }
    # api = Api(app)
    swagger = Swagger(app, template=template)

    # Blueprints
    app.register_blueprint(bdc_view, url_prefix='')
    app.logger.setLevel(logging.DEBUG)

    return app


if __name__ == '__main__':
    create_app = create_app()
    create_app.run(debug=False, threaded=True, processes=20) 
    # app.run(debug=True)
    # app.run()

