import re

with open(r'C:\Users\huawei\Downloads\CHAPTER_4_JAMINDAN_SYSTEM.doc', 'r', encoding='utf-16', errors='ignore') as f:
    html = f.read()

# Let's find all paragraphs containing "Figure" and the subsequent img src
pattern = r'(<b>Figure\s+[\d\w\.\s\-–:]+?</b>)[\s\S]*?(CHAPTER_4_JAMINDAN_SYSTEM_files/(?:image\d+\.(?:png|jpg)))'
matches = re.findall(pattern, html, re.IGNORECASE)

print(f"Matched {len(matches)} figures with images:")
for fig, img in matches:
    clean_fig = re.sub(r'<[^>]+>', '', fig).strip()
    print(f"{clean_fig} ===> {img}")
