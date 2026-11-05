import docx

doc = docx.Document(r'C:\Users\huawei\Downloads\JAMINDAN_FINAL_CAPSTONE_MANUSCRIPT_COMPLETE.docx')
full_text = '\n'.join(p.text for p in doc.paragraphs).lower()
authors = ['vacaro', 'relano', 'altoveros', 'comparacion', 'manalad', 'paderes']
for a in authors:
    print(f'Author {a}: {full_text.count(a)} occurrences')
