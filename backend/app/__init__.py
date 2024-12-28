from flask import Flask
from flask_cors import CORS
from .config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})   # Adjust the port if necessary    
    
    from app.routes import tasks
    app.register_blueprint(tasks.bp)
    
    @app.route('/health')
    def health_check():
        return {'status': 'healthy'}, 200
    
    return app 