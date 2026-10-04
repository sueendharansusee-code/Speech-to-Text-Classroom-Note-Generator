import re

def clean_text(text: str) -> str:
    """
    Cleans raw transcribed text:
    - Normalizes extra whitespace and newlines
    - Fixes spacing around punctuation (. , ? ! : ;)
    - Capitalizes the beginning of sentences
    """
    if not text:
        return ""
    
    # 1. Normalize spaces
    cleaned = re.sub(r'[ \t]+', ' ', text)
    cleaned = re.sub(r'\n\s*\n', '\n\n', cleaned)
    
    # 2. Fix spaces around punctuation
    cleaned = re.sub(r'\s+([.,?!:;])', r'\1', cleaned)
    cleaned = re.sub(r'([.,?!:;])(?=[A-Za-z])', r'\1 ', cleaned)
    
    # 3. Capitalize first letter of sentences
    def capitalize_match(match):
        punct = match.group(1) or ''
        space = match.group(2) or ''
        char = match.group(3).upper()
        return f"{punct}{space}{char}"

    # Capitalize very first character if letter
    if cleaned and cleaned[0].isalpha():
        cleaned = cleaned[0].upper() + cleaned[1:]

    # Capitalize after sentence-ending punctuation (. ? !)
    cleaned = re.sub(r'([.?!])(\s+)([a-z])', capitalize_match, cleaned)
    
    # Capitalize after newlines
    cleaned = re.sub(r'(\n+)([a-z])', lambda m: m.group(1) + m.group(2).upper(), cleaned)

    return cleaned.strip()

def organize_into_paragraphs(text: str, max_sentences: int = 4) -> str:
    """
    Splits continuous stream of sentences into formatted paragraphs.
    """
    cleaned = clean_text(text)
    if not cleaned:
        return ""

    # Split into sentences
    sentences = re.split(r'(?<=[.?!])\s+', cleaned)
    if not sentences:
        return cleaned

    paragraphs = []
    current = []

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        current.append(sentence)
        if len(current) >= max_sentences:
            paragraphs.append(" ".join(current))
            current = []

    if current:
        paragraphs.append(" ".join(current))

    return "\n\n".join(paragraphs)

def calculate_metrics(text: str, duration_seconds: int = 0) -> dict:
    """
    Calculates word count, character count, and estimated reading time.
    """
    if not text:
        return {
            "word_count": 0,
            "char_count": 0,
            "reading_time_min": 0,
            "duration_formatted": "00:00:00"
        }

    words = re.findall(r'\b\w+\b', text)
    word_count = len(words)
    char_count = len(text)
    
    # Average reading speed ~ 200 words per minute
    reading_time_min = round(word_count / 200, 1)

    # Format duration
    hours = duration_seconds // 3600
    minutes = (duration_seconds % 3600) // 60
    seconds = duration_seconds % 60
    duration_formatted = f"{hours:02d}:{minutes:02d}:{seconds:02d}"

    return {
        "word_count": word_count,
        "char_count": char_count,
        "reading_time_min": reading_time_min,
        "duration_formatted": duration_formatted
    }
