from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Note(db.Model):
    __tablename__ = 'notes'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False, default="Untitled Note")
    subject = db.Column(db.String(100), nullable=False, default="General")
    content = db.Column(db.Text, nullable=False)
    raw_transcript = db.Column(db.Text, nullable=True)
    word_count = db.Column(db.Integer, default=0)
    char_count = db.Column(db.Integer, default=0)
    duration_seconds = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'subject': self.subject,
            'content': self.content,
            'raw_transcript': self.raw_transcript,
            'word_count': self.word_count,
            'char_count': self.char_count,
            'duration_seconds': self.duration_seconds,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
