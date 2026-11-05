import os

img_dir = r"C:\Users\huawei\Downloads\CHAPTER_4_JAMINDAN_SYSTEM_files"
files = [f for f in os.listdir(img_dir) if f.startswith('image') and f.endswith(('.png', '.jpg'))]
files.sort()

for f in files:
    full_path = os.path.join(img_dir, f)
    size = os.path.getsize(full_path)
    print(f"{f}: {size} bytes")
