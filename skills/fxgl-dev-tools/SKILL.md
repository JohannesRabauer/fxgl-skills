---
name: fxgl-dev-tools
description: >
  Use FXGL's built-in developer tools during development — enable the developer menu (F1 overlay),
  inspect all active entities and their components at runtime, use the in-game console to run
  commands without recompiling, profile FPS and memory with the profiler window, visualise
  entity bounding boxes and collision shapes, switch application mode between DEVELOPER and
  RELEASE, register custom dev console commands via DevService, use FXGL.debug() for console
  logging, and visualise graphs (pathfinding, dialogue, quest) at runtime.
  Use this skill when debugging game behaviour, tuning AI, stress-testing level generation,
  inspecting entity state at runtime, or setting up a cheat/test console for development.
  Triggers on: "developer menu", "DevService", "devMenu", "devPane", "console command",
  "profiler", "FPS counter", "bounding box visualisation", "ApplicationMode", "DEVELOPER mode",
  "RELEASE mode", "entity inspector", "debug camera", "FXGL.debug", "graph visualisation".
compatibility: Java 17+, FXGL 21.x
metadata:
  author: fxgl-skills
  version: "1.0"
  fxgl-version: "21.1"
  category: fxgl/dev
allowed-tools: Read Write Edit Bash
---

# FXGL Developer Tools

## Enable Dev Tools in initSettings

```java
@Override
protected void initSettings(GameSettings settings) {
    settings.setWidth(1280);
    settings.setHeight(720);

    // Show developer pane on F1 (hidden in RELEASE mode automatically)
    settings.setDeveloperMenuEnabled(true);

    // Show FPS / memory / entity count / physics step duration overlay
    settings.setProfilingEnabled(true);

    // Application mode controls all dev features at once
    settings.setApplicationMode(ApplicationMode.DEVELOPER);
    // Use ApplicationMode.RELEASE for distribution (disables all dev overlays)
}
```

## Application Modes

| Mode | Dev Menu | Profiler | Logging | Exception Handling |
|------|----------|----------|---------|-------------------|
| `DEVELOPER` | enabled | enabled | verbose | crash with stack trace |
| `DEBUG` | enabled | enabled | verbose | crash with stack trace |
| `RELEASE` | hidden | hidden | minimal | graceful fallback |

```java
// Check mode at runtime to conditionally run dev code
if (getSettings().getApplicationMode() != ApplicationMode.RELEASE) {
    // Only runs in DEVELOPER / DEBUG
    registerDevCommands();
}
```

## Developer Pane (F1 Overlay)

The dev pane opens by pressing **F1** (when `setDeveloperMenuEnabled(true)`). It shows:

- **World Properties** — all game variables, editable in real time
- **Entity list** — all active entities; click to inspect components
- **Physics debug toggle** — draws bounding boxes over all collidable entities
- **Custom buttons** — registered via `getDevService()`

## In-Game Console Commands

```java
// Register custom console commands in initGame
@Override
protected void initGame() {
    // Simple command — no args
    getDevService().registerCommand("godMode", args -> {
        set("health", 999);
        set("shields", 999);
        System.out.println("[DEV] God mode enabled");
    });

    // Command with arguments (all args arrive as List<String>)
    getDevService().registerCommand("spawn", args -> {
        if (args.size() < 3) {
            System.out.println("Usage: spawn <type> <x> <y>");
            return;
        }
        String type = args.get(0);
        double x    = Double.parseDouble(args.get(1));
        double y    = Double.parseDouble(args.get(2));
        spawn(type, x, y);
    });

    getDevService().registerCommand("clearEnemies", args -> {
        getGameWorld().getEntitiesByType(EntityType.ENEMY)
                      .forEach(Entity::removeFromWorld);
    });

    getDevService().registerCommand("winLevel", args -> {
        fireEvent(new LevelCompleteEvent());
    });
}
```

## FXGL.debug() — Push Messages to Console

```java
// Available anywhere in your game code
// Appears in the dev console log and is suppressed in RELEASE mode

FXGL.debug("Player position: " + player.getPosition());
FXGL.debug("Enemy count: " + getGameWorld().getEntitiesByType(EntityType.ENEMY).size());

// Also works as a static import
debug("AStarGrid recalculated in " + elapsed + "ms");
```

## Profiler Window

Enabled by `settings.setProfilingEnabled(true)`. Displays:

- **FPS** — current, average, minimum
- **Heap memory** — used / total
- **Entity count** — how many entities are active
- **Physics step** — time in ms per frame for Box2D
- **Render duration** — JavaFX scene graph render time

```java
// Programmatic access to profiling data
Profiler profiler = getProfiler();
double avgFPS = profiler.getAvgFPS();
long usedMemory = profiler.getUsedMemory();
```

## Bounding Box Visualisation

```java
// Toggle in dev pane, or enable programmatically:
getPhysicsWorld().setShowBoundingBoxes(true);

// Colors used:
//   DYNAMIC bodies  → green box
//   STATIC bodies   → blue box
//   SENSOR bodies   → yellow box (triggers)

// Visualise a single entity's bounding boxes
entity.getBoundingBoxComponent().visualise();
// Shows red outline around each hitbox of that entity only
```

## Entity Inspector (Runtime Component View)

Click any entity in the dev pane entity list to open the **EntityInspector**:

- Lists all attached components with their class names
- Shows field values (primitives only — no deep graph)
- Updates live every frame

```java
// Make component data visible in the inspector: use simple fields.
// The inspector uses reflection — public or package-private fields show automatically.
// Wrap mutable state in fields (not anonymous lambdas) for visibility.

public class SpeedComponent extends Component {
    public double speed = 150;      // visible in inspector
    public boolean isSprinting = false;
    // ...
}
```

## Custom Dev Buttons in Dev Pane

```java
// Add buttons that appear in the developer pane
@Override
protected void initGame() {
    getDevService().addButton("Teleport to Boss", () -> {
        player.setPosition(bossRoom.getCenterX() * 32, bossRoom.getCenterY() * 32);
    });

    getDevService().addButton("Kill All Enemies", () -> {
        getGameWorld().getEntitiesByType(EntityType.ENEMY)
                      .forEach(Entity::removeFromWorld);
    });

    getDevService().addButton("Max Stats", () -> {
        set("gold",   9999);
        set("health", 100);
        set("ammo",   999);
    });
}
```

## Debug Camera

The dev pane includes a "Debug Camera" mode that decouples the view from the game camera:

- **Drag** with middle mouse button to pan
- **Scroll wheel** to zoom in and out
- **Press Esc** to return to the game camera

Activated via the dev pane button — no code required.

## Graph Visualisation

```java
// Visualise node-edge graphs (pathfinding, dialogue trees, quest deps, etc.)
import com.almasb.fxgl.dev.GraphVisualisation;

GraphVisualisation vis = new GraphVisualisation();

// Add nodes with positions
vis.addNode("Start",   100, 100);
vis.addNode("Room1",   300, 100);
vis.addNode("Room2",   300, 300);
vis.addNode("Boss",    500, 200);

// Add edges
vis.addEdge("Start",  "Room1");
vis.addEdge("Start",  "Room2");
vis.addEdge("Room1",  "Boss");
vis.addEdge("Room2",  "Boss");

// Render in the game scene (as a HUD overlay)
addUINode(vis.getView(), 0, 0);

// Remove when done
removeUINode(vis.getView());
```

## Conditional Dev-Only Code Pattern

```java
// Guard dev-only features so they are compiled out or skipped in RELEASE
private void registerDevCommands() {
    if (getSettings().getApplicationMode() == ApplicationMode.RELEASE) return;

    getDevService().registerCommand("noclip", args -> {
        PhysicsComponent pc = player.getComponent(PhysicsComponent.class);
        pc.setBodyType(pc.getBodyType() == BodyType.DYNAMIC
                ? BodyType.KINEMATIC
                : BodyType.DYNAMIC);
    });

    getDevService().registerCommand("timescale", args -> {
        double scale = args.isEmpty() ? 1.0 : Double.parseDouble(args.get(0));
        getGameWorld().getEntities().forEach(e -> {
            if (e.hasComponent(EffectComponent.class)) {
                e.getComponent(EffectComponent.class)
                 .startEffect(new SlowTimeEffect(Duration.seconds(60)));
            }
        });
    });
}
```

## Gotchas

- **Dev menu is hidden in RELEASE mode automatically** — you do not need to remove dev code
  before distribution. `setApplicationMode(ApplicationMode.RELEASE)` suppresses all dev overlays.
- **`getDevService()` is null if `setDeveloperMenuEnabled(false)`** — always guard with
  `getSettings().getApplicationMode() != ApplicationMode.RELEASE` before calling it.
- **`settings.setProfilingEnabled(true)` has a small FPS cost** — the profiler samples every
  frame. Disable it for final release builds or when benchmarking performance.
- **`FXGL.debug()` writes to stdout and the console log** — it does NOT appear as an in-game
  notification. Use `pushNotification()` for player-visible messages.
- **Entity inspector uses reflection** — private fields with no public getter are not shown.
  Make fields package-private or public on components you want to inspect.
- **`getPhysicsWorld().setShowBoundingBoxes(true)` is a global toggle** — it affects all
  entities. Toggling it rapidly can cause a frame of missing visuals due to scene graph update timing.
- **Graph visualisation is for debugging only** — `GraphVisualisation` adds JavaFX nodes
  directly; it is not backed by FXGL's entity system and won't appear in entity queries.
- **Debug camera breaks gameplay** — while the debug camera is active, the game loop still runs
  (enemies still move, timers tick). Use `getGameController().pauseEngine()` alongside the debug
  camera if you need to freeze the world.
