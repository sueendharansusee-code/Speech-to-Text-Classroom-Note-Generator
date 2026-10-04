import sys
import os

# Add project root to sys.path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)

from backend.app import app, db, Note

def run_tests():
    print("Initializing Flask test client...")
    client = app.test_client()

    # 1. Test HTML homepage route
    res = client.get('/')
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert b'Classroom Note Generator' in res.data
    print("[OK] Route '/' HTML response verified.")

    # 2. Test sample note API
    res = client.get('/api/sample-note')
    assert res.status_code == 200
    json_data = res.get_json()
    assert json_data['success'] is True
    assert 'Quantum Mechanics' in json_data['sample']['title']
    print("[OK] API '/api/sample-note' verified.")

    # 3. Test text processing API
    res = client.post('/api/process-text', json={
        'text': 'hello class today we are learning python .  flask is awesome',
        'duration_seconds': 60
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert 'Hello class today we are learning python.' in data['cleaned_text']
    assert data['metrics']['word_count'] > 0
    print("[OK] API '/api/process-text' NLP cleaning verified.")

    # 4. Test note creation (POST /api/notes)
    res = client.post('/api/notes', json={
        'title': 'Test Physics Note',
        'subject': 'Physics',
        'content': 'This is a test note for physics classroom lecture.',
        'raw_transcript': 'this is a test note for physics classroom lecture',
        'duration_seconds': 120
    })
    assert res.status_code == 201
    created_note = res.get_json()['note']
    note_id = created_note['id']
    print(f"[OK] API 'POST /api/notes' created note ID #{note_id}.")

    # 5. Test note retrieval (GET /api/notes)
    res = client.get('/api/notes?subject=Physics')
    assert res.status_code == 200
    notes = res.get_json()['notes']
    assert len(notes) >= 1
    print("[OK] API 'GET /api/notes' filtered retrieval verified.")

    # 6. Test note deletion (DELETE /api/notes/<id>)
    res = client.delete(f'/api/notes/{note_id}')
    assert res.status_code == 200
    print(f"[OK] API 'DELETE /api/notes/{note_id}' verified.")

    print("\nALL BACKEND & DATABASE TESTS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    run_tests()
