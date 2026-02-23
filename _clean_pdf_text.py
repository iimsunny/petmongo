from pathlib import Path
path = Path('_extract_pdf_text.txt')
text = path.read_text(encoding='utf-8', errors='replace')
clean = text.replace('\x00', '')
Path('_extract_pdf_text_clean.txt').write_text(clean, encoding='utf-8')
print('clean saved')
