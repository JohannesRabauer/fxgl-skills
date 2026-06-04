# Use Cases — Level Loading & Asset Management

Covers Tiled TMX map loading, isometric maps, text-level format, and the asset loader service.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-LVL-1\nLoad Tiled TMX map"]
    Dev --> UC2["UC-LVL-2\nLoad isometric Tiled map"]
    Dev --> UC3["UC-LVL-3\nLoad text-format level"]
    Dev --> UC4["UC-LVL-4\nSwitch levels dynamically"]
    Dev --> UC5["UC-LVL-5\nLoad texture / image"]
    Dev --> UC6["UC-LVL-6\nLoad sprite sheet as AnimatedTexture"]
    Dev --> UC7["UC-LVL-7\nLoad custom font"]
    Dev --> UC8["UC-LVL-8\nLoad sound / music asset"]
    Dev --> UC9["UC-LVL-9\nLoad FXML UI layout"]
    Dev --> UC10["UC-LVL-10\nLoad data / JSON / properties file"]
    Dev --> UC11["UC-LVL-11\nLoad 3D OBJ model"]
    Dev --> UC12["UC-LVL-12\nMap Tiled objects to entity types"]
```

## Tiled Map Loading Flow

```mermaid
flowchart TD
    A["FXGL.setLevelFromMap('level1.tmx')"] --> B["FXGLAssetLoaderService reads TMX file"]
    B --> C["Parse tile layers → TileMapLayer entities"]
    C --> D["Parse object layer → calls EntityFactory.spawn(name, SpawnData)"]
    D --> E["Level object returned with width/height/entities"]
    E --> F["Viewport bounds auto-set from level size"]

    Style["TMX custom property 'type'\nmaps to @Spawns('type') in factory"] --> D
```

## Text Level Format

```mermaid
flowchart TD
    TextFile["assets/levels/level1.txt\n'W' → Wall\n'P' → Player\n'E' → Enemy"] --> Parser["TextLevelLoader"]
    Parser --> Factory["TextLevelEntityFactory\n@Spawns('W') etc."]
    Factory --> World["Entities added to game world"]
    Load["FXGL.setLevelFromMap('level1.txt')"] --> Parser
```

## Dynamic Level Switching

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GameWorld

    Dev->>GameWorld: gameWorld.clearLevel()
    Note over GameWorld: removes all non-persistent entities
    Dev->>Dev: setLevelFromMap('level2.tmx')
    GameWorld->>GameWorld: new entities added
    Dev->>GameWorld: spawn('player', startX, startY)
```

## Asset Directory Convention

```mermaid
graph TD
    Assets["src/main/resources/assets/"] --> Textures["textures/\n  *.png, *.jpg"]
    Assets --> Sounds["sounds/\n  *.wav, *.mp3"]
    Assets --> Music["music/\n  *.mp3, *.ogg"]
    Assets --> Levels["levels/\n  *.tmx, *.txt"]
    Assets --> Fonts2["fonts/\n  *.ttf, *.otf"]
    Assets --> UI["ui/\n  *.fxml, *.css"]
    Assets --> Data["data/\n  *.json, *.properties"]
    Assets --> Models3D["models/\n  *.obj"]
    Assets --> Scripts["scripts/\n  dialogue/*.json"]
```

## Asset Loader API

```mermaid
graph TD
    AL["getAssetLoader()"] --> Tex["loadTexture(name)\nloadTexture(name, w, h) – resize"]
    AL --> AT["loadTexture(name).toAnimatedTexture(frames, duration)"]
    AL --> Font["loadFont(name, size)"]
    AL --> Sound2["loadSound(name)"]
    AL --> Music2["loadMusic(name)"]
    AL --> FXML["loadUI(fxmlName)"]
    AL --> Data2["load(class, assetName) – generic loader"]
    AL --> Cursor["loadCursorImage(name)"]
    AL --> OBJ["loadObjModel(name) – 3D"]
```

## Tiled Object → Entity Type Mapping

```mermaid
flowchart LR
    TMX["Tiled Object Layer\nname: 'enemy'\ncustom props: hp=100"] --> SpawnData["SpawnData\n• x, y from object position\n• custom props available via data.get('hp')"]
    SpawnData --> Factory2["@Spawns('enemy')\nEntity spawn(SpawnData data){\n  int hp = data.get('hp');\n  ...}"]
```

## Texture Processing Use Cases

```mermaid
graph TD
    Tex2["Texture (loaded)"] --> Sub["subTexture(rectangle) – crop region"]
    Tex2 --> Anim2["toAnimatedTexture(frames, duration)"]
    Tex2 --> Flip["flipHorizontally() / flipVertically()"]
    Tex2 --> Color2["multiplyColor(color) – tint"]
    Tex2 --> Outline["outline(color, thickness)"]
    Tex2 --> Darken["darker() / brighter()"]
    Tex2 --> Resize2["toImage() – get WritableImage"]
```
