/**
 * Main Application UI Coordinator
 * Connects Web Speech API, TextProcessor, StorageService, and DOM Elements.
 */
document.addEventListener('DOMContentLoaded', () => {
    // State variables
    let currentNoteId = null;
    let durationSeconds = 0;
    let timerInterval = null;
    let rawTranscript = '';
    let isRecordingActive = false;

    // DOM Elements
    const btnStart = document.getElementById('btnStart');
    const btnStop = document.getElementById('btnStop');
    const btnClean = document.getElementById('btnClean');
    const btnClear = document.getElementById('btnClear');
    const btnSave = document.getElementById('btnSave');
    const btnCopy = document.getElementById('btnCopy');
    const btnDownload = document.getElementById('btnDownload');
    const btnSample = document.getElementById('btnSample');
    const btnNewNote = document.getElementById('btnNewNote');
    const themeToggle = document.getElementById('themeToggle');

    const noteTitleInput = document.getElementById('noteTitle');
    const noteSubjectSelect = document.getElementById('noteSubject');
    const noteEditor = document.getElementById('noteEditor');
    const liveInterim = document.getElementById('liveInterim');
    const languageSelect = document.getElementById('languageSelect');

    const wordCountEl = document.getElementById('wordCount');
    const charCountEl = document.getElementById('charCount');
    const durationEl = document.getElementById('durationTimer');
    const readingTimeEl = document.getElementById('readingTime');

    const searchInput = document.getElementById('searchInput');
    const filterSubject = document.getElementById('filterSubject');
    const notesListEl = document.getElementById('notesList');
    const notesCountBadge = document.getElementById('notesCountBadge');

    const recordingStatus = document.getElementById('recordingStatus');
    const statusText = document.getElementById('statusText');
    const micPulse = document.getElementById('micPulse');

    const browserSupportBanner = document.getElementById('browserSupportBanner');
    const toastContainer = document.getElementById('toastContainer');

    // 1. Initial Browser Compatibility Check
    if (!window.speechController.isSupported) {
        if (browserSupportBanner) {
            browserSupportBanner.style.display = 'flex';
        }
        btnStart.disabled = true;
        showToast('Web Speech API is not supported in this browser. Use Chrome or Edge, or test with Sample Note.', 'warning');
    }

    // 2. Setup Speech Recognition Callbacks
    window.speechController.onResultCallback = ({ finalText, interimText }) => {
        if (finalText) {
            rawTranscript += finalText + ' ';
            const formattedChunk = TextProcessor.cleanText(finalText);
            
            if (noteEditor.value && !noteEditor.value.endsWith(' ') && !noteEditor.value.endsWith('\n')) {
                noteEditor.value += ' ';
            }
            noteEditor.value += formattedChunk;

            // Auto paragraph split on longer recordings
            if (rawTranscript.length > 300 && !noteEditor.value.includes('\n\n')) {
                noteEditor.value = TextProcessor.formatParagraphs(noteEditor.value);
            }

            updateMetrics();
        }

        if (interimText) {
            liveInterim.innerText = `💬 Listening: "${interimText.trim()}"`;
            liveInterim.style.display = 'block';
        } else {
            liveInterim.style.display = 'none';
        }
    };

    window.speechController.onStatusChangeCallback = ({ status, message }) => {
        statusText.innerText = message;
        if (status === 'recording') {
            recordingStatus.classList.add('active');
            micPulse.classList.add('pulsing');
            btnStart.disabled = true;
            btnStop.disabled = false;
        } else {
            recordingStatus.classList.remove('active');
            micPulse.classList.remove('pulsing');
            btnStart.disabled = false;
            btnStop.disabled = true;
        }
    };

    window.speechController.onErrorCallback = ({ error, message }) => {
        showToast(message, 'danger');
        stopRecording();
    };

    // 3. Timer Control
    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            durationSeconds++;
            durationEl.innerText = TextProcessor.formatDuration(durationSeconds);
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function resetTimer() {
        stopTimer();
        durationSeconds = 0;
        durationEl.innerText = '00:00:00';
    }

    // 4. Recording Start / Stop Actions
    function startRecording() {
        if (isRecordingActive) return;

        const lang = languageSelect.value || 'en-US';
        window.speechController.setLanguage(lang);

        const success = window.speechController.start();
        if (success) {
            isRecordingActive = true;
            startTimer();
            showToast('Microphone activated. Start speaking!', 'info');
        }
    }

    function stopRecording() {
        if (!isRecordingActive) return;

        window.speechController.stop();
        isRecordingActive = false;
        stopTimer();
        liveInterim.style.display = 'none';

        // Auto-clean & organize into paragraphs when recording stops
        if (noteEditor.value.trim()) {
            noteEditor.value = TextProcessor.formatParagraphs(noteEditor.value);
            updateMetrics();
        }

        showToast('Recording stopped. Notes organized!', 'success');
    }

    // 5. Update Metrics (Word count, character count, duration)
    function updateMetrics() {
        const text = noteEditor.value;
        const words = TextProcessor.countWords(text);
        const chars = TextProcessor.countCharacters(text);

        wordCountEl.innerText = words;
        charCountEl.innerText = chars;
        readingTimeEl.innerText = `${Math.ceil(words / 200)} min read`;
    }

    // 6. Text Editor Cleaning & Actions
    function applyAutoCleaning() {
        if (!noteEditor.value.trim()) {
            showToast('No text available to clean.', 'warning');
            return;
        }
        noteEditor.value = TextProcessor.formatParagraphs(noteEditor.value);
        updateMetrics();
        showToast('Text organized into structured paragraphs!', 'success');
    }

    function clearEditor() {
        if (noteEditor.value.trim() && !confirm('Are you sure you want to clear the current note?')) {
            return;
        }
        noteEditor.value = '';
        noteTitleInput.value = '';
        noteSubjectSelect.value = 'General';
        rawTranscript = '';
        currentNoteId = null;
        resetTimer();
        updateMetrics();
        showToast('Editor reset.', 'info');
    }

    // 7. Load Sample Note Feature
    async function loadSampleNote() {
        try {
            const sample = await StorageService.fetchSampleNote();
            if (sample) {
                noteTitleInput.value = sample.title;
                noteSubjectSelect.value = sample.subject;
                noteEditor.value = sample.content;
                rawTranscript = sample.raw_transcript;
                durationSeconds = sample.duration_seconds;

                durationEl.innerText = TextProcessor.formatDuration(durationSeconds);
                currentNoteId = null;
                updateMetrics();
                showToast('Demonstration classroom note loaded successfully!', 'success');
            }
        } catch (e) {
            showToast('Failed to load sample note.', 'danger');
        }
    }

    // 8. Save Note to SQLite Database
    async function saveNote() {
        const content = noteEditor.value.trim();
        if (!content) {
            showToast('Cannot save empty note. Please record or type text first.', 'warning');
            return;
        }

        const title = noteTitleInput.value.trim() || 'Untitled Note';
        const subject = noteSubjectSelect.value || 'General';

        const noteData = {
            title: title,
            subject: subject,
            content: content,
            raw_transcript: rawTranscript,
            duration_seconds: durationSeconds
        };

        try {
            if (currentNoteId) {
                // Update existing note
                const updated = await StorageService.updateNote(currentNoteId, noteData);
                showToast(`Note "${updated.title}" updated!`, 'success');
            } else {
                // Create new note
                const created = await StorageService.saveNote(noteData);
                currentNoteId = created.id;
                showToast(`Note "${created.title}" saved to database!`, 'success');
            }
            loadSavedNotesList();
        } catch (e) {
            showToast('Error saving note to database: ' + e.message, 'danger');
        }
    }

    // 9. Fetch and Render Saved Notes List in Sidebar
    async function loadSavedNotesList() {
        try {
            const query = searchInput.value.trim();
            const subject = filterSubject.value;

            const notes = await StorageService.fetchNotes(query, subject);
            notesCountBadge.innerText = notes.length;

            if (notes.length === 0) {
                notesListEl.innerHTML = `
                    <div class="empty-state">
                        <span class="empty-icon">📝</span>
                        <p>No saved notes found.</p>
                    </div>
                `;
                return;
            }

            notesListEl.innerHTML = notes.map(note => `
                <div class="note-card ${note.id === currentNoteId ? 'active' : ''}" data-id="${note.id}">
                    <div class="note-card-header">
                        <span class="note-subject-tag subject-${note.subject.toLowerCase()}">${note.subject}</span>
                        <span class="note-date">${new Date(note.created_at).toLocaleDateString()}</span>
                    </div>
                    <h4 class="note-card-title">${escapeHtml(note.title)}</h4>
                    <p class="note-card-preview">${escapeHtml(note.content.substring(0, 90))}...</p>
                    <div class="note-card-footer">
                        <span>📊 ${note.word_count} words</span>
                        <span>⏱️ ${TextProcessor.formatDuration(note.duration_seconds)}</span>
                        <button class="btn-icon delete-btn" data-id="${note.id}" title="Delete Note">🗑️</button>
                    </div>
                </div>
            `).join('');

            // Attach event listeners for selecting and deleting cards
            document.querySelectorAll('.note-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (e.target.classList.contains('delete-btn')) {
                        e.stopPropagation();
                        deleteNote(e.target.dataset.id);
                    } else {
                        openNote(card.dataset.id);
                    }
                });
            });

        } catch (e) {
            notesListEl.innerHTML = '<div class="empty-state"><p>Error loading saved notes.</p></div>';
        }
    }

    async function openNote(id) {
        try {
            const note = await StorageService.getNote(id);
            if (note) {
                currentNoteId = note.id;
                noteTitleInput.value = note.title;
                noteSubjectSelect.value = note.subject;
                noteEditor.value = note.content;
                rawTranscript = note.raw_transcript || '';
                durationSeconds = note.duration_seconds || 0;

                durationEl.innerText = TextProcessor.formatDuration(durationSeconds);
                updateMetrics();
                loadSavedNotesList(); // Highlight selected card
                showToast(`Opened note: "${note.title}"`, 'info');
            }
        } catch (e) {
            showToast('Failed to open note.', 'danger');
        }
    }

    async function deleteNote(id) {
        if (!confirm('Are you sure you want to delete this saved note?')) return;
        try {
            await StorageService.deleteNote(id);
            if (currentNoteId == id) {
                clearEditor();
            }
            loadSavedNotesList();
            showToast('Note deleted.', 'info');
        } catch (e) {
            showToast('Failed to delete note.', 'danger');
        }
    }

    // 10. Copy Note to Clipboard
    function copyNoteToClipboard() {
        const text = noteEditor.value.trim();
        if (!text) {
            showToast('Nothing to copy.', 'warning');
            return;
        }

        navigator.clipboard.writeText(text).then(() => {
            showToast('Note copied to clipboard! 📋', 'success');
        }).catch(err => {
            showToast('Clipboard copy failed. Try selecting manually.', 'danger');
        });
    }

    // 11. Export / Download Note as TXT File
    function downloadNoteAsTxt() {
        const content = noteEditor.value.trim();
        if (!content) {
            showToast('No content to download.', 'warning');
            return;
        }

        const title = noteTitleInput.value.trim() || 'Classroom_Note';
        const subject = noteSubjectSelect.value || 'General';
        const timestamp = new Date().toISOString().split('T')[0];
        
        const fileContent = `==================================================\n` +
                            `CLASSROOM NOTE: ${title.toUpperCase()}\n` +
                            `Subject: ${subject}\n` +
                            `Date: ${timestamp}\n` +
                            `Duration: ${TextProcessor.formatDuration(durationSeconds)}\n` +
                            `Word Count: ${TextProcessor.countWords(content)}\n` +
                            `==================================================\n\n` +
                            `${content}\n`;

        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${timestamp}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Downloaded note as TXT file! 📄', 'success');
    }

    // 12. Toast Notification Helper
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '✅',
            danger: '⚠️',
            warning: '⚡',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
            <span class="toast-message">${escapeHtml(message)}</span>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Utility: HTML Escaper
    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // 13. Theme Toggle Switcher
    function setupThemeToggle() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.checked = true;
        }

        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // Event Listeners
    btnStart.addEventListener('click', startRecording);
    btnStop.addEventListener('click', stopRecording);
    btnClean.addEventListener('click', applyAutoCleaning);
    btnClear.addEventListener('click', clearEditor);
    btnSave.addEventListener('click', saveNote);
    btnCopy.addEventListener('click', copyNoteToClipboard);
    btnDownload.addEventListener('click', downloadNoteAsTxt);
    btnSample.addEventListener('click', loadSampleNote);
    btnNewNote.addEventListener('click', clearEditor);

    noteEditor.addEventListener('input', updateMetrics);

    let searchTimeout = null;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadSavedNotesList, 300);
    });

    filterSubject.addEventListener('change', loadSavedNotesList);

    // Initialize App
    setupThemeToggle();
    loadSavedNotesList();
    updateMetrics();
});
