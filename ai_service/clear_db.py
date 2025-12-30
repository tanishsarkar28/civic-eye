from pymongo import MongoClient
from dotenv import load_dotenv
import os
import sys
import certifi

# Load environment variables
load_dotenv()

# Get MongoDB URI
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    print("❌ Error: MONGO_URI not found in .env file.")
    exit(1)

try:
    # Connect
    print("🔌 Connecting to MongoDB...")
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where(), tlsAllowInvalidCertificates=True)
    db = client['civic_eye_db']
    
    # Confirm
    count = db['issues'].count_documents({})
    print(f"📉 Found {count} issues in the database.")
    
    if "--force" in sys.argv:
        confirm = 'yes'
        print("⚠️  Force mode enabled. Deleting automatically...")
    else:
        confirm = input("⚠️  ARE YOU SURE you want to delete ALL issues? (type 'yes' to confirm): ")
    
    if confirm.lower() == 'yes':
        # Drop the collection (fastest way to clear)
        db['issues'].drop()
        print("✅ Database cleared! All issues have been deleted.")
    else:
        print("❌ Operation cancelled.")

except Exception as e:
    print(f"❌ Error: {e}")
