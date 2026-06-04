# ML Backend Setup for fxgl-intelligence

Load this file when setting up the Python ML service required by the intelligence features.

## Architecture

```
FXGL Game (Java)
    ↕ WebSocket (localhost)
Python ML Service
    ↕ OpenCV / MediaPipe / Whisper
Webcam / Microphone
```

## Requirements

- Python 3.9+
- pip or conda

## Installation

```bash
# Clone the fxgl-intelligence Python backend
git clone https://github.com/AlmasB/FXGL-intelligence-backend
cd FXGL-intelligence-backend

# Install dependencies
pip install -r requirements.txt
# Installs: opencv-python, mediapipe, openai-whisper, websockets, numpy

# Run the backend (starts all services)
python main.py
# Or start individual services:
python face_detect_server.py     # port 55000
python gesture_server.py         # port 55001
python hand_tracking_server.py   # port 55002
python speech_server.py          # port 55003
```

## Default Port Assignments

| Service | Default Port | Config Key |
|---------|-------------|------------|
| FaceDetect | 55000 | `FaceDetectService.PORT` |
| GestureRecognition | 55001 | `GestureRecognitionService.PORT` |
| HandTracking | 55002 | `HandTrackingService.PORT` |
| SpeechRecognition | 55003 | `SpeechRecognitionService.PORT` |

## Custom Port Configuration

```java
// Override default port if backend uses a different port
settings.addEngineService(FaceDetectService.class);
// After registration, before game starts:
getService(FaceDetectService.class).setPort(55100);
```

## Confirming the Backend is Running

```bash
# Test WebSocket connection
curl -v --include \
     --no-buffer \
     --header "Connection: Upgrade" \
     --header "Upgrade: websocket" \
     --header "Host: localhost:55000" \
     http://localhost:55000/
# Should return 101 Switching Protocols
```

## Packaging for Distribution

If you distribute your game to end users:
1. Bundle the Python backend as an executable using PyInstaller:
   ```bash
   pyinstaller --onefile main.py
   ```
2. Add a launcher script that starts the Python backend before the Java game.
3. Or use the bundled C++ native implementation (available for Windows x64).
