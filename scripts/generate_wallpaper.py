import base64
import json
import os

import requests

API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
if not API_KEY:
    raise SystemExit("请先设置 GEMINI_API_KEY 或 GOOGLE_API_KEY")

# 使用你模型清单里最新且支持 predict 方法的 Imagen 4 Fast
MODEL = "imagen-4.0-fast-generate-001"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:predict?key={API_KEY}"

prompt = "Photorealistic majestic snowy mountain peak under a vast, crystal-clear starry night sky, milky way visible, crisp details, cinematic lighting, 8k resolution, desktop wallpaper style, 16:9 aspect ratio."

payload = {
    "instances": [{"prompt": prompt}],
    "parameters": {
        "sampleCount": 1,
        "aspectRatio": "16:9"
    }
}

print(f"Sending request to {MODEL}...")
response = requests.post(
    URL,
    headers={"Content-Type": "application/json"},
    data=json.dumps(payload),
    timeout=60
)

if response.status_code == 200:
    data = response.json()
    try:
        img_data = data["predictions"][0]["bytesBase64Encoded"]
        with open("snowy_mountain_wallpaper.png", "wb") as f:
            f.write(base64.b64decode(img_data))
        print("Success! Image saved as snowy_mountain_wallpaper.png")
    except KeyError:
        print("Error: Could not find image data in response.")
        print(json.dumps(data, indent=2))
else:
    print(f"Failed with status code {response.status_code}")
    print(response.text)
