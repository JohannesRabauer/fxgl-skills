---
name: fxgl-rhythm
description: >
  Build a rhythm game in FXGL — parse a beatmap, spawn notes early enough to scroll into a hit
  zone on time, score inputs by timing window, handle combo and grades, support hold notes, and
  keep chart timing aligned with audio as closely as FXGL's current audio API allows.
triggers:
  - rhythm game
  - beatmap
  - note highway
  - timing window
  - perfect good miss
  - combo multiplier
  - hold note
  - osu
  - guitar hero
compatibility: >
  Java 17+, FXGL 21.x. Audio playback is available, but FXGL's public AudioPlayer API does not
  expose authoritative music position, so chart timing must be driven by engine time or a custom
  integration layer.
category: fxgl/game-types
tags:
  - fxgl
  - java
  - javafx
  - game-types
  - rhythm
  - audio
metadata:
  author: "fxgl-skills"
  version: "1.0"
  fxgl-version: "21.1"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---
# FXGL Rhythm Game

## Important Timing Constraint

FXGL's public `AudioPlayer` API does **not** expose a music-position query. That means the safest
default approach is:

1. start music
2. start a `songTime` accumulator in `onUpdate(double tpf)`
3. align notes to that accumulator

This is good enough for prototypes, but it is **not sample-accurate**.

## Beatmap Model

```java
public enum NoteType { TAP, HOLD }

public record Note(double time, int lane, NoteType type, double holdDuration) {}

public record Beatmap(double leadInSeconds, List<Note> notes) {}
```

## Starting Playback

```java
private Music song;
private Beatmap beatmap;
private boolean chartRunning = false;
private double songTime = 0.0;
private static final double SCROLL_DURATION = 1.6;

private void startSong() {
    song = getAssetLoader().loadMusic("track.mp3");
    getAudioPlayer().playMusic(song);

    songTime = -beatmap.leadInSeconds();
    chartRunning = true;
}

@Override
protected void onUpdate(double tpf) {
    if (!chartRunning)
        return;

    songTime += tpf;
    spawnUpcomingNotes();
    detectMisses();
}
```

## Note Spawning

```java
private final Set<Note> spawned = new HashSet<>();

private void spawnUpcomingNotes() {
    for (Note note : beatmap.notes()) {
        if (spawned.contains(note))
            continue;

        if (songTime >= note.time() - SCROLL_DURATION) {
            spawn("note", new SpawnData(laneX(note.lane()), NOTE_START_Y)
                    .put("note", note));
            spawned.add(note);
        }
    }
}
```

## Timing Windows

```java
private Rating rate(double deltaSeconds) {
    double ms = Math.abs(deltaSeconds * 1000.0);

    if (ms < 50)  return Rating.PERFECT;
    if (ms < 150) return Rating.GOOD;
    if (ms < 300) return Rating.OK;
    return Rating.MISS;
}
```

## Lane Input

```java
private void onLanePressed(int lane) {
    Note note = findNearestPendingNote(lane);
    if (note == null)
        return;

    Rating rating = rate(songTime - note.time());

    switch (rating) {
        case PERFECT -> award(100);
        case GOOD    -> award(50);
        case OK      -> award(20);
        case MISS    -> breakCombo();
    }

    resolveHit(note, rating);
}
```

## Combo and Grade

```java
private int combo = 0;
private int score = 0;
private int perfectHits = 0;

private void award(int basePoints) {
    combo++;
    int multiplier = Math.min(8, 1 + combo / 10);
    score += basePoints * multiplier;
}

private void breakCombo() {
    combo = 0;
}
```

At the end of the song, compute grade by accuracy percentage.

## Hold Notes

Treat hold notes as two checks:

1. initial press inside the timing window
2. sustain long enough to reach `note.time + holdDuration`

Use a small active state object per lane to track held notes.

## Visual Structure

- fixed lanes
- a hit zone at the bottom or center
- note entities that tween or move linearly into that zone
- floating rating text and combo feedback in the HUD

## Recommended Architecture

- **fxgl-audio** for music playback and volume control
- **fxgl-ui-scenes** for lane HUD, score, grade, and result screen
- a beatmap parser that converts JSON / text into `List<Note>`

## Gotchas

- **No public music-position API** — do not write code that calls `getAudioPlayer().getMusicPosition()`;
  it does not exist in FXGL's public API.
- **Engine-time sync can drift** — if frame timing stutters, `songTime += tpf` may drift slightly
  from the actual audio playback.
- **Lead-in matters** — give notes time to enter the lane before the first hit.
- **Hold notes need explicit state** — they are not just long tap notes; track press, sustain,
  and release failure separately.
