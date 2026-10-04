# 🎓 Speech-to-Text Classroom Note Generator

A full-stack web application designed for students and educators to convert live spoken classroom content into clean, structured, and organized written notes in real-time. Built using Python Flask, SQLite, vanilla JavaScript, HTML5/CSS3, and the Web Speech API.

---

## 🌟 Key Features

1. **🎙️ Real-time Speech Recognition**: Converts speech into written text in real time using the browser's Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`).
2. **▶️ Start & ⏹️ Stop Recording**: One-touch microphone controls with pulsing recording light indicator.
3. **💬 Live Transcription Display**: Displays interim speech with visual distinction before finalizing into text.
4. **📖 Automatic Paragraph Formatting**: Automatically groups continuous speech streams into clean, readable paragraphs.
5. **✨ Basic NLP Text Cleaning**:
   - Removes unnecessary duplicate spaces.
   - Capitalizes sentence beginnings and new lines.
   - Normalizes spacing around punctuation (`.`, `,`, `?`, `!`).
6. **📊 Live Metrics Dashboard**:
   - **Word Count**
   - **Character Count**
   - **Duration Timer** (`HH:MM:SS`)
   - **Estimated Reading Time**
7. **✏️ Interactive Note Editor**: Editable rich workspace allowing manual corrections, formatting, and content addition.
8. **💾 SQLite Database Storage**: Save notes with titles, subject tags (Physics, History, Biology, Math, General), duration, and timestamps.
9. **🔍 Search & Filter Saved Notes**: Instant search by keyword, title, content, or subject category.
10. **📋 Copy to Clipboard**: One-click copying of note contents.
11. **📄 Export / Download as TXT**: Export structured classroom notes to `.txt` files with custom headers and timestamps.
12. **🧪 Sample Demonstration Text**: "Load Sample Note" feature populates a realistic classroom lecture ("Quantum Mechanics & Wave-Particle Duality") for instant testing without a microphone.
13. **⚠️ Microphone Error Handling**: Gracefully handles permissions (`not-allowed`, `no-speech`, `audio-capture`) with actionable toast alerts.
14. **🌐 Unsupported Browser Detection**: Clear banner notification when Web Speech API is absent with fallback option.
15. **🎨 Classroom-Themed Responsive UI**: Academic notebook aesthetic with Dark/Light mode toggle, smooth card animations, and mobile responsiveness.

---

## 🏗️ Project Architecture & Structure

```
speech_to_text_notes/
├── backend/
│   ├── __init__.py
│   ├── app.py                # Flask application, REST API endpoints, static/template router
│   ├── models.py             # SQLAlchemy SQLite data models
│   └── text_processor.py     # Python text processing, paragraphing & metrics utilities
├── database/                 # Auto-created SQLite database directory (notes.db)
├── static/
│   ├── css/
│   │   └── style.css         # Academic notebook responsive styling & dark mode
│   └── js/
│       ├── app.js            # Main UI controller & DOM event coordinator
│       ├── speech.js         # Web Speech API wrapper with auto-reconnect & mic error handlers
│       ├── textProcessor.js  # Client-side NLP text cleaning & paragraph formatting
│       └── storage.js        # API service layer for Flask SQLite backend
├── templates/
│   └── index.html            # Main single-page application layout
├── .gitignore                # Excludes bytecode, venv, and SQLite files from git
├── requirements.txt          # Python dependencies (Flask, Flask-SQLAlchemy, Flask-CORS)
└── README.md                 # Complete documentation & usage guide
```

---

## 🌐 Browser Compatibility Matrix

| Browser | Web Speech API Support | Notes |
|---|---|---|
| **Google Chrome** | ✅ Fully Supported | Native continuous speech recognition |
| **Microsoft Edge** | ✅ Fully Supported | Excellent accuracy & low latency |
| **Safari** (macOS/iOS) | ✅ Supported | Requires mic permissions prompt |
| **Brave / Opera** | ✅ Supported | Ensure mic privacy permissions enabled |
| **Mozilla Firefox** | ⚠️ Flag / Restricted | Supports speech synthesis; use "Load Sample Note" to test all features |

---

## ⚙️ Installation & Setup Guide

### Prerequisites
- **Python 3.8+** installed on your system.
- A modern web browser (**Google Chrome** or **Microsoft Edge** recommended).

### Step 1: Clone or Navigate to Project Directory
```bash
git clone https://github.com/your-username/speech-to-text-notes.git
cd speech_to_text_notes
```

### Step 2: Create & Activate Virtual Environment

**On Windows:**
```powershell
python -m venv venv
.\venv\Scripts\activate
```

**On macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Run the Flask Application
```bash
python -m backend.app
```

The server will start at: `http://127.0.0.1:5000`

---

## 🚀 How to Use the Application

1. Open `http://127.0.0.1:5000` in Google Chrome or Microsoft Edge.
2. Select your lecture language (e.g. `English (US)`, `Spanish`, `French`, `German`, `Hindi`).
3. Click **🎙️ Start Recording** and allow microphone access when prompted by the browser.
4. Speak your classroom content. Watch live text appear and automatically organize into readable paragraphs!
5. Click **⏹️ Stop Recording** when done.
6. Use **✨ Auto-Format NLP** to clean up spaces and capitalize sentences.
7. Set a **Title** and **Subject Category** (e.g. Physics, History).
8. Click **💾 Save Note** to persist it to the SQLite database.
9. Search or load saved notes from the left sidebar anytime!
10. Click **📋 Copy Note** or **📄 Download TXT** to export your notes.

---

## 📡 REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Serves the main HTML application |
| `GET` | `/api/notes` | Retrieves saved notes (supports `?search=` and `?subject=` filters) |
| `GET` | `/api/notes/<id>` | Retrieves details for a specific note |
| `POST` | `/api/notes` | Saves a new classroom note to SQLite |
| `PUT` | `/api/notes/<id>` | Updates an existing note |
| `DELETE` | `/api/notes/<id>` | Deletes a note from SQLite |
| `POST` | `/api/process-text` | Performs server-side NLP text cleaning and paragraphing |
| `GET` | `/api/stats` | Returns total saved notes, word counts, and recording duration |
| `GET` | `/api/sample-note` | Provides a pre-configured sample classroom lecture |

---

## 🐙 Step-by-Step GitHub Instructions

To push this project to a GitHub repository:

### 1. Initialize Git Repository
```bash
git init
```

### 2. Add Remote GitHub Repository
Create a new repository on [GitHub](https://github.com/new) (e.g., `speech-to-text-notes`), then link it:
```bash
git remote add origin https://github.com/your-username/speech-to-text-notes.git
```

### 3. Stage & Commit Project Files
```bash
git add .
git commit -m "Initial commit: Complete Speech-to-Text Classroom Note Generator"
```

### 4. Push to Main Branch
```bash
git branch -M main
git push -u origin main
```

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
