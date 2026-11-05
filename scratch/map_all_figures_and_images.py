with open(r'C:\Users\huawei\Downloads\CHAPTER_4_JAMINDAN_SYSTEM.doc', 'r', encoding='utf-16', errors='ignore') as f:
    html = f.read()

import re

# Split by "Figure "
parts = re.split(r'(Figure\s+\d+[a-z]?[\.\:])', html)
print(f"Parts count: {len(parts)}")
for i in range(1, len(parts), 2):
    fig_header = parts[i]
    fig_body = parts[i+1] if i+1 < len(parts) else ""
    
    # Extract first 150 chars of text
    clean_text = ' '.join(re.sub(r'<[^>]+>', ' ', fig_body[:600]).split())
    # Extract any images in fig_body
    images = re.findall(r'CHAPTER_4_JAMINDAN_SYSTEM_files/(image\d+\.(?:png|jpg))', fig_body)
    print(f"{fig_header} -> {clean_text[:80]}...")
    print(f"   Images: {list(dict.fromkeys(images))}")
    print('-'*50)
