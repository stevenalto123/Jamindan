import docx

doc = docx.Document(r'C:\Users\huawei\Downloads\JAMINDAN_FINAL_CAPSTONE_MANUSCRIPT_COMPLETE.docx')
print('=== MASTER THESIS INSPECTION ===')
print('Total paragraphs:', len(doc.paragraphs))
print('Total tables:', len(doc.tables))
print('Total sections:', len(doc.sections))

full_text = '\n'.join(p.text for p in doc.paragraphs)

print('\n--- CHECKING FOR UNWANTED POS / TEMPLATE KEYWORDS ---')
bad_words = ['Point-of-Sale', 'POS', 'coffee shop', 'barcode scanner', 'receipt printer', 'Juan Dela Cruz', '[Full Name]']
for bw in bad_words:
    count = full_text.lower().count(bw.lower())
    print(f'Keyword "{bw}": {count} occurrences')

print('\n--- CHECKING FOR AUTHORS ---')
authors = ['Vacaro', 'Relano', 'Altoveros', 'Comparacion', 'Manalad', 'Paderes']
for a in authors:
    print(f'Author "{a}": {full_text.count(a)} occurrences')

print('\n--- CHECKING CHAPTERS & MAJOR HEADINGS ---')
headings = ['TITLE PAGE', 'TABLE OF CONTENTS', 'LIST OF TABLES', 'LIST OF FIGURES', 'LIST OF APPENDICES',
             'CHAPTER I', 'CHAPTER II', 'CHAPTER III', 'CHAPTER IV', 'CHAPTER V', 'BIBLIOGRAPHY', 'APPENDICES',
             'APPENDIX A', 'APPENDIX B', 'APPENDIX C', 'APPENDIX D', 'APPENDIX E', 'APPENDIX F', 'APPENDIX G',
             'APPENDIX H', 'APPENDIX I', 'APPENDIX J', 'APPENDIX K', 'APPENDIX L', 'APPENDIX M']

for h in headings:
    found = h in full_text
    print(f'{h}: {"FOUND" if found else "MISSING"}')

images = [rel.target_ref for rel in doc.part.rels.values() if 'image' in rel.target_ref]
print(f'\nTotal embedded images across entire master thesis: {len(images)}')
