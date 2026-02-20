import requests

try:
    url = "http://localhost:8002/register"
    data = {
        "name": "Debug User",
        "email": "debug@example.com",
        "address": "Debug Address",
        "kyc_proof": "DEBUG-123"
    }
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print("Response Body:")
    print(response.text)
except Exception as e:
    print(e)
