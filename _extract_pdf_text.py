import sys
from pathlib import Path
path = Path("Petmongo_Project_Plan_FULL.pdf")
text = ""
try:
    import pdfplumber
    with pdfplumber.open(path) as pdf:
        text = "\n\n".join((page.extract_text() or "") for page in pdf.pages)
except Exception as e:
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(str(path))
        text = "\n\n".join((page.extract_text() or "") for page in reader.pages)
    except Exception as e2:
        print("PDF extract failed:", e, e2)
        sys.exit(1)
output_path = Path("_extract_pdf_text.txt")
output_path.write_text(text, encoding="utf-8", errors="replace")
print(f"Saved extracted text to {output_path}")
