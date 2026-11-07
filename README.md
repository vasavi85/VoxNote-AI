# VoxNote AI
> **Turn Every Voice Into Intelligent Notes** — AI-Powered Multilingual Audio Transcription and Smart Notes Generator powered by **Gnani AI Prisma v3.0**.

---

## 🚀 Overview

**VoxNote AI** is a production-grade full-stack web application engineered for the linguistic diversity of India. Using Gnani AI's state-of-the-art **Prisma v3.0** multilingual speech recognition model (`prisma-v3.0`), VoxNote AI transcribes audio files and real-time microphone streams across **10 Indian regional languages** and complex code-mixed conversations (such as Hinglish, Tanglish, and Tenglish).

Following transcription, an intelligent synthesis engine automatically parses the speech into **8 distinct smart note formats**:
1. **Executive Short Summary**
2. **Detailed Multi-Paragraph Synthesis**
3. **Core Takeaways (Key Points)**
4. **Action Items & Next Steps** (with interactive tracking)
5. **Meeting Notes** (Agenda, Discussions, Outcomes)
6. **Lecture & Study Notes** (Key Concepts, Explanations, Review Q&A)
7. **Important Questions**
8. **Topical Keywords & Tags**

Records are persistently stored in SQLite, and comprehensive formatted reports can be exported instantly to **PDF** (via ReportLab) and **Plain Text (TXT)**.

---

## ✨ Features

- **Gnani Prisma v3.0 Integration:** Direct integration with official `gnani-vachana` SDK (v0.9.0) with zero simulated transcripts.
- **10 Indian Languages Supported:**
  1. English (`en-IN`)
  2. Hindi (`hi-IN` - हिन्दी)
  3. Bengali (`bn-IN` - বাংলা)
  4. Marathi (`mr-IN` - मराठी)
  5. Gujarati (`gu-IN` - ગુજરાતી)
  6. Punjabi (`pa-IN` - ਪੰਜਾਬੀ)
  7. Kannada (`kn-IN` - ಕನ್ನಡ)
  8. Telugu (`te-IN` - తెలుగు)
  9. Tamil (`ta-IN` - தமிழ்)
  10. Malayalam (`ml-IN` - മലയാളം)
- **Automatic Language Identification (`indic-auto`):** Auto-detects the spoken dialect per utterance.
- **4 Output Modes:**
  - `transcribe`: Clean inverse text normalized (ITN) text with formatted numbers, dates, and currencies.
  - `verbatim`: Word-for-word spoken speech including repetitions.
  - `codemix`: Preserves native script for Indic words and Latin script for English terminology.
  - `transliterate`: Hinglish-style Latin script representation without semantic translation.
- **Real-Time WebSocket Streaming:** Low-latency live microphone streaming over WebSockets (16 kHz mono 16-bit PCM) with server-side Voice Activity Detection (VAD).
- **Long Audio Handling:** Intelligent automatic WAV chunking with `previous_text` context chaining for recordings exceeding 30 seconds.
- **Asynchronous Batch API:** Support for longer recordings via Gnani Batch STT.
- **ReportLab PDF Generator:** Beautifully branded PDF document exports with metadata tables, summaries, and transcripts.
- **Local SQLite Database:** SQLAlchemy ORM storage for persistent history, statistics, and notes.

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React.js 19 + Vite 8
- **Styling:** Tailwind CSS v4 + Custom Glassmorphism UI
- **Icons:** Lucide React
- **HTTP & Streaming:** Axios & Browser WebSocket / Web Audio API
- **Routing:** React Router v7

### Backend
- **Framework:** Python 3.10+ / 3.11 with FastAPI & Uvicorn
- **Speech Engine:** Gnani AI Python SDK (`gnani-vachana` 0.9.0) — Model: `prisma-v3.0`
- **Database:** SQLite with SQLAlchemy ORM
- **Exporting:** ReportLab 5.1
- **Validation:** Pydantic v2
- **Audio Processing:** Python `wave` module & `aiofiles`
- **Testing:** Pytest & Starlette TestClient

---

## 📁 Folder Structure

```
VoxNote-AI/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── AudioVisualizer.jsx
│   │   │   ├── LanguageSelector.jsx
│   │   │   ├── AudioPlayer.jsx
│   │   │   ├── SmartNotesView.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── AudioTranscriptionPage.jsx
│   │   │   ├── LiveTranscriptionPage.jsx
│   │   │   ├── SmartNotesPage.jsx
│   │   │   ├── TranscriptHistoryPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   ├── layouts/
│   │   │   └── AppLayout.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── hooks/
│   │   │   └── useLiveRecorder.js
│   │   ├── context/
│   │   │   └── AppContext.jsx
│   │   ├── utils/
│   │   │   └── formatters.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── .env
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── endpoints.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── transcript.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── transcript.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── gnani_service.py
│   │   │   ├── audio_service.py
│   │   │   ├── transcript_service.py
│   │   │   ├── summary_service.py
│   │   │   └── pdf_service.py
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   └── session.py
│   │   ├── __init__.py
│   │   └── main.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── .env
│   └── tests/
│       ├── __init__.py
│       ├── test_health.py
│       ├── test_gnani_service.py
│       └── test_transcripts.py
│
├── .gitignore
├── README.md
└── start_project.bat
```

---

## ⚙️ Installation & Setup

### Prerequisites
- **Python 3.10+** (Tested on Python 3.11.9)
- **Node.js 18+** & npm (Tested on Node v24.21.0, npm 11.19.0)
- Windows, macOS, or Linux

---

### 1. Backend Setup

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and insert your Gnani AI API key:
   ```env
   GNANI_API_KEY=your_actual_gnani_api_key_here
   SUMMARY_PROVIDER=built-in
   DATABASE_URL=sqlite:///./voxnote.db
   ```

4. Run backend tests to verify configuration:
   ```bash
   python -m pytest tests/
   ```

5. Start the FastAPI backend server:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   The backend API will be available at `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.

---

### 2. Frontend Setup

1. Open a separate terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install npm packages:
   ```bash
   npm install
   ```

3. Configure environment:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

4. Start Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

### 3. One-Click Launcher (Windows)

Double click `start_project.bat` from the root directory or run:
```cmd
.\start_project.bat
```
This launches both the FastAPI backend and Vite frontend automatically in separate command windows.

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend, Gnani STT, and database connection status |
| `GET` | `/api/languages` | List all 10 supported Indian languages and Prisma v3.0 output modes |
| `GET` | `/api/dashboard/stats` | Aggregate metrics (recordings, total minutes, language breakdown) |
| `POST` | `/api/transcribe` | Upload audio file and transcribe using Gnani Prisma v3.0 |
| `POST` | `/api/transcribe/batch` | Submit long recordings for asynchronous batch transcription |
| `GET` | `/api/transcribe/batch/{id}`| Poll status of an async batch job |
| `POST` | `/api/transcribe/live` | Info endpoint for live WebSocket streaming protocol |
| `WS` | `/api/transcribe/live/ws` | WebSocket endpoint streaming live 16kHz PCM to Gnani STT |
| `GET` | `/api/transcripts` | Paginated transcript history with search and language filters |
| `GET` | `/api/transcripts/{id}` | Retrieve single transcript and associated smart notes |
| `DELETE`| `/api/transcripts/{id}` | Delete transcript and associated notes |
| `POST` | `/api/summarize` | Generate 8 smart note sections from transcript text |
| `GET` | `/api/download/{id}/pdf`| Generate and download ReportLab PDF transcript |
| `GET` | `/api/download/{id}/txt`| Download plain text transcript and smart notes |

---

## 🧪 Testing

Run backend tests:
```bash
cd backend
python -m pytest tests/ -v
```

Test coverage includes:
- Health and status endpoints
- Language codes and native metadata
- Prisma v3.0 constants and format options
- SQLite database creation, querying, and deletion
- ReportLab PDF generation binary validity
- Smart notes synthesis fallback logic

---

## 💡 Troubleshooting & Common Issues

### 1. `GNANI_API_KEY is not configured` (HTTP 503)
- **Cause:** No API key is specified in `backend/.env`.
- **Solution:** Add `GNANI_API_KEY=your_key` to `backend/.env` and restart the backend. The UI Settings page will reflect the configured status.

### 2. Audio File Exceeds 30 Seconds
- **Behavior:** VoxNote AI includes an automatic WAV chunking pipeline in `app/services/audio_service.py` and `gnani_service.py`. It slices the file into <=25s segments, transcribes each with Gnani Prisma v3.0, preserves `previous_text` context chaining, and merges the text seamlessly.
- **Alternative:** For very long recordings (hours), submit to `POST /api/transcribe/batch`.

### 3. Microphone Access Denied in Live Stream
- **Cause:** Browser permissions blocked microphone access.
- **Solution:** Allow microphone access in your browser settings (look for the camera/microphone icon in the address bar).

### 4. Indian Script Unicode Display
- VoxNote AI includes the `Nirmala UI` and `Inter` font stacks in CSS and registers Windows system fonts (`Arial` / `Nirmala`) in ReportLab to ensure Devanagari, Tamil, Telugu, Kannada, Bengali, and other Indian scripts render clearly in both the web UI and downloaded PDFs.

---

## 📄 License
MIT License. Built with ❤️ for Indian Multilingual Speech AI with Gnani.ai.
