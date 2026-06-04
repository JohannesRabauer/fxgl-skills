---
name: fxgl-level-assets
description: >
  Load levels and assets in FXGL — import Tiled TMX tile maps (orthogonal and isometric),
  load text-format levels, switch levels dynamically, use the asset loader for textures,
  sprite sheets, fonts, sounds, music, FXML, data files, and 3D OBJ models. Map Tiled
  object-layer objects to entity types via @Spawns. Process textures (crop, flip, tint,
  outline). Use this skill when setting up a level pipeline, loading a Tiled map, fetching
  game assets programmatically, or configuring the asset directory structure.
triggers:
  - Tiled
  - TMX
  - setLevelFromMap
  - loadTexture
  - AssetLoader
  - level loading
  - tile map
  - @Spawns
  - asset directory
  - sprite sheet animation
compatibility: >
  Java 17+, FXGL 21.x. Tiled map editor must export maps as .tmx (XML).
category: fxgl/levels
tags:
  - fxgl
  - java
  - javafx
  - levels
  - level
  - assets
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
# FXGL Level Loading & Asset Management

## Asset Directory Layout

FXGL auto-resolves paths relative to `src/main/resources/assets/`:

```
src/main/resources/assets/
├── textures/          ← images for entity views and backgrounds
│   ├── player.png
│   └── ui/            ← optional sub-folders are fine
├── sounds/            ← short WAV files
├── music/             ← MP3 or OGG tracks
├── levels/            ← TMX maps and text level files
│   └── level1.tmx
├── fonts/             ← TTF or OTF font files
├── ui/                ← FXML and CSS files
├── data/              ← JSON, properties, CSV, etc.
├── models/            ← OBJ 3D model files
└── scripts/           ← dialogue JSON, quest scripts
    └── dialogues/
        └── npc1.json
```

**Never** use absolute paths or `ClassLoader.getResource()` directly — let FXGL resolve them.

## Loading Tiled TMX Maps

```java
// In initGame():
setLevelFromMap("level1.tmx");
// Returns Level object with level dimensions
Level level = setLevelFromMap("level2.tmx");
int levelWidth  = level.getWidth();   // in pixels
int levelHeight = level.getHeight();

// After loading, clamp viewport to level bounds
getGameScene().getViewport().setBounds(0, 0, levelWidth, levelHeight);
```

### Tiled Object → Entity Mapping (mandatory)

Each Tiled object in the "Entity" layer must have a **Type** property matching a `@Spawns`
annotation in your `EntityFactory`.

```java
public class LevelFactory implements EntityFactory {

    // Type set to "player" in Tiled object properties
    @Spawns("player")
    public Entity newPlayer(SpawnData data) {
        return entityBuilder(data)   // entityBuilder(data) preserves Tiled position
                .type(EntityType.PLAYER)
                .bbox(BoundingShape.box(40, 60))
                .collidable()
                .with(new PhysicsComponent())
                .with(new PlayerComponent())
                .build();
    }

    // Type set to "enemy" — read custom Tiled properties from SpawnData
    @Spawns("enemy")
    public Entity newEnemy(SpawnData data) {
        int   hp    = data.hasKey("hp")    ? (int)   data.get("hp")    : 100;
        float speed = data.hasKey("speed") ? (float) data.get("speed") : 150f;

        return entityBuilder(data)
                .type(EntityType.ENEMY)
                .view("enemy.png")
                .bbox(BoundingShape.box(32, 32))
                .collidable()
                .with(new EnemyComponent(hp, speed))
                .build();
    }

    // Tile layers become entities automatically — you only need to handle objects
    // For static decorations, return a simple view entity:
    @Spawns("decoration")
    public Entity newDecoration(SpawnData data) {
        String texture = data.get("texture");
        return entityBuilder(data)
                .view(texture)
                .build();
    }
}

// Register before loading the level
getGameWorld().addEntityFactory(new LevelFactory());
setLevelFromMap("level1.tmx");
```

## Dynamic Level Switching

```java
private void loadLevel(int levelNumber) {
    // Clear current level (removes all non-persistent entities)
    getGameWorld().clearLevel();

    // Load new level
    setLevelFromMap("level" + levelNumber + ".tmx");

    // Reset viewport
    Level level = setLevelFromMap("level" + levelNumber + ".tmx");
    getGameScene().getViewport().setBounds(0, 0, level.getWidth(), level.getHeight());

    // Spawn player at a named Tiled object position
    Entity spawnPoint = getGameWorld()
            .getSingleton(e -> e.isType(EntityType.SPAWN_POINT));
    spawn("player", spawnPoint.getX(), spawnPoint.getY());
    spawnPoint.removeFromWorld();
}
```

## Text Level Format

```
# Text level: one char per tile
# Configure: LevelLoader maps each char to a @Spawns type

W W W W W W W W
W . . . P . . W
W . E . . . . W
W W W W W W W W
```

```java
// Entity factory handles chars via @Spawns
@Spawns("W") // 'W' = Wall
public Entity newWall(SpawnData data) {
    return entityBuilder(data)
            .type(EntityType.WALL)
            .view(new Rectangle(40, 40, Color.GRAY))
            .bbox(BoundingShape.box(40, 40))
            .collidable()
            .with(new PhysicsComponent())
            .build();
}

// Load (FXGL infers character-to-type mapping from @Spawns names)
setLevelFromMap("level1.txt");
```

## Isometric Tiled Map

```java
// Works identically to orthogonal — FXGL handles ISO conversion
setLevelFromMap("iso_level1.tmx");
// Ensure your Tiled map is set to "Isometric" orientation
// Entity positions are converted to screen coordinates automatically
```

## Asset Loader API

```java
FXGLAssetLoaderService loader = getAssetLoader();

// Textures
Texture   tex  = loader.loadTexture("player.png");           // from assets/textures/
Texture   tex2 = loader.loadTexture("bg/sky.png", 800, 600); // resize on load

// Animated texture
AnimatedTexture anim = loader.loadTexture("walk.png")
        .toAnimatedTexture(8, Duration.seconds(0.6));  // 8 frames

// Fonts
Font font = loader.loadFont("pixel.ttf", 18.0);

// Sounds & Music
Sound jump   = loader.loadSound("jump.wav");     // from assets/sounds/
Music theme  = loader.loadMusic("theme.mp3");    // from assets/music/

// FXML
Parent shopUI = loader.loadUI("shop.fxml");      // from assets/ui/

// Data (any format — returns InputStream)
InputStream is = loader.loadData("config.json"); // from assets/data/

// Properties file (key=value format)
ResourceBundle rb = loader.loadResourceBundle("game"); // game.properties

// Cursor image
Image cursor = loader.loadCursorImage("crosshair.png");

// 3D model
Model3D model = loader.loadModel3D("ship.obj");  // from assets/models/
```

## Texture Processing

```java
Texture base = getAssetLoader().loadTexture("hero.png");

// Crop a region
Texture cropped = base.subTexture(new Rectangle2D(0, 0, 32, 32));

// Flip horizontally (for left/right character sprite)
Texture flipped = base.flipHorizontally();
Texture flippedV = base.flipVertically();

// Tint / multiply color
Texture tinted = base.multiplyColor(Color.RED);   // red tint

// Outline
Texture outlined = base.outline(Color.BLACK, 2.0); // 2px black outline

// Brightness
Texture darker  = base.darker();
Texture lighter = base.brighter();

// Convert to WritableImage (for pixel manipulation)
WritableImage wi = base.toImage();
```

## Asset Pre-loading Pattern

```java
// In a custom LoadingScene or before entering a level
public class MyLoadingScene extends LoadingScene {
    @Override
    public void onUpdate(double tpf) {
        // Display progress
        setProgress(getAssetLoader().cacheSize() / expectedAssets);
    }
}

// Pre-cache heavy assets during the loading phase:
getAssetLoader().loadTexture("boss.png");
getAssetLoader().loadTexture("tileset.png");
getAssetLoader().loadMusic("boss-theme.mp3");
// All subsequent calls to loadTexture/loadMusic return from cache instantly
```

## Gotchas

- **`entityBuilder(data)` not `entityBuilder()`** in `@Spawns` methods — the `data` carries
  the position from the Tiled object. Using `entityBuilder()` spawns everything at (0, 0).
- **Tiled object type must exactly match** the string in `@Spawns("type")` — case-sensitive.
  Set the Type field in Tiled's object properties, not the object's name.
- **Tile layer entities are created automatically** by FXGL's Tiled loader — you only write
  factory methods for object layer objects. Tile entities are positioned using the tileset.
- **`clearLevel()` removes all entities** that don't have `.persistent()` applied via
  `entityBuilder().persistent()`. Persistent entities survive level reloads (e.g., the player).
- **`setLevelFromMap` is synchronous** and may stutter for large maps. Run it in the loading
  scene before gameplay starts, not during `onUpdate`.
- **Text level format**: characters are split by spaces in each row. A missing factory method
  for a character logs a warning and spawns nothing (not an exception).
- **Isometric maps**: entity `getX() / getY()` return screen (isometric) coordinates.
  World-to-iso conversion is handled internally; just use entity positions normally.
- **Asset caching**: the `FXGLAssetLoaderService` caches by file path. Calling
  `loadTexture("player.png")` twice returns the same object — safe and efficient.
