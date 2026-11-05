import re
import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

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
    # Regex for **bold**, *italic*, and `code`
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

def build_docx(md_path, docx_path):
    doc = Document()

    # Set page margins to 1 inch
    sections = doc.sections
    for section in sections:
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
        
        # Parse rows
        parsed_rows = []
        for tl in table_lines:
            if re.match(r'^\s*\|?\s*[-:]+[-| :]*\|?\s*$', tl):
                continue # delimiter row
            parts = [c.strip() for c in tl.strip().strip('|').split('|')]
            parsed_rows.append(parts)
        
        if parsed_rows:
            col_count = max(len(r) for r in parsed_rows)
            tbl = doc.add_table(rows=len(parsed_rows), cols=col_count)
            tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
            tbl.autofit = True
            
            # Apply basic border
            tbl.style = 'Table Grid'
            
            for r_idx, row_data in enumerate(parsed_rows):
                row = tbl.rows[r_idx]
                is_header = (r_idx == 0)
                for c_idx in range(col_count):
                    cell = row.cells[c_idx]
                    set_cell_margins(cell, top=120, bottom=120, left=150, right=150)
                    if is_header:
                        set_cell_shading(cell, '1E3A8A') # Deep Blue header
                    elif r_idx % 2 == 1:
                        set_cell_shading(cell, 'F8FAFC') # Subtle alt row
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
        
        # Add a framed diagram code box
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = True
        cell = tbl.rows[0].cells[0]
        set_cell_shading(cell, 'F1F5F9')
        set_cell_margins(cell, top=150, bottom=150, left=200, right=200)
        
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
        r_note = p_note.add_run("*(Note: High-resolution visual diagrams and UI screenshots are embedded in the printed document.)*")
        r_note.font.name = 'Times New Roman'
        r_note.font.size = Pt(9.5)
        r_note.font.italic = True
        r_note.font.color.rgb = RGBColor(100, 116, 139)
        
        mermaid_lines = []
        in_mermaid = False

    i = 0
    while i < len(lines):
        line = lines[i]

        # Handle mermaid blocks
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

        # Handle tables
        if line.strip().startswith('|') and '|' in line.strip()[1:]:
            if not in_table:
                in_table = True
                table_lines = []
            table_lines.append(line)
            i += 1
            continue
        elif in_table:
            flush_table()

        # Handle Horizontal Rules
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

        # Blank lines
        if not line.strip():
            i += 1
            continue

        # Heading 1
        if line.startswith('# '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(18)
            p.paragraph_format.space_after = Pt(6)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            add_inline_runs(p, line[2:].strip(), base_font_size=16, base_bold=True, base_color=RGBColor(30, 58, 138))
            i += 1
            continue

        # Heading 2
        if line.startswith('## '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(14)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            add_inline_runs(p, line[3:].strip(), base_font_size=13, base_bold=True, base_color=RGBColor(51, 65, 85))
            i += 1
            continue

        # Heading 3
        if line.startswith('### '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(16)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.keep_with_next = True
            add_inline_runs(p, line[4:].strip(), base_font_size=13.5, base_bold=True, base_color=RGBColor(30, 58, 138))
            i += 1
            continue

        # Heading 4
        if line.startswith('#### '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.keep_with_next = True
            add_inline_runs(p, line[5:].strip(), base_font_size=12.5, base_bold=True, base_color=RGBColor(15, 23, 42))
            i += 1
            continue

        # Heading 5 (Figure / Table Titles)
        if line.startswith('##### '):
            heading_text = line[6:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.keep_with_next = True
            
            # Distinct blue for figures and tables
            add_inline_runs(p, heading_text, base_font_size=12, base_bold=True, base_color=RGBColor(30, 58, 138))
            
            # If this is a Figure heading, add an elegant placeholder box for screenshot paste
            if heading_text.startswith('Figure '):
                # We will check if the next line is a description or placeholder
                pass
            i += 1
            continue

        # Numbered list item
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

        # Bullet list item
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

        # Math formula lines: $$ ... $$
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

        # Regular Paragraph
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
    print(f"Successfully generated Word document: {docx_path}")

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.abspath(os.path.join(base_dir, '..'))
    md_file = os.path.join(project_dir, 'chapter_4_jamindan_manuscript.md')
    docx_file = os.path.join(project_dir, 'chapter_4_jamindan_manuscript.docx')
    build_docx(md_file, docx_file)
