import os
import re
import struct
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

import thesis_content as tc

BASE_DIR = r"C:\Users\huawei\Documents\jamindan-emergency-response"
SCRATCH_DIR = os.path.join(BASE_DIR, "scratch")
NEW_IMG_DIR = os.path.join(SCRATCH_DIR, "new_screenshots")
DIAGRAM_DIR = os.path.join(SCRATCH_DIR, "diagram_images")
SRC_DOCX = r"C:\Users\huawei\Downloads\Thesis-Paper-Chapters_1-3.docx"
OUT_DOCX = r"C:\Users\huawei\Downloads\JAMINDAN_FINAL_CAPSTONE_MANUSCRIPT_COMPLETE.docx"

def get_image_size(file_path):
    try:
        with open(file_path, 'rb') as f:
            data = f.read(30)
            if data[:8] == b'\x89PNG\r\n\x1a\n':
                w, h = struct.unpack('>II', data[16:24])
                return w, h
            elif data[:2] == b'\xff\xd8':
                f.seek(0)
                f.read(2)
                b = f.read(1)
                while b:
                    while b != b'\xff':
                        b = f.read(1)
                    while b == b'\xff':
                        b = f.read(1)
                    if b >= b'\xc0' and b <= b'\xc3':
                        f.read(3)
                        h, w = struct.unpack('>HH', f.read(4))
                        return w, h
                    else:
                        f.read(int.from_bytes(f.read(2), 'big') - 2)
                    b = f.read(1)
    except Exception:
        pass
    return 800, 600

def set_cell_shading(cell, color_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=130, right=130):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_styled_paragraph(doc, text, align=WD_ALIGN_PARAGRAPH.JUSTIFY, 
                         first_line_indent=0.5, line_spacing=2.0, space_before=0, space_after=6,
                         bold=False, italic=False, font_size=12, font_name='Arial'):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.first_line_indent = Inches(first_line_indent) if first_line_indent else None
    p.paragraph_format.line_spacing = line_spacing
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    
    tokens = re.split(r'(\*\*.*?\*\*|\*.*?\*|`.*?`)', text)
    for tok in tokens:
        if not tok:
            continue
        run = p.add_run()
        run.font.name = font_name
        run.font.size = Pt(font_size)
        if tok.startswith('**') and tok.endswith('**') and len(tok) >= 4:
            run.text = tok[2:-2]
            run.bold = True
        elif tok.startswith('*') and tok.endswith('*') and len(tok) >= 2:
            run.text = tok[1:-1]
            run.italic = True
        elif tok.startswith('`') and tok.endswith('`') and len(tok) >= 2:
            run.text = tok[1:-1]
            run.font.name = 'Consolas'
            run.font.size = Pt(font_size - 1)
        else:
            run.text = tok
            run.bold = bold
            run.italic = italic
    return p

def add_heading_1(doc, text, font_name='Arial'):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(20)
    p.paragraph_format.space_after = Pt(12)
    p.paragraph_format.first_line_indent = None
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(text)
    run.font.name = font_name
    run.font.size = Pt(14)
    run.bold = True
    return p

def add_heading_2(doc, text, font_name='Arial'):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.first_line_indent = None
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(text)
    run.font.name = font_name
    run.font.size = Pt(12)
    run.bold = True
    return p

def add_heading_3(doc, text, font_name='Arial'):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.first_line_indent = None
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(text)
    run.font.name = font_name
    run.font.size = Pt(12)
    run.bold = True
    run.italic = True
    return p

def add_figure_caption(doc, figure_num, title, font_name='Arial'):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(14)
    p.paragraph_format.first_line_indent = None
    p.paragraph_format.line_spacing = 1.15
    run1 = p.add_run(f"Figure {figure_num}. ")
    run1.bold = True
    run1.font.name = font_name
    run1.font.size = Pt(11)
    run2 = p.add_run(title)
    run2.italic = True
    run2.font.name = font_name
    run2.font.size = Pt(11)
    return p

def add_table_caption(doc, table_num, title, font_name='Arial'):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.first_line_indent = None
    p.paragraph_format.line_spacing = 1.15
    run1 = p.add_run(f"Table {table_num}. ")
    run1.bold = True
    run1.font.name = font_name
    run1.font.size = Pt(11)
    run2 = p.add_run(title)
    run2.font.name = font_name
    run2.font.size = Pt(11)
    return p

def add_image_centered(doc, img_path, target_width=None):
    if not os.path.exists(img_path):
        return None
    w, h = get_image_size(img_path)
    if target_width is None:
        if 'diagram_images' in img_path:
            if w > 0 and h > 0 and (h / w) > 1.3:
                target_width = Inches(3.6)
            elif w > 0 and h > 0 and (h / w) > 0.9:
                target_width = Inches(4.8)
            else:
                target_width = Inches(5.8)
        elif w > 0 and h > 0 and (h / w) > 1.2:
            target_width = Inches(2.7) # portrait phone
        elif w > 0 and h > 0 and (h / w) > 0.85:
            target_width = Inches(3.8)
        else:
            target_width = Inches(5.8) # landscape
            
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.first_line_indent = None
    doc.add_picture(img_path, width=target_width)
    return p

def add_custom_table(doc, headers, rows, col_widths=None):
    tbl = doc.add_table(rows=len(rows) + 1, cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    tbl.style = 'Table Grid'
    
    # Header
    hdr_cells = tbl.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_margins(hdr_cells[i], top=100, bottom=100, left=120, right=120)
        set_cell_shading(hdr_cells[i], '1E3A8A')
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing = 1.0
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.first_line_indent = None
        for r in p.runs:
            r.font.name = 'Arial'
            r.font.size = Pt(10)
            r.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)
            
    # Rows
    for r_idx, row_data in enumerate(rows):
        row_cells = tbl.rows[r_idx + 1].cells
        is_even = (r_idx % 2 == 1)
        for c_idx, val in enumerate(row_data):
            row_cells[c_idx].text = str(val)
            set_cell_margins(row_cells[c_idx], top=80, bottom=80, left=120, right=120)
            set_cell_shading(row_cells[c_idx], 'F8FAFC' if is_even else 'FFFFFF')
            p = row_cells[c_idx].paragraphs[0]
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.first_line_indent = None
            if c_idx > 0 and len(row_data) > 3 and c_idx >= len(row_data) - 2:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(9.5)
                
    if col_widths and len(col_widths) == len(headers):
        for row in tbl.rows:
            for idx, w in enumerate(col_widths):
                row.cells[idx].width = Inches(w)
                
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(0)
    p_after.paragraph_format.space_after = Pt(8)
    p_after.paragraph_format.first_line_indent = None
    return tbl

def add_leader_line(doc, title, page_num, indent_inches=0, font_name='Arial'):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.left_indent = Inches(indent_inches) if indent_inches else None
    p.paragraph_format.first_line_indent = None
    
    target_len = 66 - int(indent_inches * 12)
    title_clean = title.strip()
    dots_needed = max(4, target_len - len(title_clean) - len(str(page_num)))
    dots_str = " " + ". " * (dots_needed // 2) + " "
    
    run_t = p.add_run(title_clean)
    run_t.font.name = font_name
    run_t.font.size = Pt(11)
    if indent_inches == 0:
        run_t.bold = True
        
    run_d = p.add_run(dots_str)
    run_d.font.name = font_name
    run_d.font.size = Pt(10)
    run_d.font.color.rgb = RGBColor(120, 120, 120)
    
    run_p = p.add_run(str(page_num))
    run_p.font.name = font_name
    run_p.font.size = Pt(11)
    if indent_inches == 0:
        run_p.bold = True
    return p

print("Loaded all formatting functions. Proceeding with execution...")
