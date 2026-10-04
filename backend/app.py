import os
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

from backend.models import db, Note
from backend.text_processor import clean_text, organize_into_paragraphs, calculate_metrics

# Compute project base directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..'))
TEMPLATES_DIR = os.path.join(PROJECT_ROOT, 'templates')
STATIC_DIR = os.path.join(PROJECT_ROOT, 'static')
DB_DIR = os.path.join(PROJECT_ROOT, 'database')

# Ensure database directory exists
os.makedirs(DB_DIR, exist_ok=True)

app = Flask(
    __name__,
    template_folder=TEMPLATES_DIR,
    static_folder=STATIC_DIR
)
CORS(app)

# SQLite Database setup
db_path = os.path.join(DB_DIR, 'notes.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Ensure tables are created
with app.app_context():
    db.create_all()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/notes', methods=['GET'])
def get_notes():
    """
    Fetch saved notes with optional search query and subject filter.
    """
    search_query = request.args.get('search', '', type=str).strip()
    subject_filter = request.args.get('subject', '', type=str).strip()

    query = Note.query

    if subject_filter and subject_filter.lower() != 'all':
        query = query.filter(Note.subject.ilike(f'%{subject_filter}%'))

    if search_query:
        search_pattern = f'%{search_query}%'
        query = query.filter(
            (Note.title.ilike(search_pattern)) |
            (Note.subject.ilike(search_pattern)) |
            (Note.content.ilike(search_pattern))
        )

    notes = query.order_by(Note.created_at.desc()).all()
    return jsonify({
        'success': True,
        'count': len(notes),
        'notes': [note.to_dict() for note in notes]
    })


@app.route('/api/notes/<int:note_id>', methods=['GET'])
def get_note(note_id):
    note = Note.query.get_or_404(note_id)
    return jsonify({
        'success': True,
        'note': note.to_dict()
    })


@app.route('/api/notes', methods=['POST'])
def create_note():
    """
    Save a new classroom note to SQLite.
    """
    data = request.get_json() or {}
    
    content = data.get('content', '').strip()
    if not content:
        return jsonify({'success': False, 'error': 'Note content cannot be empty'}), 400

    title = data.get('title', '').strip() or 'Untitled Classroom Note'
    subject = data.get('subject', '').strip() or 'General'
    raw_transcript = data.get('raw_transcript', '')
    duration_seconds = int(data.get('duration_seconds', 0))

    metrics = calculate_metrics(content, duration_seconds)

    note = Note(
        title=title,
        subject=subject,
        content=content,
        raw_transcript=raw_transcript,
        word_count=metrics['word_count'],
        char_count=metrics['char_count'],
        duration_seconds=duration_seconds
    )

    db.session.add(note)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Note saved successfully!',
        'note': note.to_dict()
    }), 201


@app.route('/api/notes/<int:note_id>', methods=['PUT'])
def update_note(note_id):
    """
    Update an existing classroom note.
    """
    note = Note.query.get_or_404(note_id)
    data = request.get_json() or {}

    if 'title' in data:
        note.title = data['title'].strip() or 'Untitled Note'
    if 'subject' in data:
        note.subject = data['subject'].strip() or 'General'
    if 'content' in data:
        content = data['content'].strip()
        if not content:
            return jsonify({'success': False, 'error': 'Content cannot be empty'}), 400
        note.content = content
        metrics = calculate_metrics(content, note.duration_seconds)
        note.word_count = metrics['word_count']
        note.char_count = metrics['char_count']

    if 'duration_seconds' in data:
        note.duration_seconds = int(data['duration_seconds'])
        metrics = calculate_metrics(note.content, note.duration_seconds)
        note.word_count = metrics['word_count']
        note.char_count = metrics['char_count']

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Note updated successfully!',
        'note': note.to_dict()
    })


@app.route('/api/notes/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    note = Note.query.get_or_404(note_id)
    db.session.delete(note)
    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Note deleted successfully!'
    })


@app.route('/api/process-text', methods=['POST'])
def process_text():
    """
    Endpoint to organize raw speech transcript into clean paragraphs and calculate metrics.
    """
    data = request.get_json() or {}
    raw_text = data.get('text', '')
    duration_seconds = int(data.get('duration_seconds', 0))

    cleaned = clean_text(raw_text)
    formatted_paragraphs = organize_into_paragraphs(cleaned)
    metrics = calculate_metrics(formatted_paragraphs, duration_seconds)

    return jsonify({
        'success': True,
        'cleaned_text': formatted_paragraphs,
        'metrics': metrics
    })


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """
    Returns aggregate stats of saved notes.
    """
    total_notes = Note.query.count()
    total_words = db.session.query(db.func.sum(Note.word_count)).scalar() or 0
    total_duration = db.session.query(db.func.sum(Note.duration_seconds)).scalar() or 0

    hours = total_duration // 3600
    minutes = (total_duration % 3600) // 60
    seconds = total_duration % 60
    formatted_duration = f"{hours:02d}:{minutes:02d}:{seconds:02d}"

    return jsonify({
        'success': True,
        'stats': {
            'total_notes': total_notes,
            'total_words': total_words,
            'total_duration_seconds': total_duration,
            'formatted_duration': formatted_duration
        }
    })


@app.route('/api/sample-note', methods=['GET'])
def get_sample_note():
    """
    Returns sample demonstration note data for testing without speech API.
    """
    sample = {
        "title": "Physics 101: Introduction to Quantum Mechanics & Wave-Particle Duality",
        "subject": "Physics",
        "content": (
            "Good morning class. Today we are exploring the fundamental principles of quantum mechanics, "
            "focusing specifically on wave-particle duality and Planck's constant.\n\n"
            "Light exhibits properties of both waves and discrete particle packets called photons. "
            "In 1905, Albert Einstein explained the photoelectric effect by proposing that light energy is quantized. "
            "The energy of a photon is given by the equation E = hf, where h is Planck's constant (6.626 x 10^-34 J·s) "
            "and f is the frequency of radiation.\n\n"
            "Key takeaway points:\n"
            "1. Electromagnetic radiation displays both wave-like interference and particle-like impacts.\n"
            "2. Louis de Broglie hypothesized that matter particles such as electrons also possess characteristic wavelengths.\n"
            "3. The de Broglie wavelength equation is lambda = h / p, where p represents linear momentum.\n\n"
            "For next lecture, please review Chapter 4 on the Heisenberg Uncertainty Principle and solve problems 12 through 18."
        ),
        "raw_transcript": (
            "good morning class today we are exploring the fundamental principles of quantum mechanics "
            "focusing specifically on wave particle duality and planck's constant light exhibits properties of "
            "both waves and discrete particle packets called photons in 1905 albert einstein explained the photoelectric effect"
        ),
        "duration_seconds": 185
    }
    sample['metrics'] = calculate_metrics(sample['content'], sample['duration_seconds'])
    return jsonify({
        'success': True,
        'sample': sample
    })


if __name__ == '__main__':
    # Run development server
    app.run(host='127.0.0.1', port=5000, debug=True)
