# FocusGuard AI 🚀
### Your AI-Powered Study Companion

FocusGuard AI is an intelligent, privacy-first study monitoring application designed to help students build better focus habits, minimize distractions, and improve their productivity.

Powered by **Computer Vision and AI**, FocusGuard AI uses real-time webcam analysis to monitor attention, estimate head movements, and identify signs of fatigue such as prolonged eye closure and yawning. It provides instant feedback and alerts when you lose focus, helping you stay engaged with your study sessions.

---

### ✨ Key Features

- **AI-Powered Attention Detection:** Uses OpenCV and MediaPipe to estimate whether you're looking toward your screen.
- **Real-Time Focus Monitoring:** Tracks head orientation, attention states, and visual indicators.
- **Fatigue Detection:** Identifies potential signs of tiredness, including eye closure and yawning.
- **Smart Alerts:** Notifies you when you remain distracted beyond your configured threshold.
- **Pomodoro Study Sessions:** Organize your study time with customizable focus and break intervals.
- **Productivity Analytics:** Visualize focus time, attention trends, and study-session history.
- **Study Modes:** Organize sessions around activities such as coding, reading, revision, and lectures.
- **Privacy-First Architecture:** Processes webcam data locally instead of uploading camera footage to external servers.

---

### 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Python 3.12, FastAPI, Uvicorn, WebSockets
- **Computer Vision:** OpenCV, MediaPipe (FaceLandmarker 478-pts + 52 Blendshapes), NumPy, solvePnP
- **Database:** SQLite, aiosqlite (Local-first storage)
- **Desktop Application:** Tauri v2, Rust

---

### 🎯 Vision

The goal of FocusGuard AI is to make studying more intentional by combining computer vision, productivity tools, and actionable insights into one seamless experience.

**Stay focused. Build consistency. Make every study session count.**

---

## 🔒 Privacy & Security Guarantee

FocusGuard AI is built from the ground up with defensive, privacy-first principles:

1. **100% On-Device Inference:** All neural landmark tracking and head pose calculations run locally on your CPU/GPU.
2. **Ephemeral Memory Frames:** Raw camera frames exist only momentarily in RAM during landmark extraction and are discarded immediately.
3. **Zero Cloud Uploads:** No video, audio, or biometric telemetry is ever transmitted to external servers or cloud services.
4. **Protected Local Storage:** Session data and calibration baselines are saved in a local SQLite database (`backend/data/focusguard.db`) protected with strict POSIX file permissions (`0o600` file, `0o700` directory).
5. **Strict Origin & Host Validation:** Prevents Cross-Site WebSocket Hijacking (CSWSH) and DNS rebinding attacks by enforcing strict local origin and host header whitelisting.
6. **Instant Data Wipe:** A 1-click option in settings allows users to permanently delete all history and calibration records at any time.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.12+**
- **Node.js 18+** & **npm**
- **Webcam hardware** (e.g. `/dev/video0` on Linux, integrated camera on macOS/Windows)
- *(Optional for Desktop build)* **Rust** and **Cargo**

---

### 1. Installation

#### Clone the Repository
```bash
git clone https://github.com/<your-username>/focusguard-ai.git
cd focusguard-ai
```

#### Set Up Backend Virtual Environment
```bash
python -m venv .venv
source .venv/bin/activate       # On Linux/macOS
# or: .venv\Scripts\activate   # On Windows
# or: source .venv/bin/activate.fish  # On Fish shell

pip install -r backend/requirements.txt
```
*(If installing manually: `pip install fastapi uvicorn websockets opencv-python mediapipe numpy aiosqlite pydantic pytest pytest-asyncio httpx`)*

#### Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

### 2. Running the Application

#### Option A: One-Click Launchers

- **Fish Shell (Linux/Arch):**
  ```fish
  ./run_all.fish
  ```
- **Bash / macOS / Linux:**
  ```bash
  ./run_all.sh
  ```

This starts:
- 🖥️ **Frontend Interface:** [http://127.0.0.1:5173](http://127.0.0.1:5173)
- ⚙️ **FastAPI Telemetry & Docs:** [http://127.0.0.1:8765/docs](http://127.0.0.1:8765/docs)
- 📡 **Real-time WebSocket Feed:** `ws://127.0.0.1:8765/ws`

---

#### Option B: Running Services Individually

**Terminal 1 — Backend:**
```bash
source .venv/bin/activate
export PYTHONPATH=.
python -m backend.main
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

---

#### Option C: Native Desktop App (Tauri)
To launch as a native desktop application with system tray and background monitoring:

- **Fish Shell:**
  ```fish
  ./run_desktop.fish
  ```
- **Bash:**
  ```bash
  ./run_desktop.sh
  ```

---

## 🧠 How the AI Vision Pipeline Works

```
 Webcam Capture (/dev/video0)
              │
              ▼
 MediaPipe FaceLandmarker (478 3D Landmarks + 52 Blendshapes)
              │
      ┌───────┴────────────────────────┬────────────────────────┐
      ▼                                ▼                        ▼
Head Pose Estimation            Eye Closure & Blinks       Yawn & Fatigue
OpenCV solvePnP (Yaw/Pitch/Roll)  EAR + eyeBlink shapes    MAR + jawOpen
      │                                │                        │
      └───────────────────────┬────────┴────────────────────────┘
                              ▼
               Attention State Machine & Away Timer
        (Monotonic tracking, mode thresholds, audio chimes)
                              │
                              ▼
            Local WebSocket & SQLite Persistence
```

1. **Head Pose Estimation (`head_pose.py`):** Uses 6 key 3D facial landmarks (nose tip, chin, eye corners, mouth corners) with standard anthropometric coordinates and `cv2.solvePnP` to compute exact Yaw, Pitch, and Roll angles.
2. **Eye Closure & Blink Detection (`eye_mouth.py`):** Blends 3D Eye Aspect Ratio (EAR) with neural blendshapes (`eyeBlinkLeft`, `eyeBlinkRight`) to track blink rates and catch micro-sleeps or prolonged eye closure (>2.0s).
3. **Yawn & Fatigue Tracking (`eye_mouth.py`):** Combines Mouth Aspect Ratio (MAR) with `jawOpen` blendshapes with state debouncing to count yawns without false triggers from talking.
4. **Neutral Calibration (`pipeline.py`):** A 30-frame baseline calibration calculates your natural desk posture and camera angle offsets.

---

## 🎯 Configured Study Modes

| Mode | Focus Profile | Yaw Threshold | Pitch Threshold | Recommended For |
| :--- | :--- | :--- | :--- | :--- |
| **Coding** | Keyboard-tolerant | ±32° | -30° down / +22° up | Programming, dual monitors, desk notes |
| **Reading** | Wide horizontal scan | ±28° | -24° down / +20° up | Long articles, documentation, PDF textbooks |
| **Lecture** | High attention discipline | ±18° | -16° down / +16° up | Video tutorials, online courses, webinars |
| **Revision** | Pomodoro cycles | ±25° | -22° down / +20° up | Active recall, flashcards, problem solving |
| **Custom** | User-defined | Configurable | Configurable | Any tailored study workflow |

---

## 🧪 Testing & Verification

Run the full automated test suite covering database operations, attention timers, head pose calculations, and API security:

```bash
PYTHONPATH=. .venv/bin/pytest backend/tests/ -v
```

Frontend production build check:
```bash
npm --prefix frontend run build
```

Desktop Tauri crate check:
```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

---

## 📁 Project Structure

```
focusguard-ai/
├── backend/                    # Python Computer Vision Engine & API
│   ├── data/                   # Protected local SQLite directory (.gitkeep)
│   ├── vision/                 # CV Pipeline & Analysis
│   │   ├── camera.py           # Thread-safe OpenCV capture & recovery
│   │   ├── head_pose.py        # solvePnP Yaw, Pitch, Roll calculation
│   │   ├── eye_mouth.py        # EAR, MAR, Blinks, Prolonged Closures, Yawns
│   │   ├── attention.py        # Attention state machine, timer & study modes
│   │   └── pipeline.py         # Main CV orchestrator & frame annotator
│   ├── tests/                  # Pytest automated test suites
│   ├── database.py             # SQLite persistence & analytics queries
│   ├── models.py               # Pydantic schemas & input bounds
│   ├── api.py                  # FastAPI REST endpoints & WebSocket server
│   └── main.py                 # Backend entrypoint (port 8765)
├── frontend/                   # React + TypeScript + Tailwind CSS UI
│   ├── src/
│   │   ├── components/         # Dashboard, Live Monitor, Session, Analytics, etc.
│   │   ├── services/           # Offline Web Audio Synthesizer & WebSocket Client
│   │   ├── types/              # TypeScript interfaces
│   │   ├── App.tsx             # Main application router & state manager
│   │   └── main.tsx            # DOM root
│   ├── package.json
│   └── vite.config.ts
├── src-tauri/                  # Tauri v2 Desktop Shell & System Tray
│   ├── src/
│   │   ├── lib.rs              # System tray menu & window lifecycle
│   │   └── main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json         # Tauri security & CSP configuration
├── models/
│   └── face_landmarker.task    # MediaPipe FaceLandmarker model file
├── integrations/
│   └── vscode-extension/       # FocusGuard AI VS Code extension
├── run_all.fish                # Fish shell launcher (Backend + Web)
├── run_all.sh                  # Bash launcher (Backend + Web)
├── run_desktop.fish            # Fish shell desktop launcher (Backend + Tauri)
├── run_desktop.sh              # Bash desktop launcher (Backend + Tauri)
├── .gitignore                  # Security-hardened git ignore
└── README.md                   # Project documentation
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 💡 Troubleshooting

- **Linux Webcam Permissions:** If you get a camera permission error opening `/dev/video0`:
  ```bash
  sudo usermod -a -G video $USER
  ```
  Then log out and log back in.
- **Port Conflicts:** Ensure ports `8765` (backend) and `5173` (frontend) are not occupied by other services.
