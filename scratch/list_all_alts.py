import re

with open(r'C:\Users\huawei\Downloads\CHAPTER_4_JAMINDAN_SYSTEM.doc', 'r', encoding='utf-16', errors='ignore') as f:
    html = f.read()

# Find all v:shape or img with alt
matches = re.findall(r'alt="([^"]*)"[^>]*src="([^"]*)"', html)
for alt, src in matches:
    print(f"{src} ===> {alt}")

# Also find shape alt
matches2 = re.findall(r'<v:shape[^>]*alt="([^"]*)"[\s\S]*?<v:imagedata[^>]*src="([^"]*)"', html)
for alt, src in matches2:
    print(f"Shape: {src} ===> {alt}")
