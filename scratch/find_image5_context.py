with open(r'C:\Users\huawei\Downloads\CHAPTER_4_JAMINDAN_SYSTEM.doc', 'r', encoding='utf-16', errors='ignore') as f:
    html = f.read()

import re
idx = html.find('image005')
if idx != -1:
    start = max(0, idx - 1500)
    end = min(len(html), idx + 200)
    clean = re.sub(r'<[^>]+>', ' ', html[start:end])
    print(' '.join(clean.split()))
