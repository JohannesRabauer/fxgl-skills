# Game Type — Rhythm Game

Covers music-based games (Guitar Hero, osu!, DDR style). Notes fall or appear in sync with audio, player times inputs, scoring by accuracy window.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-RHYTHM-1\nNote chart (beatmap) file defines notes by time"]
    Dev --> UC2["UC-RHYTHM-2\nNotes scroll toward hit zone in sync with audio"]
    Dev --> UC3["UC-RHYTHM-3\nTiming windows: PERFECT / GOOD / MISS"]
    Dev --> UC4["UC-RHYTHM-4\nAudio starts and chart playback aligned"]
    Dev --> UC5["UC-RHYTHM-5\nScore + combo multiplier"]
    Dev --> UC6["UC-RHYTHM-6\nMiss breaks combo, note explodes"]
    Dev --> UC7["UC-RHYTHM-7\nHold notes (press and sustain)"]
    Dev --> UC8["UC-RHYTHM-8\nBPM changes mid-song"]
    Dev --> UC9["UC-RHYTHM-9\nGrade at end (S/A/B/C/F)"]
    Dev --> UC10["UC-RHYTHM-10\nReplay / ghost of best run"]
```

## Note Chart Format

```mermaid
flowchart TD
    BeatmapFile["beatmap.json or .txt file:\n  BPM: 140\n  offset: 800ms (audio lead-in)\n  notes:\n    [{time: 0.571s, lane: 0, type: TAP},\n     {time: 1.143s, lane: 2, type: HOLD, duration: 0.5s},\n     ...]"] --> ParseChart["parse into List<Note>\nconvert beat→seconds: t = beat × (60/BPM)"]
```

## Playback Synchronization

```mermaid
flowchart TD
    StartSong["play audio with getAudioPlayer().playMusic('song.mp3')"] --> TrackTime["songTime = getAudioPlayer().getMusicPosition()\n(authoritative time source)"]
    TrackTime --> SpawnNotes["for each note in chart:\n  if songTime >= note.time - scrollDuration\n    and not yet spawned:\n    spawnNote(note)"]
    SpawnNotes --> NoteScroll["note entity moves toward hit zone\nat fixed speed\narrives at hit zone exactly at note.time"]
```

## Timing Windows

```mermaid
flowchart LR
    KeyPress["player presses lane key"] --> NearestNote["find note in that lane\nwith smallest |songTime - note.time|"]
    NearestNote --> TimingDelta["delta = |songTime - note.time|"]
    TimingDelta --> |delta < 50ms| Perfect["PERFECT: 100 pts × combo"]
    TimingDelta --> |50-150ms| Good["GOOD: 50 pts × combo"]
    TimingDelta --> |150-300ms| Ok["OK: 20 pts, no combo bonus"]
    TimingDelta --> |> 300ms| Miss["MISS: 0 pts, reset combo"]
```

## Combo and Score

```mermaid
flowchart TD
    HitNote["note hit (any rank except MISS)"] --> IncrementCombo["combo++"]
    IncrementCombo --> ComboMultiplier["multiplier = min(8, 1 + floor(combo/10))"]
    ComboMultiplier --> AddScore["score += basePoints × multiplier"]
    MissNote["note missed"] --> ResetCombo2["combo = 0\nmultiplier = 1"]
```

## Hold Note

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> HoldActive : player presses key at note.time (±150ms)
    HoldActive --> Scoring : player holds key
    Scoring --> HoldComplete : key held until note.time + duration
    Scoring --> Broken : key released early → partial score
    HoldComplete --> [*]
    Broken --> [*]

    Scoring : score ticks every 100ms while held
```

## End-of-Song Grade

```mermaid
flowchart LR
    SongEnd["song finishes"] --> CalcAccuracy["accuracy = perfectHits/totalNotes × 100"]
    CalcAccuracy --> |accuracy >= 95%| S_Grade["S Rank 🌟"]
    CalcAccuracy --> |90-94%| A_Grade["A Rank"]
    CalcAccuracy --> |80-89%| B_Grade["B Rank"]
    CalcAccuracy --> |70-79%| C_Grade["C Rank"]
    CalcAccuracy --> |< 70%| F_Grade["F Rank"]
    S_Grade --> ShowResults["show results screen:\n  score, accuracy, combo, grade\n  save if personal best"]
```
