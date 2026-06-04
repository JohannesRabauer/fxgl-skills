---
name: fxgl-game-lifecycle
description: >
  Bootstrap and structure an FXGL game application — set up GameApplication subclass,
  configure initSettings, initGameVars, initInput, initGame, initPhysics, initUI, and
  onUpdate. Use this skill when creating a new FXGL game, adding engine services,
  configuring window size/title, setting application mode, or wiring the game loop.
  Triggers on: "create FXGL game", "GameApplication", "initSettings", "initGame",
  "game loop", "FXGL project setup", "engine service", "game bootstrap".
compatibility: Java 17+, FXGL 21.x, Maven or Gradle. JavaFX runtime must be on the module path.
metadata:
  author: fxgl-skills
  version: "1.0"
  fxgl-version: "21.1"
  category: fxgl/fundamentals
allowed-tools: Read Write Edit Bash
---

# FXGL Game Lifecycle

## Overview

Every FXGL game extends `GameApplication` and launches via `launch(args)`.
The engine calls lifecycle methods in strict order — honour that order or face NPEs.

## Lifecycle Order (guaranteed by engine)

```
launch(args)
  └─ initSettings(GameSettings)      ← configure window, services, achievements
       └─ initGameVars(Map)           ← declare all typed world variables
            └─ initInput()            ← register keyboard/mouse actions
                 └─ initGame()        ← spawn entities, load level, register factories
                      └─ initPhysics() ← set gravity, collision handlers
                           └─ initUI() ← build HUD nodes
                                └─ [game loop starts]
                                     └─ onUpdate(double tpf)  ← runs every frame
```

**Rule:** Never call `getGameWorld()`, `getPhysicsWorld()`, or `getInput()` inside
`initSettings()` — those services are not yet initialised.

## Minimal Working Game

```java
import com.almasb.fxgl.app.GameApplication;
import com.almasb.fxgl.app.GameSettings;
import static com.almasb.fxgl.dsl.FXGL.*;

public class MyGame extends GameApplication {

    @Override
    protected void initSettings(GameSettings settings) {
        settings.setWidth(1280);
        settings.setHeight(720);
        settings.setTitle("My Game");
        settings.setVersion("0.1");
    }

    @Override
    protected void initGame() {
        entityBuilder()
                .at(400, 300)
                .view(new javafx.scene.shape.Rectangle(40, 40, javafx.scene.paint.Color.BLUE))
                .buildAndAttach();
    }

    public static void main(String[] args) {
        launch(args);
    }
}
```

See [assets/templates/GameAppTemplate.java](assets/templates/GameAppTemplate.java) for a full template with all hooks.

## initSettings — Key Options

```java
@Override
protected void initSettings(GameSettings settings) {
    settings.setWidth(1280);
    settings.setHeight(720);
    settings.setTitle("My Game");
    settings.setVersion("1.0");

    // Menu
    settings.setMainMenuEnabled(true);
    settings.setGameMenuEnabled(true);
    settings.setEnabledMenuItems(EnumSet.of(MenuItem.NEW_GAME, MenuItem.SAVE, MenuItem.LOAD, MenuItem.EXIT));

    // Dev mode (use RELEASE for production builds)
    settings.setApplicationMode(ApplicationMode.DEVELOPER);
    settings.setDeveloperMenuEnabled(true);    // F1 debug pane
    settings.setProfilingEnabled(true);        // FPS overlay

    // Fullscreen
    settings.setFullScreenAllowed(true);
    settings.setFullScreenFromStart(false);

    // Register custom engine service
    settings.addEngineService(QuestService.class);
    settings.addEngineService(SaveLoadService.class);

    // Achievements (declare here — not in initGame)
    settings.getAchievements().add(new Achievement("First Kill", "Kill an enemy", "kills", 1));
}
```

## initGameVars — World Variable Declaration

All variables used elsewhere **must** be declared here. Missing a variable declaration
causes `IllegalArgumentException` on first access.

```java
@Override
protected void initGameVars(Map<String, Object> vars) {
    vars.put("score", 0);         // Integer
    vars.put("lives", 3);         // Integer
    vars.put("speed", 200.0);     // Double
    vars.put("paused", false);    // Boolean
    vars.put("playerName", "");   // String
}
```

## initInput — Binding Actions

```java
@Override
protected void initInput() {
    // Action fires every frame key is held
    onKey(KeyCode.A, () -> getPlayer().translateX(-5));
    onKey(KeyCode.D, () -> getPlayer().translateX(5));

    // Action fires once on key press
    onKeyDown(KeyCode.SPACE, () -> shoot());

    // Action fires once on key release
    onKeyUp(KeyCode.SHIFT, () -> stopSprint());

    // Mouse
    onBtnDownPrimary(() -> spawnProjectile());
}
```

## initGame — Entity & World Setup

```java
@Override
protected void initGame() {
    // Always add factories before spawning
    getGameWorld().addEntityFactory(new MyEntityFactory());

    // Load Tiled map (entities spawned via factory @Spawns annotations)
    setLevelFromMap("level1.tmx");

    // Or spawn manually
    spawn("player", 100, 100);
    spawn("enemy", 500, 300);

    // Screen boundary walls (40px thick)
    entityBuilder().buildScreenBoundsAndAttach(40);

    // Camera follow player
    Entity player = getGameWorld().getSingleton(e -> e.isType(EntityType.PLAYER));
    getGameScene().getViewport().bindToEntity(player, getAppWidth() / 2.0, getAppHeight() / 2.0);
}
```

## initPhysics — Gravity & Collision Handlers

```java
@Override
protected void initPhysics() {
    getPhysicsWorld().setGravity(0, 1200);  // (x, y) — positive y = down

    onCollisionBegin(EntityType.PLAYER, EntityType.COIN, (player, coin) -> {
        coin.removeFromWorld();
        inc("score", +10);
    });

    onCollisionBegin(EntityType.PLAYER, EntityType.ENEMY, (player, enemy) -> {
        inc("lives", -1);
        if (geti("lives") <= 0) showGameOver();
    });
}
```

## initUI — HUD

```java
@Override
protected void initUI() {
    Text scoreText = getUIFactoryService().newText("", Color.WHITE, 24);
    scoreText.textProperty().bind(getip("score").asString("Score: %d"));
    addUINode(scoreText, 20, 40);

    Text livesText = getUIFactoryService().newText("", Color.RED, 24);
    livesText.textProperty().bind(getip("lives").asString("Lives: %d"));
    addUINode(livesText, 20, 70);
}
```

## onUpdate — Game Loop

```java
@Override
protected void onUpdate(double tpf) {
    // tpf = time per frame in seconds (typically ~0.016 at 60fps)
    // Use tpf to make movement frame-rate independent:
    //   entity.translateX(speed * tpf)  ← correct
    //   entity.translateX(5)            ← wrong, speed depends on FPS

    spawnTimer += tpf;
    if (spawnTimer > 3.0) {
        spawn("enemy", random(0, getAppWidth()), -50);
        spawnTimer = 0;
    }
}
private double spawnTimer = 0;
```

## Custom Engine Services

```java
// 1. Define service
public class ScoreService extends EngineService {
    private int highScore = 0;

    @Override
    public void onGameReady() { /* runs after all init* hooks */ }

    public int getHighScore() { return highScore; }
    public void updateHighScore(int score) { highScore = Math.max(highScore, score); }
}

// 2. Register in initSettings
settings.addEngineService(ScoreService.class);

// 3. Use anywhere
FXGL.getService(ScoreService.class).updateHighScore(geti("score"));
```

## Gotchas

- **Asset directory**: all assets must be under `src/main/resources/assets/`. FXGL
  auto-prefixes this path. Writing `getAssetLoader().loadTexture("textures/player.png")`
  resolves to `assets/textures/player.png` on the classpath.
- **`launch(args)` is final** — do not override it. Override lifecycle hooks instead.
- **`initSettings` runs before JavaFX `Application.start()`** — avoid any JavaFX node
  creation here.
- **Kotlin DSL**: use `import com.almasb.fxgl.dsl.*` and `GameApplication()` — same hooks,
  same order. The `FXGLForKt` file provides Kotlin-specific extension functions.
- **Application mode**: always ship with `ApplicationMode.RELEASE`. The developer menu
  and profiler are disabled automatically.
- **Module path for JavaFX**: add `--module-path` and `--add-modules javafx.controls,javafx.fxml`
  to JVM args in your build file if running outside a module-aware launcher.
- **initGameVars is mandatory for reactive properties**: `getip("score")` throws
  `IllegalArgumentException` if `"score"` was not declared in `initGameVars`.
- **World reset**: calling `getGameController().startNewGame()` re-runs all init* hooks.
  Avoid storing state in instance fields unless you reset it in `initGameVars`.

## Quick Reference

| DSL method | Description |
|---|---|
| `getApp()` | Returns the `GameApplication` instance |
| `getAppWidth()` / `getAppHeight()` | Window dimensions in pixels |
| `getAppCenter()` | `Point2D` of the window centre |
| `getSettings()` | Read-only settings snapshot |
| `getGameController()` | Control game state (startNewGame, exit, pause) |
| `tpf()` | Time per frame of the last frame (seconds) |

See [references/settings-reference.md](references/settings-reference.md) for the full `GameSettings` API.
