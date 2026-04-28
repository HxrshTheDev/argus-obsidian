import requests
import json

def test_backend():
    url = "http://127.0.0.1:8000/process"
    payload = {
        "text": "Hello! I am testing the new NVIDIA Nemotron model integration. Can you tell me your name?"
    }
    headers = {
        "Content-Type": "application/json"
    }

    try:
        print(f"Sending request to {url}...")
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ Success!")
            print(f"Masked Text: {result.get('masked')}")
            print(f"AI Response (Nemotron): {result.get('improved')}")
        else:
            print(f"\n❌ Error: Received status code {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"\n❌ Failed to connect: {str(e)}")

if __name__ == "__main__":
    test_backend()
