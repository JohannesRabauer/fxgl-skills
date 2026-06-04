---
name: fxgl-placeholder-art-prompts
description: >
  Generate AI-image prompts for temporary placeholder art in FXGL games. Optimize for gameplay
  readability, exact dimensions, consistent perspective, transparent backgrounds, and FXGL
  spritesheet compatibility rather than final production polish. Use this skill when a prototype
  needs usable stand-in art for sprites, portraits, UI icons, or environment tiles while real
  art is pending.
triggers:
  - placeholder art
  - ai image prompt
  - temp art
  - spritesheet prompt
  - icon prompt
  - tile prompt
  - portrait prompt
  - gameplay readability
  - top down art
  - side view sprite
  - isometric placeholder
compatibility: >
  Java 17+, FXGL 21.x. Intended for temporary images loaded through the standard FXGL asset
  pipeline. Focuses on image placeholders only; audio is out of scope.
category: fxgl/art
tags:
  - fxgl
  - java
  - javafx
  - art
  - placeholder
  - prompts
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
# FXGL Placeholder Art Prompts

## Scope

Use this skill to produce **temporary, gameplay-readable image prompts** for:

- character sprites
- single-row spritesheets
- portraits
- UI icons
- tiles and small environment art

This skill is **not** for sourcing third-party assets and **not** for audio.

## Core Rule

Optimize for:

1. readability during gameplay
2. exact dimensions and asset structure
3. perspective consistency with the game
4. replaceability later by a human artist or final pipeline

Do **not** optimize first for painterly detail or marketing-art polish.

## Project Placement Convention

Put generated placeholders under:

```text
src/main/resources/assets/textures/placeholder/
```

Recommended naming:

- `player-walk-placeholder.png`
- `merchant-portrait-placeholder.png`
- `inventory-sword-placeholder.png`
- `forest-grass-tile-placeholder.png`

This makes later replacement easy to track.

## Required Prompt Inputs

Before writing a prompt, define:

- asset type: sprite / spritesheet / portrait / icon / tile
- game view: side-view / top-down / isometric
- target dimensions
- intended role in gameplay, e.g. player, enemy, interactable, UI state
- palette / style, e.g. pixel art, flat-shaded, cel-shaded
- background requirement: usually transparent PNG

## Perspective Rules

- **Side-view**: platformer, brawler, shmup side profile; readable jump / run silhouette
- **Top-down**: RPG, tactics, shooter; readable overhead silhouette and facing direction
- **Isometric**: strategy / tactics; fixed isometric angle with no perspective drift

If the game's camera view is unclear, resolve that first before prompting.

## Prompt Template — Single Image Sprite

```text
Create a temporary placeholder game sprite for an FXGL game.
Asset type: [character / object / pickup / prop]
View: [side-view / top-down / isometric]
Style: [pixel art / flat-shaded / simple stylized]
Dimensions: exactly [WIDTH]x[HEIGHT] pixels
Purpose: readable during gameplay at small on-screen size
Requirements:
- clear silhouette
- strong contrast against common game backgrounds
- transparent background
- centered subject
- no text, watermark, frame, or decorative border
- simple shapes over fine detail
- consistent perspective for gameplay
```

## Prompt Template — FXGL Spritesheet

Use this when the result will be loaded with `toAnimatedTexture(numFrames, duration)`.

```text
Create a temporary placeholder spritesheet for an FXGL game character.
View: [side-view / top-down / isometric]
Style: [pixel art / flat-shaded / simple stylized]
Animation: [walk / run / idle / attack]
Frame count: [N]
Frame size: exactly [FRAME_WIDTH]x[FRAME_HEIGHT] pixels
Output format:
- single-row horizontal strip
- exactly [N] frames left-to-right
- total image width exactly [FRAME_WIDTH * N] pixels
- transparent background
- no padding between frames
- no labels, numbers, or frame borders
Readability requirements:
- consistent silhouette across frames
- motion readable at gameplay scale
- no extra limbs, duplicate weapons, or pose drift
```

## Prompt Template — Portrait

```text
Create a temporary NPC portrait for an FXGL dialogue UI.
Style: simple readable concept-art placeholder, not final polished splash art
Dimensions: exactly [WIDTH]x[HEIGHT] pixels
Framing: head-and-shoulders portrait
Mood / role: [shopkeeper / villain / ally / quest giver]
Requirements:
- clean background or transparent background
- readable facial expression
- limited detail
- consistent lighting
- no text or logo
```

## Prompt Template — UI Icon

```text
Create a temporary UI icon for an FXGL inventory or HUD.
Object: [sword / potion / shield / quest marker]
Style: simple, bold, high-contrast game UI icon
Canvas: exactly [SIZE]x[SIZE] pixels
Requirements:
- transparent background
- centered icon
- no text
- no ornamental frame unless requested
- readable at small size
```

## Prompt Template — Tile

```text
Create a temporary gameplay tile for an FXGL / Tiled-based game.
Tile type: [grass / stone floor / wall / water / lava]
View: [top-down / side-view / isometric]
Tile size: exactly [TILE_SIZE]x[TILE_SIZE] pixels
Requirements:
- seamless or clearly tileable edges if requested
- simple readable texture
- strong distinction from neighboring tile types
- no perspective mismatch
- no shadows that imply a conflicting light direction
```

## Negative Prompt Checklist

Add or adapt these negatives when your image model supports them:

```text
watermark, logo, text, frame, border, background scenery, photorealism,
busy composition, excessive detail, extra limbs, duplicate weapon, perspective mismatch,
uneven frame size, padding between frames, mislabeled frames, copyrighted character,
named artist style imitation
```

## FXGL Loading Examples

```java
var playerIdle = getAssetLoader().loadTexture("placeholder/player-idle-placeholder.png");

var playerWalk = getAssetLoader()
        .loadTexture("placeholder/player-walk-placeholder.png")
        .toAnimatedTexture(8, Duration.seconds(0.8));

var portrait = getAssetLoader().loadTexture("placeholder/merchant-portrait-placeholder.png");
var icon     = getAssetLoader().loadTexture("placeholder/inventory-sword-placeholder.png");
var tile     = getAssetLoader().loadTexture("placeholder/forest-grass-tile-placeholder.png");
```

## Handoff to Final Art

When placeholders are meant to be replaced later, keep:

- the final prompt text
- the target dimensions
- the game-view mode
- the intended gameplay role

These are the minimum handoff details for either a human artist or a later art pass.

## Quick Checklist

See [references/prompt-checklist.md](references/prompt-checklist.md) for a compact prompt
checklist.

## Gotchas

- **`toAnimatedTexture(frames, duration)` requires a one-row strip** — FXGL divides the image
  width by frame count, so 2x4 grids or labeled frame sheets will break animation playback.
- **Tile size must match the map** — if your Tiled map uses 32x32 tiles, a 48x48 placeholder tile
  is the wrong asset and should be regenerated, not stretched.
- **Perspective mismatch is more damaging than low fidelity** — a crude but correct top-down
  placeholder is more useful than a pretty side-view sprite in a top-down game.
- **Transparent background is usually mandatory** — baked-in scenery or fake drop shadows make
  placeholders much harder to replace later.
- **Keep placeholders in their own folder** — otherwise they get mixed with shipped art and are
  hard to remove before release.
- **Do not request copyrighted characters or artist-style mimicry** — use generic descriptive
  language focused on gameplay role and silhouette.
