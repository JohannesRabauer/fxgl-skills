# Use Cases — Free Asset Sourcing, Attribution & FXGL Project Intake

Covers commercially safe free asset discovery, license filtering, download, project organization,
and attribution capture for FXGL games.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer / Coding Agent])
    Source([Asset Source])
    Project([FXGL Project])

    Dev --> UC1["UC-ASSET-1\nFind candidate assets online"]
    Dev --> UC2["UC-ASSET-2\nFilter by license and commercial-use rights"]
    Dev --> UC3["UC-ASSET-3\nReject unclear or incompatible licenses"]
    Dev --> UC4["UC-ASSET-4\nDownload approved image assets"]
    Dev --> UC5["UC-ASSET-5\nDownload approved audio assets"]
    Dev --> UC6["UC-ASSET-6\nPlace files into FXGL asset folders"]
    Dev --> UC7["UC-ASSET-7\nNormalize names and folder structure"]
    Dev --> UC8["UC-ASSET-8\nCapture provenance and attribution"]
    Dev --> UC9["UC-ASSET-9\nGenerate reusable project credits artifact"]

    Source --> UC1
    Project --> UC6
    Project --> UC9
```

## License Decision Flow

```mermaid
flowchart TD
    A["Candidate asset page"] --> B{"License explicitly shown?"}
    B -- No --> X["Reject asset"]
    B -- Yes --> C{"Commercial use allowed?"}
    C -- No --> X
    C -- Yes --> D{"Modification / derivative use allowed?"}
    D -- No --> X
    D -- Yes --> E{"License in allowlist?\nCC0 / CC BY / equivalent explicit commercial-use license"}
    E -- No --> X
    E -- Yes --> F["Capture author, title, URL,\nlicense name, license URL,\ndownload date, local path"]
    F --> G["Approve for intake"]
```

## Asset Intake Pipeline

```mermaid
sequenceDiagram
    participant Dev as Developer / Agent
    participant Web as Asset Source
    participant Repo as FXGL Project
    participant Credits as Credits File

    Dev->>Web: Search by needed asset type and style
    Web-->>Dev: Candidate asset page + download file + license data
    Dev->>Dev: Validate license against allowlist
    alt approved
        Dev->>Repo: Download and place under assets/...
        Dev->>Repo: Rename to project-safe file name
        Dev->>Credits: Append attribution entry
    else rejected or unclear
        Dev->>Dev: Skip and continue search
    end
```

## FXGL Project Organization

```mermaid
graph TD
    Root["src/main/resources/assets/"] --> Textures["textures/"]
    Root --> Sounds["sounds/"]
    Root --> Music["music/"]
    Root --> Data["data/"]

    Textures --> Sprites["sprites/"]
    Textures --> Portraits["portraits/"]
    Textures --> UI["ui/"]
    Textures --> Tiles["tiles/"]
    Textures --> Backgrounds["backgrounds/"]

    Sounds --> SFX["short WAV SFX"]
    Music --> BGM["loop / long-form MP3 music"]
    Data --> Attribution["attribution.csv (optional runtime credits)"]
```

## Audio Routing Decision

```mermaid
flowchart TD
    A["Approved audio asset"] --> B{"Short interactive SFX?"}
    B -- Yes --> C["Convert / keep as WAV"]
    C --> D["Place in assets/sounds/"]
    B -- No --> E{"Background or long loop?"}
    E -- Yes --> F["Convert / keep as MP3"]
    F --> G["Place in assets/music/"]
    E -- No --> H["Review manually before import"]
```

## Attribution Artifact Generation

```mermaid
flowchart LR
    Asset["Imported asset"] --> Meta["Capture:\n- title\n- creator\n- source URL\n- license\n- license URL\n- local path\n- modifications"]
    Meta --> MD["Project root THIRD_PARTY_ASSETS.md"]
    Meta --> CSV["Optional assets/data/attribution.csv"]
    MD --> CreditsScreen["Can be copied into release notes / legal page"]
    CSV --> GameUI["Can be loaded by FXGL for in-game credits"]
```
