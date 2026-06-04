# Use Cases — Audio

Covers sound effects, background music, audio configuration, and text-to-speech.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-AUD-1\nPlay one-shot sound effect"]
    Dev --> UC2["UC-AUD-2\nPlay looping background music"]
    Dev --> UC3["UC-AUD-3\nStop / pause / resume music"]
    Dev --> UC4["UC-AUD-4\nControl volume (master / SFX / music)"]
    Dev --> UC5["UC-AUD-5\nPlay sound at world position (spatial)"]
    Dev --> UC6["UC-AUD-6\nLoad audio asset"]
    Dev --> UC7["UC-AUD-7\nSpeak text via TTS"]
    Dev --> UC8["UC-AUD-8\nGet AudioPlayer service directly"]
```

## Sound Effect Playback

```mermaid
flowchart LR
    A["FXGL.play('shoot.wav')"] --> B["AudioPlayer loads & plays once"]
    C["FXGL.getAudioPlayer().playSound(sound)"] --> B
    D["FXGL.getAssetLoader().loadSound('boom.wav')"] --> E["Sound object"]
    E --> C
```

## Music (Background) Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Stopped
    Stopped --> Playing : playMusic(music) / loopBGM('theme.mp3')
    Playing --> Paused : pauseBGM() / pauseMusic(music)
    Paused --> Playing : resumeBGM() / resumeMusic(music)
    Playing --> Stopped : stopBGM() / stopMusic(music)
    Stopped --> [*]
```

## Audio Asset Loading

```mermaid
flowchart TD
    Loader["FXGLAssetLoaderService"] --> Sound["loadSound('sfx/jump.wav')\n→ Sound"]
    Loader --> Music["loadMusic('music/theme.mp3')\n→ Music"]
    Sound -->|stored in| Cache["Internal asset cache\n(auto-managed)"]
    Music --> Cache
    Cache --> Play["AudioPlayer.playSound/playMusic"]
```

## Volume Control Use Case

```mermaid
graph TD
    Settings["GameSettings"] --> GlobalVol["setGlobalSoundVolume(0.0–1.0)"]
    Settings --> GlobalMusic["setGlobalMusicVolume(0.0–1.0)"]
    Runtime["AudioPlayer at runtime"] --> SoundVol["setSoundVolume(0.0–1.0)"]
    Runtime --> MusicVol["setMusicVolume(0.0–1.0)"]
```

## Text-to-Speech Use Case (fxgl-intelligence module)

```mermaid
flowchart LR
    Dev([Developer]) --> TTS["TextToSpeechService"]
    TTS --> Speak["speak('Hello player!')"]
    TTS --> Lang["setLanguage / setRate / setPitch"]
    Speak --> OS["Platform native TTS engine"]
    OS --> Speaker["Audio output"]
```

## Convenience DSL Methods

```mermaid
graph TD
    DSL["FXGL DSL shortcuts"] --> Play["play(String assetName)\nautomatically determines Sound or Music"]
    DSL --> Loop["loopBGM(String musicFile)"]
    DSL --> Stop2["stopBGM()"]
    DSL --> Pause2["pauseBGM()"]
    DSL --> Resume2["resumeBGM()"]
```
