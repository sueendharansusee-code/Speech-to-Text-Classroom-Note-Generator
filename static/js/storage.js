/**
 * StorageService
 * API client layer communicating with Python Flask SQLite endpoints.
 */
class StorageService {
    static async fetchNotes(search = '', subject = 'all') {
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (subject && subject !== 'all') params.append('subject', subject);

            const url = `/api/notes?${params.toString()}`;
            const response = await fetch(url);
            const data = await response.json();
            return data.success ? data.notes : [];
        } catch (error) {
            console.error('Error fetching notes:', error);
            throw error;
        }
    }

    static async getNote(id) {
        try {
            const response = await fetch(`/api/notes/${id}`);
            const data = await response.json();
            return data.success ? data.note : null;
        } catch (error) {
            console.error(`Error fetching note ${id}:`, error);
            throw error;
        }
    }

    static async saveNote(noteData) {
        try {
            const response = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(noteData)
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error || 'Failed to save note');
            return data.note;
        } catch (error) {
            console.error('Error saving note:', error);
            throw error;
        }
    }

    static async updateNote(id, noteData) {
        try {
            const response = await fetch(`/api/notes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(noteData)
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error || 'Failed to update note');
            return data.note;
        } catch (error) {
            console.error(`Error updating note ${id}:`, error);
            throw error;
        }
    }

    static async deleteNote(id) {
        try {
            const response = await fetch(`/api/notes/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error || 'Failed to delete note');
            return true;
        } catch (error) {
            console.error(`Error deleting note ${id}:`, error);
            throw error;
        }
    }

    static async fetchSampleNote() {
        try {
            const response = await fetch('/api/sample-note');
            const data = await response.json();
            return data.success ? data.sample : null;
        } catch (error) {
            console.error('Error fetching sample note:', error);
            throw error;
        }
    }

    static async processServerText(text, durationSeconds = 0) {
        try {
            const response = await fetch('/api/process-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, duration_seconds: durationSeconds })
            });
            const data = await response.json();
            return data.success ? data : null;
        } catch (error) {
            console.error('Error processing text on server:', error);
            throw error;
        }
    }

    static async fetchStats() {
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            return data.success ? data.stats : null;
        } catch (error) {
            console.error('Error fetching stats:', error);
            return null;
        }
    }
}

window.StorageService = StorageService;
