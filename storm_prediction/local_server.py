from flask import Flask, request, jsonify
from flask_cors import CORS
import app  # Import the Lambda handler logic
import json
import sys
import os

# Add current directory to path so app.py can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

server = Flask(__name__)
CORS(server)  # Enable CORS for frontend

@server.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        print("Received request:", data)
        
        # Mock Lambda event structure
        event = {
            'body': json.dumps(data)
        }
        
        # Call the Lambda handler
        response = app.handler(event, None)
        
        # Parse response
        if isinstance(response['body'], str):
            body = json.loads(response['body'])
        else:
            body = response['body']
            
        return jsonify(body), response['statusCode']
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting local prediction server on http://localhost:5000")
    server.run(port=5000, debug=True)
