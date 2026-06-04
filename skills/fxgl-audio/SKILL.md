---
name: fxgl-audio
description: >
  Play and manage audio in FXGL — trigger one-shot sound effects, loop background music,
  control master and per-type volume, load sound and music assets, use the AudioPlayer service
  directly, and speak text via platform TTS. Use this skill when adding sound effects to
  game events, playing background music, implementing volume sliders, or integrating
  text-to-speech dialogue in a game.
  Triggers on: "sound effect", "background music", "AudioPlayer", "play sound", "loopBGM",
  "music volume", "SFX", "wav", "mp3", "text to speech", "TTS", "audio".
compatibility: Java 17+, FXGL 21.x. TTS requires fxgl-intelligence module and platform TTS engine.
metadata:
  author: fxgl-skills
  version: "1.0"
  fxgl-version: "21.1"
  category: fxgl/audio
allowed-tools: Read Write Edit Bash
---

# FXGL Audio System

## Asset Placement

Audio files go in `src/main/resources/assets/`:
- **Sounds** → `assets/sounds/` — short clips (WAV recommended for low latency)
- **Music**  → `assets/music/`  — long tracks (MP3 or OGG for size efficiency)

## Quickstart — DSL Shortcuts

```java
// Play a sound effect (one-shot, auto-managed)
FXGL.play("sounds/shoot.wav");

// Loop background music
FXGL.loopBGM("music/theme.mp3");

// Stop / pause / resume background music
FXGL.stopBGM();
FXGL.pauseBGM();
FXGL.resumeBGM();
```

## Loading and Playing Manually

```java
// Load once (cached), play many times
Sound jumpSound  = getAssetLoader().loadSound("sounds/jump.wav");
Music themeMusic = getAssetLoader().loadMusic("music/theme.mp3");

// Play
getAudioPlayer().playSound(jumpSound);
getAudioPlayer().playMusic(themeMusic);

// Loop a specific music object
getAudioPlayer().loopMusic(themeMusic);

// Stop / pause / resume specific music
getAudioPlayer().stopMusic(themeMusic);
getAudioPlayer().pauseMusic(themeMusic);
getAudioPlayer().resumeMusic(themeMusic);
```

## Volume Control

```java
// Global volumes (0.0 = mute, 1.0 = full)
getSettings().setGlobalSoundVolume(0.8);
getSettings().setGlobalMusicVolume(0.5);

// At runtime via AudioPlayer
getAudioPlayer().setGlobalSoundVolume(0.7);
getAudioPlayer().setGlobalMusicVolume(0.4);

// Individual sound volume (set before playing)
Sound s = getAssetLoader().loadSound("sounds/explosion.wav");
s.setVolume(0.5);   // half volume for this instance
getAudioPlayer().playSound(s);

// Individual music volume
Music bgm = getAssetLoader().loadMusic("music/boss.mp3");
bgm.setVolume(0.6);
getAudioPlayer().loopMusic(bgm);
```

## Volume Slider UI Pattern

```java
@Override
protected void initUI() {
    Slider sfxSlider = new Slider(0, 1, getSettings().getGlobalSoundVolume());
    sfxSlider.valueProperty().addListener((obs, oldVal, newVal) ->
            getAudioPlayer().setGlobalSoundVolume(newVal.doubleValue()));

    Slider musicSlider = new Slider(0, 1, getSettings().getGlobalMusicVolume());
    musicSlider.valueProperty().addListener((obs, oldVal, newVal) ->
            getAudioPlayer().setGlobalMusicVolume(newVal.doubleValue()));

    addUINode(sfxSlider, 100, 400);
    addUINode(musicSlider, 100, 440);
}
```

## Music Crossfade Pattern

```java
private Music currentMusic;

public void crossfadeTo(String musicFile) {
    Music nextMusic = getAssetLoader().loadMusic("music/" + musicFile);

    if (currentMusic != null) {
        // Fade out current
        animationBuilder()
                .duration(Duration.seconds(1))
                .animate(new AnimatedValue<>(currentMusic.getVolume(), 0.0))
                .onProgress(v -> currentMusic.setVolume(v))
                .build()
                .setOnFinished(() -> {
                    getAudioPlayer().stopMusic(currentMusic);
                    nextMusic.setVolume(0);
                    getAudioPlayer().loopMusic(nextMusic);
                    // Fade in next
                    animationBuilder()
                            .duration(Duration.seconds(1))
                            .animate(new AnimatedValue<>(0.0, 1.0))
                            .onProgress(v -> nextMusic.setVolume(v))
                            .buildAndPlay();
                })
                .start();
    } else {
        getAudioPlayer().loopMusic(nextMusic);
    }
    currentMusic = nextMusic;
}
```

## Event-Driven Sound Effects

```java
// In initPhysics() collision handlers — most common pattern
onCollisionBegin(EntityType.PLAYER, EntityType.COIN, (player, coin) -> {
    play("sounds/coin.wav");
    coin.removeFromWorld();
});

// In component onUpdate for continuous sounds
// (guard with a flag to avoid playing every frame)
public class EngineComponent extends Component {
    private boolean enginePlaying = false;

    @Override
    public void onUpdate(double tpf) {
        double speed = entity.getComponent(PhysicsComponent.class).getSpeed();
        if (speed > 10 && !enginePlaying) {
            engineSound = getAssetLoader().loadSound("sounds/engine_loop.wav");
            getAudioPlayer().playSound(engineSound);
            enginePlaying = true;
        } else if (speed <= 10 && enginePlaying) {
            getAudioPlayer().stopSound(engineSound);
            enginePlaying = false;
        }
    }
}
```

## Text-to-Speech (fxgl-intelligence module)

```java
// Add to pom.xml: com.github.almasb:fxgl-intelligence:VERSION
// Register service
settings.addEngineService(TextToSpeechService.class);

// Use (in any init* hook or at runtime)
TextToSpeechService tts = getService(TextToSpeechService.class);
tts.speak("Welcome to the dungeon, adventurer!");

// Configure voice
tts.setRate(1.0);    // 0.1 (slow) to 10.0 (fast)
tts.setPitch(1.0);   // 0.0 (deep) to 2.0 (high)
tts.setVolume(1.0);

// Wait for speech to finish before proceeding
tts.speakAndWait("Choose your path wisely.");
```

## Stopping All Audio (e.g., on game over)

```java
// Stop BGM
stopBGM();

// Stop all playing sounds (FXGL 21+)
getAudioPlayer().stopAllSounds();
getAudioPlayer().stopAllMusic();
```

## Gotchas

- **File extensions matter** — `play("shoot.wav")` works, but `play("sounds/shoot.wav")` only
  works if the file is actually at `assets/sounds/shoot.wav`. Omit the `sounds/` prefix when
  using the `FXGL.play()` shortcut — it automatically resolves to `assets/sounds/` for WAV
  and `assets/music/` for MP3/OGG.
- **WAV for short SFX, MP3/OGG for music** — JavaFX's MediaPlayer (used for music) has
  higher latency than AudioClip (used for sounds). Explosions and footsteps should always
  be WAV to avoid noticeable delay.
- **`loopBGM()` replaces the current BGM** — only one `loopBGM` track plays at a time.
  Use `getAudioPlayer().loopMusic()` directly if you need multiple simultaneous music tracks.
- **Volume is not persisted automatically** — save volume settings to `DataFile` in
  `writeSaveState()` or use `getSystemBundle()` for per-session persistence.
- **TTS blocks the calling thread with `speakAndWait()`** — call it on a background thread
  or use `speak()` (non-blocking) inside dialogue callbacks.
- **FXGL on headless environments** (CI, testing) — `AudioPlayer` is replaced with a no-op
  stub when no audio hardware is detected. Audio calls are silently ignored.
