import requests
import json
import toml

secrets = toml.load("./Test/secrets.toml")
account_identifier = secrets["snowflake"]["account"]
api_key = secrets["snowflake"]["api_key"]

endpoint = f"https://{account_identifier}.snowflakecomputing.com/api/v2/cortex/inference:complete"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {api_key}"
}

body = {
    "model": "claude-3-5-sonnet",
    "messages": [
        {"role": "user", "content": "Write me a one line poem about Snowflake"}
    ]
}

response = requests.post(endpoint, headers=headers, data=json.dumps(body))

if response.status_code == 200:
    print(response.json())
else:
    print(f"Error {response.status_code}: {response.text}")
