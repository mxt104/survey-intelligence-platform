import io

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extracts plain text from a raw PDF byte stream using the pypdf library.
    """
    if PdfReader is None:
        return "Error: pypdf library is not installed. Please install it to parse PDF files."
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text_content = []
        for index, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text_content.append(page_text)
        return "\n".join(text_content).strip()
    except Exception as e:
        return f"Error extracting PDF: {str(e)}"
