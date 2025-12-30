from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from classifier import CivicClassifier
from pymongo import MongoClient
import os
import time
from datetime import datetime
from bson.objectid import ObjectId

from dotenv import load_dotenv
import os
import certifi

load_dotenv()

app = Flask(__name__)
CORS(app)

# --- Configuration ---
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise ValueError("No MONGO_URI found in environment variables") 

# Adding tlsAllowInvalidCertificates=True to bypass strict SSL errors on Render/Python 3.13
client = MongoClient(MONGO_URI, tlsCAFile=certifi.where(), tlsAllowInvalidCertificates=True)
db = client['civic_eye_db']
issues_collection = db['issues']

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize Classifier
classifier = CivicClassifier()

# --- Helpers ---
def serialize_doc(doc):
    doc['_id'] = str(doc['_id'])
    return doc

# --- Routes ---

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/issues', methods=['POST'])
def report_issue():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    lat = request.form.get('lat')
    lng = request.form.get('lng')

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file:
        # Save file locally
        filename = f"{int(time.time())}_{file.filename}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Run classification
        # Check if user provided a category (manual override), otherwise predict
        user_category = request.form.get('category')
        if user_category and user_category != 'null':
             category = user_category
        else:
             category = classifier.predict(filepath)
        
        # Construct Image URL (Localhost for now)
        # Construct Image URL (Dynamic)
        # Use request.host_url to automatically get http://localhost:5000 or production domain
        base_url = os.getenv("API_BASE_URL", request.host_url)
        # Remove trailing slash if present to avoid double slash
        if base_url.endswith('/'):
            base_url = base_url[:-1]
            
        image_url = f"{base_url}/uploads/{filename}"

        # Save to MongoDB
        issue_doc = {
            "imageUrl": image_url,
            "location": {
                "lat": float(lat) if lat else 0, 
                "lng": float(lng) if lng else 0
            },
            "status": "Pending",
            "category": category,
            "description": request.form.get('description', ''),
            "timestamp": datetime.utcnow()
        }
        
        result = issues_collection.insert_one(issue_doc)
        
        return jsonify({
            'message': 'Report submitted successfully',
            'id': str(result.inserted_id),
            'category': category,
            'imageUrl': image_url
        })

@app.route('/issues', methods=['GET'])
def get_issues():
    issues = list(issues_collection.find().sort("timestamp", -1))
    return jsonify([serialize_doc(issue) for issue in issues])

@app.route('/issues/<id>', methods=['PATCH'])
def update_status(id):
    data = request.json
    new_status = data.get('status')
    
    if not new_status:
        return jsonify({'error': 'Status required'}), 400

    issues_collection.update_one(
        {'_id': ObjectId(id)},
        {'$set': {'status': new_status}}
    )
    
    return jsonify({'message': 'Status updated'})

@app.route('/predict', methods=['POST'])
def predict_only():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file:
        # Save temporarily
        filename = f"temp_{int(time.time())}_{file.filename}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Predict
        category = classifier.predict(filepath)
        
        # Cleanup temp file
        try:
            os.remove(filepath)
        except:
            pass
            
        return jsonify({'category': category})

if __name__ == '__main__':
    print("Starting Civic-Eye Backend (MongoDB) on port 5000...")
    app.run(debug=True, port=5000)
