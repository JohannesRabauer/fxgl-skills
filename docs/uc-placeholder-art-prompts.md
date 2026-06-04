# Use Cases — AI Placeholder Art Prompts for FXGL

Covers prompt generation for temporary, gameplay-readable placeholder images that fit an FXGL
project's perspective, tile size, and animation constraints.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer / Coding Agent])
    Model([Image Generation Model])
    Project([FXGL Project])

    Dev --> UC1["UC-PROMPT-1\nGenerate readable character placeholder"]
    Dev --> UC2["UC-PROMPT-2\nGenerate single-row spritesheet placeholder"]
    Dev --> UC3["UC-PROMPT-3\nGenerate portrait placeholder"]
    Dev --> UC4["UC-PROMPT-4\nGenerate UI icon placeholder"]
    Dev --> UC5["UC-PROMPT-5\nGenerate exact-size tile placeholder"]
    Dev --> UC6["UC-PROMPT-6\nMatch top-down / side-view / isometric perspective"]
    Dev --> UC7["UC-PROMPT-7\nStore placeholders separately from final art"]
    Dev --> UC8["UC-PROMPT-8\nPrepare handoff prompts for later replacement"]

    Model --> UC1
    Model --> UC2
    Model --> UC3
    Model --> UC4
    Model --> UC5
    Project --> UC7
```

## Prompt Construction Flow

```mermaid
flowchart TD
    A["Need placeholder asset"] --> B["Choose asset type:\nsprite / portrait / icon / tile"]
    B --> C["Choose view mode:\nside-view / top-down / isometric"]
    C --> D["Set exact dimensions:\nframe size, tile size, output size"]
    D --> E["Add readability constraints:\nclear silhouette, high contrast,\nlimited palette, transparent background"]
    E --> F["Add engine constraints:\nno text, no watermark,\nno borders, no busy background"]
    F --> G["If animated: single-row strip,\nN frames left-to-right,\nno padding between frames"]
    G --> H["Generate prompt + negative prompt"]
```

## Perspective Selection

```mermaid
graph TD
    View["Game camera / gameplay view"] --> Side["Side-view\nplatformer / brawler / shmup"]
    View --> Top["Top-down\nRPG / shooter / tactics"]
    View --> Iso["Isometric\nstrategy / tactics / city builder"]

    Side --> SideRule["Strict side profile\nreadable jump / run poses"]
    Top --> TopRule["Readable overhead silhouette\nclear facing direction"]
    Iso --> IsoRule["Consistent isometric angle\nno perspective drift across tiles"]
```

## Placeholder Intake into FXGL Project

```mermaid
graph TD
    Prompt["Prompt output"] --> Image["Generated placeholder PNG"]
    Image --> Folder["assets/textures/placeholder/..."]
    Folder --> Load["FXGL loadTexture('placeholder/...')"]
    Folder --> Track["Naming suffix or placeholder folder\nmarks asset for later replacement"]
    Track --> Replace["Swap with final art later\nwithout losing intended usage"]
```

## Spritesheet Structure Constraint

```mermaid
flowchart LR
    A["Animated placeholder needed"] --> B["Decide frame size\n(e.g. 48x48)"]
    B --> C["Decide frame count\n(e.g. 8)"]
    C --> D["Output width = frameWidth * numFrames"]
    D --> E["Single-row horizontal strip"]
    E --> F["Use FXGL toAnimatedTexture(numFrames, duration)"]
```

## Placeholder Replacement Lifecycle

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Project as FXGL Project
    participant Artist as Final Art Source

    Dev->>Project: Add placeholder under assets/textures/placeholder/
    Dev->>Project: Load placeholder in gameplay prototype
    Dev->>Artist: Share prompt + intended role + dimensions
    Artist-->>Dev: Final art replacement
    Dev->>Project: Replace placeholder path or remap asset reference
```
