import re

with open(r'C:\Users\huawei\Downloads\CHAPTER_4_JAMINDAN_SYSTEM.doc', 'r', encoding='utf-16', errors='ignore') as f:
    html = f.read()

# Find occurrences of CHAPTER_4_JAMINDAN_SYSTEM_files/image
pos = 0
while True:
    idx = html.find('CHAPTER_4_JAMINDAN_SYSTEM_files/image', pos)
    if idx == -1:
        break
    # print 300 chars before and 150 chars after
    start = max(0, idx - 300)
    end = min(len(html), idx + 100)
    snippet = html[start:end]
    clean_snippet = re.sub(r'<[^>]+>', ' ', snippet)
    clean_snippet = ' '.join(clean_snippet.split())
    print(clean_snippet)
    print('='*50)
    pos = idx + 40
