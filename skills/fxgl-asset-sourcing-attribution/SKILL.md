---
name: fxgl-asset-sourcing-attribution
description: >
  Source freely available third-party assets for an FXGL game, but only when the license
  clearly allows commercial use and modification. Download approved assets, organize them into
  the correct FXGL asset folders, and generate reusable provenance and attribution records for
  release compliance and optional in-game credits. Use this skill when you need spritesheets,
  portraits, UI icons, tiles, backgrounds, sound effects, or music from online sources without
  losing track of legal obligations.
triggers:
  - free asset download
  - attribution
  - asset license
  - commercial use
  - credits file
  - third party assets
  - OpenGameArt
  - Kenney
  - Freesound
  - asset provenance
  - source game art
  - source audio
compatibility: >
  Java 17+, FXGL 21.x. Internet access required for sourcing. Defaults to licenses that clearly
  allow commercial use and modification; rejects unclear or incompatible licenses.
category: fxgl/assets
tags:
  - fxgl
  - java
  - javafx
  - assets
  - attribution
  - licensing
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
# FXGL Free Asset Sourcing & Attribution

## Scope

Use this skill to bring **third-party** assets into an FXGL project safely:

- images: spritesheets, character portraits, UI icons, tiles, backgrounds
- audio: sound effects and music
- compliance: provenance capture, attribution, and local project organization

This skill is about **asset intake**. It is not a generic FXGL asset loader tutorial, and it is
not for AI-generated images.

## Default License Policy

Accept by default only assets whose license is **explicitly shown** and **clearly allows**:

1. commercial use
2. modification / derivative works
3. redistribution inside a shipped game build

### Default allowlist

| License / policy | Use by default? | Notes |
|---|---|---|
| `CC0` / public domain | Yes | Preferred; attribution still worth recording |
| `CC BY 4.0` (or equivalent attribution-required permissive license) | Yes | Capture exact attribution text / URL |
| Source-specific commercial-use license with explicit modification rights | Yes | Keep the source URL and the license text |
| `CC BY-SA`, `CC BY-NC`, `CC BY-ND` | No | Skip by default; obligations are too risky for automated intake |
| "Free for personal use" | No | Not commercial-safe |
| Missing / unclear license | No | Reject and keep searching |

If the license is ambiguous, **do not download into the project**.

## Recommended Source Shortlist

See [references/free-asset-sources.md](references/free-asset-sources.md) for the short list.
Prefer sources whose asset pages expose license terms clearly and consistently.

## FXGL Folder Targets

Place approved files under `src/main/resources/assets/` using FXGL's actual asset-loading
conventions.

```text
src/main/resources/assets/
├── textures/
│   ├── sprites/
│   ├── portraits/
│   ├── ui/
│   ├── tiles/
│   └── backgrounds/
├── sounds/        # WAV only; short interactive SFX
├── music/         # MP3 only; long-form music / loops
└── data/
    └── attribution.csv   # optional runtime-friendly credits file
```

### Naming rules

- use lowercase kebab-case file names
- include functional names, not source site names: `forest-tileset.png`, not `kenney_pack_02.png`
- avoid spaces and parentheses
- keep placeholder assets separate from third-party shipped assets

## Intake Workflow

1. identify the exact missing asset: type, size, perspective, style, loop/non-loop, usage
2. search approved sources
3. inspect the asset page for license terms
4. reject any asset with missing or incompatible license terms
5. download the chosen asset into the correct FXGL folder
6. normalize the file name and directory
7. record attribution and provenance immediately
8. load the asset in code using FXGL's relative asset path rules

## Provenance Fields to Capture

For each imported asset, record:

- asset title
- creator / author
- source page URL
- download URL if different
- license name
- license URL or full license page
- local file path in the project
- modification note, e.g. cropped, resized, recolored, split into frames
- download date

## Default Credits Artifact

Default to a **project-root** file named `THIRD_PARTY_ASSETS.md`.

Why this default:

- it keeps release / compliance notes outside the game runtime
- it is easy to review in pull requests
- it avoids bundling legal notes into the JAR unless you explicitly want in-game credits

If the game needs a runtime credits screen, also generate:

- `src/main/resources/assets/data/attribution.csv`

## Example `THIRD_PARTY_ASSETS.md` Entry

```md
## forest-tileset.png

- Title: Forest Tileset
- Creator: Kenney
- Source: https://kenney.nl/assets/...
- License: CC0 1.0
- License URL: https://creativecommons.org/publicdomain/zero/1.0/
- Local Path: src/main/resources/assets/textures/tiles/forest-tileset.png
- Modifications: cropped into gameplay tile variants
- Downloaded: 2026-06-04
```

## Example `attribution.csv`

```csv
title,creator,source_url,license,license_url,local_path,modifications,downloaded
Forest Tileset,Kenney,https://kenney.nl/assets/...,CC0 1.0,https://creativecommons.org/publicdomain/zero/1.0/,src/main/resources/assets/textures/tiles/forest-tileset.png,cropped into gameplay tile variants,2026-06-04
```

## Directory Setup Example

```bash
mkdir -p src/main/resources/assets/textures/{sprites,portraits,ui,tiles,backgrounds}
mkdir -p src/main/resources/assets/{sounds,music,data}
```

## FXGL Loading Examples After Intake

```java
// Images from assets/textures/
var portrait = getAssetLoader().loadTexture("portraits/npc-merchant.png");
var button   = getAssetLoader().loadTexture("ui/sword-icon.png");
var tiles    = getAssetLoader().loadTexture("tiles/forest-tileset.png");

// Spritesheet placeholder or third-party strip from assets/textures/sprites/
var walk = getAssetLoader()
        .loadTexture("sprites/player-walk.png")
        .toAnimatedTexture(8, Duration.seconds(0.8));

// Audio — FXGL uses different directories and loaders
var coinSFX = getAssetLoader().loadSound("coin.wav");   // assets/sounds/coin.wav
var theme   = getAssetLoader().loadMusic("theme.mp3");  // assets/music/theme.mp3
```

## Audio Intake Rules

- **Sound effects**: short, interactive, low-latency clips → `assets/sounds/` → **WAV**
- **Music / loops**: longer background tracks → `assets/music/` → **MP3**

If the downloaded file format does not match the FXGL target folder, convert it **before**
committing it into the project.

## Practical Agent Behavior

When using this skill, the agent should:

1. prefer sources with explicit license text on the asset page
2. reject missing-license pages without trying to infer intent
3. download only the approved files, not entire junk-filled packs unless requested
4. place files under the correct FXGL directory immediately
5. write attribution records in the same change set as the downloaded asset

## Gotchas

- **`loadSound()` uses `/assets/sounds/` and expects WAV** — placing MP3 files there causes
  load failures because FXGL routes by asset type, not by your intent.
- **`loadMusic()` uses `/assets/music/` and expects MP3** — do not place short gameplay SFX in
  the music folder.
- **Unclear license text is a hard stop** — "free download" is not the same as "commercial use
  allowed."
- **Attribution must record local paths after renaming** — if you rename files during intake,
  the credits file must reflect the final on-disk path, not the original download name.
- **Derivatives still count** — cropped spritesheets, recolors, trimmed silence, and loop edits
  are modifications and should be captured in the attribution record.
- **Do not mix compliance and placeholders** — this skill is for third-party source assets,
  not AI-generated temporary art.
