from flask import Flask, request
from flask_cors import CORS

from app.routes import tasks
from app.config import Config
import os
import logging

def create_app():
    # Configure logging
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    )
    
    app = Flask(__name__)
    app.logger.setLevel(logging.DEBUG)
    
    # Load configuration
    app.config.from_object(Config)
    
    # Configure CORS
    # When running behind API Gateway, all requests will come from the API Gateway URL
    # We need to allow '*' because API Gateway's URL will be different from the frontend's origin
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",  # Allow all origins since requests come through API Gateway
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "expose_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    @app.before_request
    def log_request_info():
        app.logger.debug('Headers: %s', dict(request.headers))
        app.logger.debug('Body: %s', request.get_data())
        app.logger.debug('URL: %s', request.url)
        app.logger.debug('Method: %s', request.method)
    
    # Add health check endpoint
    @app.route('/health')
    def health_check():
        app.logger.info('Health check endpoint called')
        return {'status': 'healthy'}, 200
    
    # Register blueprints
    app.register_blueprint(tasks.bp, url_prefix='/api/tasks')
    
    return app 