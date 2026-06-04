# Use Cases — Intelligence (ML-powered Features)

Covers the `fxgl-intelligence` module: face detection, gesture recognition, hand tracking,
speech recognition, and text-to-speech. These are powered by external ML models via WebSocket.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])
    Player([Player])

    Dev --> UC1["UC-INT-1\nDetect player face via webcam"]
    Dev --> UC2["UC-INT-2\nRecognise hand gestures"]
    Dev --> UC3["UC-INT-3\nTrack hand/finger positions"]
    Dev --> UC4["UC-INT-4\nRecognise spoken words as game commands"]
    Dev --> UC5["UC-INT-5\nSpeak game dialogue via TTS"]
    Dev --> UC6["UC-INT-6\nHandle no-face / face-lost events"]
    Dev --> UC7["UC-INT-7\nMap gesture to input action"]
    Dev --> UC8["UC-INT-8\nMap speech command to game action"]

    Player --> UC1
    Player --> UC2
    Player --> UC4
```

## Intelligence Module Architecture

```mermaid
graph TD
    Module["fxgl-intelligence module"] --> WebSock["WebSocket communication\nwith local Python/ML service"]
    Module --> FD["FaceDetectService\n• start/stop detection\n• onFaceDetected callback\n• onFaceLost callback"]
    Module --> GR["GestureRecognitionService\n• onGestureRecognised callback\n• gesture: THUMBS_UP, FIST, etc."]
    Module --> HT["HandTrackingService\n• onHandLandmarks callback\n• 21 finger landmark points"]
    Module --> SR["SpeechRecognitionService\n• onSpeechRecognised callback\n• language / model config"]
    Module --> TTS2["TextToSpeechService\n• speak(text)\n• language / rate / pitch"]
```

## Face Detection Use Case

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant FaceDetect as FaceDetectService
    participant MLService as Python ML Service

    Dev->>FaceDetect: start(webcamIndex)
    FaceDetect->>MLService: WebSocket connect
    MLService-->>FaceDetect: face bounding box & landmarks (JSON)
    FaceDetect-->>Dev: onFaceDetected(FaceData)
    Note over Dev: use face position to control camera
    MLService-->>FaceDetect: no face in frame
    FaceDetect-->>Dev: onFaceLost()
```

## Gesture Recognition Use Case

```mermaid
flowchart LR
    GRS["GestureRecognitionService.start()"] --> ML["ML model analyses webcam frame"]
    ML --> Gesture["Gesture enum:\nTHUMBS_UP / THUMBS_DOWN\nFIST / OPEN_HAND\nPEACE / POINTING"]
    Gesture --> Callback["onGestureRecognised(gesture -> {\n  if(gesture == THUMBS_UP) jump();\n})"]
```

## Hand Tracking Use Case

```mermaid
flowchart TD
    HTS["HandTrackingService.start()"] --> Landmarks["21 landmarks per hand\n(WRIST, THUMB_CMC, ..., PINKY_TIP)"]
    Landmarks --> Map2["map landmark positions to\ngame coordinates / controls"]
    Map2 --> Examples["Examples:\n• pinch = zoom\n• point = aim cursor\n• wave = special move"]
```

## Speech Recognition Use Case

```mermaid
sequenceDiagram
    participant Player3 as Player
    participant Mic as Microphone
    participant SRS as SpeechRecognitionService

    Player3->>Mic: speaks "Jump!"
    Mic->>SRS: audio stream
    SRS->>SRS: ML model transcribes
    SRS-->>Dev: onSpeechRecognised("jump")
    Dev->>Dev: if text.contains("jump") → jump()
```

## Text-to-Speech Use Case

```mermaid
flowchart LR
    TTS3["TextToSpeechService"] --> Speak2["speak('You have entered the dungeon')"]
    TTS3 --> Config["setLanguage(Locale.ENGLISH)\nsetRate(1.0)  — 1.0 = normal\nsetPitch(1.0) — 1.0 = normal"]
    Speak2 --> Platform2["Platform native speech engine\n(SAPI on Windows, NSS on Mac, espeak on Linux)"]
```

## Gesture → Input Action Mapping

```mermaid
flowchart TD
    Dev([Developer]) --> GMap["GestureInputMapper"] --> G1["THUMBS_UP → simulate KeyCode.SPACE (jump)"]
    GMap --> G2["FIST → simulate MouseButton.PRIMARY (attack)"]
    GMap --> G3["POINTING → update mouse cursor position"]
    GMap --> G4["OPEN_HAND → pause game"]
    G1 --> Input4["injected into FXGL Input system"]
```

## Intelligence Service Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Stopped2 : service created
    Stopped2 --> Starting : start() called
    Starting --> Running : WebSocket connected to ML service
    Running --> Detecting : frames being processed
    Detecting --> Running : frame processed
    Running --> Stopped2 : stop() called
    Starting --> Error : ML service not available
    Error --> Stopped2 : fallback / log
```
