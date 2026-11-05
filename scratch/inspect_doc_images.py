import re

with open(r'C:\Users\huawei\Downloads\CHAPTER_4_JAMINDAN_SYSTEM.doc', 'r', encoding='utf-16', errors='ignore') as f:
    text = f.read()

imgs = re.findall(r'src=["\']([^"\']+)["\']', text)
print(f"Total img src: {len(imgs)}")
for s in imgs:
    print(s)

# Also let's find Figure mentions and their nearest images
fig_matches = re.findall(r'(Figure\s+\d+[a-z]?[\s\S]{0,400}?src=["\']([^"\']+)["\'])', text, re.IGNORECASE)
print(f"\nFigure to image matches: {len(fig_matches)}")
for full, src in fig_matches:
    fig_name = full.split('\n')[0].strip()
    print(f"{fig_name} -> {src}")
