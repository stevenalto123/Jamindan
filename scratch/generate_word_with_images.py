import re
import os
import struct
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def get_image_size(file_path):
    """Get (width, height) of PNG or JPEG without PIL."""
    try:
        with open(file_path, 'rb') as f:
            data = f.read(30)
            if data[:8] == b'\x89PNG\r\n\x1a\n':
                w, h = struct.unpack('>II', data[16:24])
                return w, h
            elif data[:2] == b'\xff\xd8':
                f.seek(0)
                size = os.path.getsize(file_path)
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

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_inline_runs(paragraph, text, base_font_size=12, base_bold=False, base_color=None):
    tokens = re.split(r'(\*\*.*?\*\*|\*.*?\*|`.*?`)', text)
    for tok in tokens:
        if not tok:
            continue
        run = paragraph.add_run()
        run.font.name = 'Times New Roman'
        run.font.size = Pt(base_font_size)
        if base_color:
            run.font.color.rgb = base_color
        
        if tok.startswith('**') and tok.endswith('**') and len(tok) >= 4:
            run.text = tok[2:-2]
            run.bold = True
        elif tok.startswith('*') and tok.endswith('*') and len(tok) >= 2:
            run.text = tok[1:-1]
            run.italic = True
        elif tok.startswith('`') and tok.endswith('`') and len(tok) >= 2:
            run.text = tok[1:-1]
            run.font.name = 'Consolas'
            run.font.size = Pt(base_font_size - 1)
            run.font.color.rgb = RGBColor(180, 40, 40)
        else:
            run.text = tok
            run.bold = base_bold

NEW_IMG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'new_screenshots')

# Mapping of figure prefixes to freshly captured live system screenshot files
FIGURE_IMAGES = {
    "Figure 1.": [
        os.path.join(NEW_IMG_DIR, 'fig1a_resident_desktop.png'),
        os.path.join(NEW_IMG_DIR, 'fig1c_safety_checkin_mobile_closeup.png')
    ],
    "Figure 2.": [
        os.path.join(NEW_IMG_DIR, 'fig2_offline_sos_mobile.png')
    ],
    "Figure 3a.": [
        os.path.join(NEW_IMG_DIR, 'fig3a_wizard_step1.png')
    ],
    "Figure 3b.": [
        os.path.join(NEW_IMG_DIR, 'fig3b_wizard_step2.png')
    ],
    "Figure 4.": [
        os.path.join(NEW_IMG_DIR, 'fig4_track_status.png')
    ],
    "Figure 5.": [
        os.path.join(NEW_IMG_DIR, 'fig5_news_advisories.png')
    ],
    "Figure 6.": [
        os.path.join(NEW_IMG_DIR, 'fig6_safety_tips.png')
    ],
    "Figure 7.": [
        os.path.join(NEW_IMG_DIR, 'fig7_hotlines_mobile.png')
    ],
    "Figure 8.": [
        os.path.join(NEW_IMG_DIR, 'fig8_login.png')
    ],
    "Figure 9.": [
        os.path.join(NEW_IMG_DIR, 'fig9_admin_dashboard.png')
    ],
    "Figure 10.": [
        os.path.join(NEW_IMG_DIR, 'fig10_command_map.png')
    ],
    "Figure 11.": [
        os.path.join(NEW_IMG_DIR, 'fig11_incident_inbox.png')
    ],
    "Figure 12a.": [
        os.path.join(NEW_IMG_DIR, 'fig12a_evacuation_mobile.png')
    ],
    "Figure 12b.": [
        os.path.join(NEW_IMG_DIR, 'fig12b_evacuation_route_bar.png')
    ],
    "Figure 13.": [
        os.path.join(NEW_IMG_DIR, 'fig13_household.png')
    ],
    "Figure 14.": [
        os.path.join(NEW_IMG_DIR, 'fig14_fleet_vehicles.png')
    ],
    "Figure 15.": [
        os.path.join(NEW_IMG_DIR, 'fig15_user_management.png')
    ],
    "Figure 16.": [
        os.path.join(NEW_IMG_DIR, 'fig16_system_logs.png')
    ],
    "Figure 17a.": [
        os.path.join(NEW_IMG_DIR, 'fig17a_analytics_desktop.png')
    ],
    "Figure 17b.": [
        os.path.join(NEW_IMG_DIR, 'fig17b_analytics_mobile_cards.png')
    ]
}

def add_figure_images(doc, heading_text):
    for prefix, img_list in FIGURE_IMAGES.items():
        if heading_text.startswith(prefix):
            for img_path in img_list:
                if os.path.exists(img_path):
                    w, h = get_image_size(img_path)
                    p_img = doc.add_paragraph()
                    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    p_img.paragraph_format.space_before = Pt(6)
                    p_img.paragraph_format.space_after = Pt(8)
                    
                    # Choose width based on portrait vs landscape
                    if w > 0 and h > 0 and (h / w) > 1.2:
                        target_width = Inches(2.8) # portrait phone
                    elif w > 0 and h > 0 and (h / w) > 0.85:
                        target_width = Inches(3.8) # square-ish / card
                    else:
                        target_width = Inches(6.0) # wide desktop
                        
                    doc.add_picture(img_path, width=target_width)
            break

def build_docx_with_images(md_path, docx_path):
    doc = Document()

    # Set page margins to 1 inch
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    with open(md_path, 'r', encoding='utf-8') as f:
        lines = [line.rstrip('\r\n') for line in f]

    in_table = False
    table_lines = []
    in_mermaid = False
    mermaid_lines = []

    def flush_table():
        nonlocal in_table, table_lines
        if not table_lines:
            return
        
        parsed_rows = []
        for tl in table_lines:
            if re.match(r'^\s*\|?\s*[-:]+[-| :]*\|?\s*$', tl):
                continue
            parts = [c.strip() for c in tl.strip().strip('|').split('|')]
            parsed_rows.append(parts)
        
        if parsed_rows:
            col_count = max(len(r) for r in parsed_rows)
            tbl = doc.add_table(rows=len(parsed_rows), cols=col_count)
            tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
            tbl.autofit = True
            tbl.style = 'Table Grid'
            
            for r_idx, row_data in enumerate(parsed_rows):
                row = tbl.rows[r_idx]
                is_header = (r_idx == 0)
                for c_idx in range(col_count):
                    cell = row.cells[c_idx]
                    set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
                    if is_header:
                        set_cell_shading(cell, '1E3A8A')
                    elif r_idx % 2 == 1:
                        set_cell_shading(cell, 'F8FAFC')
                    else:
                        set_cell_shading(cell, 'FFFFFF')

                    val = row_data[c_idx] if c_idx < len(row_data) else ''
                    p = cell.paragraphs[0]
                    p.paragraph_format.space_before = Pt(2)
                    p.paragraph_format.space_after = Pt(2)
                    p.paragraph_format.line_spacing = 1.15
                    
                    if is_header:
                        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                        add_inline_runs(p, val, base_font_size=10, base_bold=True, base_color=RGBColor(255, 255, 255))
                    else:
                        add_inline_runs(p, val, base_font_size=10, base_bold=False, base_color=RGBColor(30, 41, 59))
            
            doc.add_paragraph().paragraph_format.space_after = Pt(6)
        
        table_lines = []
        in_table = False

    def flush_mermaid():
        nonlocal in_mermaid, mermaid_lines
        if not mermaid_lines:
            return
        
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = True
        cell = tbl.rows[0].cells[0]
        set_cell_shading(cell, 'F1F5F9')
        set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.1
        
        run_title = p.add_run("[Mermaid Architecture Flowchart / Diagram Source]\n")
        run_title.font.name = 'Consolas'
        run_title.font.size = Pt(9.5)
        run_title.font.color.rgb = RGBColor(30, 58, 138)
        run_title.bold = True
        
        run_code = p.add_run('\n'.join(mermaid_lines))
        run_code.font.name = 'Consolas'
        run_code.font.size = Pt(8.5)
        run_code.font.color.rgb = RGBColor(51, 65, 85)
        
        p_note = doc.add_paragraph()
        p_note.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_note.paragraph_format.space_before = Pt(4)
        p_note.paragraph_format.space_after = Pt(12)
        r_note = p_note.add_run("*(Note: High-resolution visual diagrams and UI screenshots are embedded above/below in the document.)*")
        r_note.font.name = 'Times New Roman'
        r_note.font.size = Pt(9.5)
        r_note.font.italic = True
        r_note.font.color.rgb = RGBColor(100, 116, 139)
        
        mermaid_lines = []
        in_mermaid = False

    i = 0
    while i < len(lines):
        line = lines[i]

        if line.strip().startswith('```mermaid'):
            if in_table:
                flush_table()
            in_mermaid = True
            mermaid_lines = []
            i += 1
            continue
        elif in_mermaid:
            if line.strip().startswith('```'):
                flush_mermaid()
            else:
                mermaid_lines.append(line)
            i += 1
            continue

        if line.strip().startswith('|') and '|' in line.strip()[1:]:
            if not in_table:
                in_table = True
                table_lines = []
            table_lines.append(line)
            i += 1
            continue
        elif in_table:
            flush_table()

        if line.strip() in ['---', '***', '___']:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(8)
            r = p.add_run("_________________________________________________________________________________")
            r.font.name = 'Times New Roman'
            r.font.size = Pt(9)
            r.font.color.rgb = RGBColor(203, 213, 225)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            i += 1
            continue

        if not line.strip():
            i += 1
            continue

        if line.startswith('# '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(18)
            p.paragraph_format.space_after = Pt(6)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            add_inline_runs(p, line[2:].strip(), base_font_size=16, base_bold=True, base_color=RGBColor(30, 58, 138))
            i += 1
            continue

        if line.startswith('## '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(14)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            add_inline_runs(p, line[3:].strip(), base_font_size=13, base_bold=True, base_color=RGBColor(51, 65, 85))
            i += 1
            continue

        if line.startswith('### '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(16)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.keep_with_next = True
            add_inline_runs(p, line[4:].strip(), base_font_size=13.5, base_bold=True, base_color=RGBColor(30, 58, 138))
            i += 1
            continue

        if line.startswith('#### '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.keep_with_next = True
            add_inline_runs(p, line[5:].strip(), base_font_size=12.5, base_bold=True, base_color=RGBColor(15, 23, 42))
            i += 1
            continue

        if line.startswith('##### '):
            heading_text = line[6:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.keep_with_next = True
            add_inline_runs(p, heading_text, base_font_size=12, base_bold=True, base_color=RGBColor(30, 58, 138))
            
            # Embed corresponding screenshot image directly!
            if heading_text.startswith('Figure '):
                add_figure_images(doc, heading_text)
                
            i += 1
            continue

        num_match = re.match(r'^(\d+)\.\s+(.*)$', line)
        if num_match:
            num = num_match.group(1)
            content = num_match.group(2)
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.3)
            p.paragraph_format.first_line_indent = Inches(-0.3)
            p.paragraph_format.space_before = Pt(3)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.3
            run_num = p.add_run(f"{num}. ")
            run_num.font.name = 'Times New Roman'
            run_num.font.size = Pt(12)
            run_num.bold = True
            add_inline_runs(p, content, base_font_size=12)
            i += 1
            continue

        bullet_match = re.match(r'^\s*[-*]\s+(.*)$', line)
        if bullet_match:
            content = bullet_match.group(1)
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.3)
            p.paragraph_format.first_line_indent = Inches(-0.2)
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.3
            run_b = p.add_run("• ")
            run_b.font.name = 'Times New Roman'
            run_b.font.size = Pt(12)
            run_b.bold = True
            add_inline_runs(p, content, base_font_size=12)
            i += 1
            continue

        if line.strip().startswith('$$') and line.strip().endswith('$$') and len(line.strip()) > 4:
            formula = line.strip()[2:-2].strip()
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(6)
            r = p.add_run(formula)
            r.font.name = 'Cambria Math'
            r.font.size = Pt(12)
            r.font.italic = True
            i += 1
            continue

        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.35
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        add_inline_runs(p, line, base_font_size=12)
        i += 1

    if in_table:
        flush_table()
    if in_mermaid:
        flush_mermaid()

    doc.save(docx_path)
    print(f"Successfully generated Word document with embedded screenshots: {docx_path}")

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.abspath(os.path.join(base_dir, '..'))
    md_file = os.path.join(project_dir, 'chapter_4_jamindan_manuscript.md')
    docx_file = os.path.join(project_dir, 'chapter_4_jamindan_manuscript.docx')
    build_docx_with_images(md_file, docx_file)
