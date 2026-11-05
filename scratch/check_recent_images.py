import os
from datetime import datetime

uploaded_dir = r"C:\Users\huawei\.gemini\antigravity\brain\48bcde98-2820-4a0c-931a-4df4c0f3cf5c\.user_uploaded"
files = [os.path.join(uploaded_dir, f) for f in os.listdir(uploaded_dir) if f.endswith(('.png', '.jpg', '.jpeg'))]
files.sort(key=os.path.getmtime, reverse=True)

print(f"Total uploaded images: {len(files)}")
print("Recent 15 uploads:")
for f in files[:15]:
    dt = datetime.fromtimestamp(os.path.getmtime(f)).strftime('%Y-%m-%d %H:%M:%S')
    print(f"{os.path.basename(f)}: {os.path.getsize(f)} bytes, modified: {dt}")
