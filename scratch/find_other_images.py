with open(r'C:\Users\huawei\Downloads\CHAPTER_4_JAMINDAN_SYSTEM.doc', 'r', encoding='utf-16', errors='ignore') as f:
    html = f.read()

import re
for img in ['image005', 'image006', 'image007', 'image008', 'image021']:
    idx = html.find(img)
    if idx != -1:
        start = max(0, idx - 400)
        end = min(len(html), idx + 200)
        print(f"--- {img} ---")
        clean = re.sub(r'<[^>]+>', ' ', html[start:end])
        print(' '.join(clean.split()))
