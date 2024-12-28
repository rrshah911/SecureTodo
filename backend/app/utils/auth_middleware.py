from functools import wraps
from flask import request, jsonify
import boto3
from jose import jwt
import json
from datetime import datetime
from ..config import Config

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            print("No authorization header found")
            return jsonify({'error': 'No authorization header'}), 401
        
        try:
            token = auth_header.split(' ')[1]
            print("This is the token: ", token)
            client = boto3.client('cognito-idp', region_name=Config.AWS_REGION)
            
            # Verify the token with Cognito
            response = client.get_user(
                AccessToken=token
            )
            
            # Add user info to request
            request.user = {
                'user_id': response['Username'],  # This is the Cognito user's unique identifier
                'email': next(attr['Value'] for attr in response['UserAttributes'] if attr['Name'] == 'email')
            }
            
            return f(*args, **kwargs)
            
        except Exception as e:
            print("Error verifying token: ", e)
            return jsonify({'error': str(e)}), 401
            
    return decorated 