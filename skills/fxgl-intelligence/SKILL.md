---
name: fxgl-intelligence
description: >
  Integrate ML-powered intelligence features into an FXGL game via the fxgl-intelligence
  module — face detection from webcam, hand gesture recognition, hand landmark tracking,
  speech recognition for voice commands, and platform text-to-speech. Use this skill when
  building accessibility features, gesture-controlled games, voice-commanded gameplay,
  facial-expression-driven mechanics, or spoken NPC dialogue.
  Triggers on: "face detection", "gesture recognition", "speech recognition", "voice command",
  "hand tracking", "text to speech", "TTS", "webcam", "ML", "fxgl-intelligence",
  "facial expression", "hand gesture".
compatibility: >
  Java 17+, FXGL 21.x, fxgl-intelligence module. Requires Python ML backend running locally
  (see references/ml-backend-setup.md). TTS requires platform speech engine (SAPI/NSS/espeak).
metadata:
  author: fxgl-skills
  version: "1.0"
  fxgl-version: "21.1"
  category: fxgl/intelligence
allowed-tools: Read Write Edit Bash
---

# FXGL Intelligence Module

## Dependency Setup

Add to `pom.xml` (replace VERSION with current FXGL version):
```xml
<dependency>
    <groupId>com.github.almasb</groupId>
    <artifactId>fxgl-intelligence</artifactId>
    <version>VERSION</version>
</dependency>
```

The intelligence module communicates with a local Python ML service via WebSocket on
configurable ports. See [references/ml-backend-setup.md](references/ml-backend-setup.md)
for how to install and run the Python service.

---

## Face Detection

Detects faces via webcam and provides bounding box + landmark positions.

```java
// Register
settings.addEngineService(FaceDetectService.class);

// Use in initGame
FaceDetectService faceDetect = getService(FaceDetectService.class);

faceDetect.setOnFaceDetected(faceData -> {
    // faceData contains bounding box and 68 facial landmarks
    double faceX = faceData.getBounds().getMinX();
    double faceY = faceData.getBounds().getMinY();

    // Example: move camera to face position
    getGameScene().getViewport().setX(faceX * getAppWidth());
});

faceDetect.setOnFaceLost(() -> {
    System.out.println("No face detected — pause game?");
    getGameController().pauseEngine();
});

faceDetect.start(0);  // webcam index 0 = default camera
```

## Gesture Recognition

Recognises predefined hand gestures from webcam frames.

```java
// Register
settings.addEngineService(GestureRecognitionService.class);

GestureRecognitionService gestures = getService(GestureRecognitionService.class);

gestures.setOnGestureRecognised(gesture -> {
    switch (gesture) {
        case THUMBS_UP   -> jump();
        case FIST        -> punch();
        case OPEN_HAND   -> shield();
        case PEACE       -> specialMove();
        case POINTING    -> aimAtPoint(getInput().getMousePositionWorld());
        case THUMBS_DOWN -> decreaseVolume();
    }
});

gestures.start(0);  // webcam index
```

### Available Gestures

| Gesture | Value | Typical use |
|---------|-------|-------------|
| `THUMBS_UP` | Fist + thumb up | Confirm / jump |
| `THUMBS_DOWN` | Fist + thumb down | Reject / crouch |
| `FIST` | All fingers closed | Attack / dash |
| `OPEN_HAND` | All fingers extended | Pause / shield |
| `PEACE` | Index + middle extended | Special move |
| `POINTING` | Only index extended | Aim / select |

## Hand Tracking (Landmarks)

Provides 21 landmark positions for each detected hand (sub-pixel accuracy).

```java
// Register
settings.addEngineService(HandTrackingService.class);

HandTrackingService handTrack = getService(HandTrackingService.class);

handTrack.setOnHandLandmarks(landmarks -> {
    // landmarks: List of 21 HandLandmark (x, y, z in normalised [0,1] coords)
    HandLandmark wrist     = landmarks.get(HandLandmark.WRIST);
    HandLandmark indexTip  = landmarks.get(HandLandmark.INDEX_FINGER_TIP);
    HandLandmark thumbTip  = landmarks.get(HandLandmark.THUMB_TIP);

    // Convert to screen coordinates
    double screenX = indexTip.getX() * getAppWidth();
    double screenY = indexTip.getY() * getAppHeight();

    // Move game cursor to index finger tip position
    getInput().mockCursorPosition(screenX, screenY);

    // Detect pinch (thumb and index close together)
    double pinchDist = thumbTip.distanceTo(indexTip);
    if (pinchDist < 0.05) {
        getInput().mockButtonPress(MouseButton.PRIMARY);
    }
});

handTrack.start(0);
```

### Hand Landmark Constants

```java
// Use HandLandmark enum constants as indices
HandLandmark.WRIST              // 0
HandLandmark.THUMB_CMC          // 1
HandLandmark.THUMB_TIP          // 4
HandLandmark.INDEX_FINGER_MCP   // 5
HandLandmark.INDEX_FINGER_TIP   // 8
HandLandmark.MIDDLE_FINGER_TIP  // 12
HandLandmark.RING_FINGER_TIP    // 16
HandLandmark.PINKY_TIP          // 20
```

## Speech Recognition (Voice Commands)

Transcribes spoken audio and returns recognised text.

```java
// Register
settings.addEngineService(SpeechRecognitionService.class);

SpeechRecognitionService speech = getService(SpeechRecognitionService.class);

speech.setLanguage("en-US");   // BCP-47 language tag
speech.setModel("base");        // "tiny", "base", "small", "medium", "large"

speech.setOnSpeechRecognised(text -> {
    // text: transcribed string (lowercase, trimmed)
    String cmd = text.toLowerCase().trim();

    if (cmd.contains("jump"))         jump();
    else if (cmd.contains("attack"))  attack();
    else if (cmd.contains("pause"))   getGameController().pauseEngine();
    else if (cmd.contains("help"))    showHelpOverlay();
    else                              pushNotification("Unknown command: " + cmd);
});

speech.start();  // starts microphone capture
speech.stop();   // stops microphone capture
```

## Text-to-Speech (Platform Native)

```java
// Register
settings.addEngineService(TextToSpeechService.class);

TextToSpeechService tts = getService(TextToSpeechService.class);

// Configure voice
tts.setLanguage(Locale.ENGLISH);
tts.setRate(1.0);     // 0.1 (very slow) to 10.0 (very fast); 1.0 = normal
tts.setPitch(1.0);    // 0.0 = very deep, 2.0 = very high; 1.0 = normal
tts.setVolume(1.0);   // 0.0 = silent, 1.0 = full

// Non-blocking (fire-and-forget)
tts.speak("Welcome to the dungeon!");

// Wait for speech to complete
tts.speakAndWait("Are you sure you want to quit?");
// Code after this line runs only after speech finishes

// In dialogue callbacks
getCutsceneService().startCutscene(scene, () -> {
    tts.speak("The adventure continues...");
});
```

## Graceful Fallback When Backend Unavailable

```java
// Intelligence services fail gracefully when the Python backend is not running.
// Listen for connection errors to inform the player:
FaceDetectService fds = getService(FaceDetectService.class);

fds.setOnError(e -> {
    System.err.println("Face detection unavailable: " + e.getMessage());
    // Fall back to keyboard input
    showMessage("Camera unavailable. Using keyboard controls.");
});

// Or check availability before relying on it
if (fds.isAvailable()) {
    fds.start(0);
} else {
    // standard keyboard controls
}
```

## Gotchas

- **Python backend must be running** before the FXGL app starts the intelligence services.
  The services connect via WebSocket on startup and fail silently if the backend is offline.
  See [references/ml-backend-setup.md](references/ml-backend-setup.md).
- **`speak()` is non-blocking** — speech plays asynchronously. If you need sequential speech
  (line 1 then line 2), use `speakAndWait()` or chain via callbacks.
- **Gesture recognition requires well-lit environment** — poor lighting causes low confidence
  scores and missed gestures. Communicate lighting requirements to players.
- **`HandLandmark.get(index)`** uses integer indices 0-20; use the enum constants for
  readability — they are integer constants, not enum objects.
- **Speech recognition latency** varies with model size: "tiny" ≈ 100ms, "large" ≈ 2s on
  CPU. Use "tiny" or "base" for real-time voice commands.
- **Platform TTS quality varies**: Windows SAPI is high quality; Linux espeak is robotic.
  Test on target platform.
- **Camera access requires OS permission** — on macOS and recent Windows, a camera
  permission dialog appears on first access. Handle denial gracefully.
