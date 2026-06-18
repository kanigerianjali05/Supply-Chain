import requests
import json
import time

# Wait for server to start
time.sleep(2)

# Test health endpoint
try:
    response = requests.get('http://localhost:5000/api/health')
    print("✅ SERVER IS RUNNING!")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()
    
    # Get dashboard overview
    response = requests.get('http://localhost:5000/api/dashboard/overview')
    print("📊 Dashboard Overview:")
    print(json.dumps(response.json(), indent=2))
    print()
    
    # Get delay insights
    response = requests.get('http://localhost:5000/api/delay-prediction/insights')
    print("🤖 Model Insights:")
    insights = response.json()
    print(f"Model Trained: {insights.get('is_trained')}")
    print(f"Features: {insights.get('features', [])[:3]}...")
    
except Exception as e:
    print(f"❌ Error: {e}")
