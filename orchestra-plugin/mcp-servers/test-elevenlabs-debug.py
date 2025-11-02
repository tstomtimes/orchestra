#!/usr/bin/env python3
import os
import requests

# Load .env
env_path = "../../.env"
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key] = value

api_key = os.getenv("ELEVENLABS_API_KEY")
print(f"API Key present: {bool(api_key)}")
print(f"API Key prefix: {api_key[:10] if api_key else 'None'}...")

# Test API connection
url = "https://api.elevenlabs.io/v1/voices"
headers = {
    "xi-api-key": api_key
}

try:
    response = requests.get(url, headers=headers, timeout=10)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Body: {response.text[:500]}")
except Exception as e:
    print(f"Error: {e}")
