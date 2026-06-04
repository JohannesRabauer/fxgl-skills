---
name: fxgl-save-load
description: >
  Implement save and load functionality in FXGL — use SaveLoadService to persist and restore
  game state, write/read DataFile via writeSaveState and readSaveState hooks, manage named
  save slots, implement auto-save on checkpoints, integrate save/load into the game menu,
  and handle save file existence checks. Use this skill when adding a save system, implementing
  slot-based saves, restoring game progress between sessions, or handling checkpoint saves.
  Triggers on: "save game", "load game", "SaveLoadService", "DataFile", "writeSaveState",
  "readSaveState", "save slot", "checkpoint", "persist", "game progress".
compatibility: Java 17+, FXGL 21.x. Save files stored in user home ~/.fxgl/{AppTitle}/saves/.
metadata:
  author: fxgl-skills
  version: "1.0"
  fxgl-version: "21.1"
  category: fxgl/persistence
allowed-tools: Read Write Edit Bash
---

# FXGL Save & Load System

## Setup

```java
// 1. Register service in initSettings
settings.addEngineService(SaveLoadService.class);

// 2. Enable menu items (optional — adds Save/Load to game menu)
settings.setMainMenuEnabled(true);
settings.setGameMenuEnabled(true);
settings.setEnabledMenuItems(EnumSet.of(MenuItem.NEW_GAME, MenuItem.SAVE, MenuItem.LOAD));
```

## writeSaveState & readSaveState (core hooks)

Override these two methods in your `GameApplication` to control what gets persisted:

```java
@Override
public void writeSaveState(DataFile data) {
    // Serialise everything the player would lose on restart
    var bundle = data.getBundle("player");
    bundle.put("score",        geti("score"));
    bundle.put("lives",        geti("lives"));
    bundle.put("currentLevel", geti("currentLevel"));
    bundle.put("playerX",      getPlayerEntity().getX());
    bundle.put("playerY",      getPlayerEntity().getY());
    bundle.put("inventory",    getInventoryItems());  // List must be Serializable
}

@Override
public void readSaveState(DataFile data) {
    // Restore world state from the loaded file
    var bundle = data.getBundle("player");
    set("score",        bundle.get("score"));
    set("lives",        bundle.get("lives"));
    set("currentLevel", bundle.get("currentLevel"));

    // Rebuild world from saved state
    int level = geti("currentLevel");
    setLevelFromMap("level" + level + ".tmx");
    spawn("player", bundle.get("playerX"), bundle.get("playerY"));
    restoreInventory(bundle.get("inventory"));
}
```

## Saving & Loading Programmatically

```java
SaveLoadService sls = getService(SaveLoadService.class);

// Save to a named slot
sls.saveFileTask("slot1")        // file: ~/.fxgl/{AppTitle}/saves/slot1.dat
    .onSuccess(v -> showMessage("Saved!"))
    .onFailure(e -> showMessage("Save failed: " + e.getMessage()))
    .runAsync();

// Load from a named slot
sls.readSaveFileTask("slot1")
    .onSuccess(file -> {
        getGameController().loadGame(file);  // triggers readSaveState()
    })
    .onFailure(e -> showMessage("Load failed: " + e.getMessage()))
    .runAsync();

// Check if a save exists
boolean exists = sls.saveFileExists("slot1");

// List all save file names
List<String> saves = sls.saveFiles();   // returns file names without extension

// Delete a save
sls.deleteSaveFileTask("slot1").runAsync();
```

## Slot-Based Save Screen

```java
public class SaveLoadSubScene extends GameSubScene {

    private static final List<String> SLOTS = List.of("slot1", "slot2", "slot3");
    private final boolean isSaving;

    public SaveLoadSubScene(boolean isSaving) {
        this.isSaving = isSaving;
        buildUI();
    }

    private void buildUI() {
        VBox vbox = new VBox(10);
        SaveLoadService sls = getService(SaveLoadService.class);

        for (String slot : SLOTS) {
            boolean hasSave = sls.saveFileExists(slot);
            String label    = hasSave ? slot + " (saved)" : slot + " (empty)";

            Button btn = getUIFactoryService().newButton(label, () -> onSlotSelected(slot));
            vbox.getChildren().add(btn);
        }

        getRoot().getChildren().add(vbox);
    }

    private void onSlotSelected(String slot) {
        SaveLoadService sls = getService(SaveLoadService.class);

        if (isSaving) {
            sls.saveFileTask(slot)
               .onSuccess(v -> {
                   showMessage("Game saved to " + slot);
                   close();
               })
               .runAsync();
        } else {
            if (!sls.saveFileExists(slot)) return;
            sls.readSaveFileTask(slot)
               .onSuccess(file -> getGameController().loadGame(file))
               .runAsync();
        }
    }

    private void close() {
        getSceneService().popSubScene();
    }
}

// Open from button press
getSceneService().pushSubScene(new SaveLoadSubScene(true));  // save
getSceneService().pushSubScene(new SaveLoadSubScene(false)); // load
```

## Auto-Save on Checkpoint

```java
// Collision handler for checkpoint trigger entities
onCollisionBegin(EntityType.PLAYER, EntityType.CHECKPOINT, (player, cp) -> {
    // Only save once per checkpoint
    if (!cp.getProperties().getBoolean("activated")) {
        cp.getProperties().setValue("activated", true);
        cp.getComponent(ViewComponent.class).setOpacity(0.5); // visual feedback

        getService(SaveLoadService.class)
            .saveFileTask("autosave")
            .onSuccess(v -> pushNotification("Progress saved"))
            .runAsync();
    }
});
```

## Saving Multiple Bundles (complex game state)

```java
@Override
public void writeSaveState(DataFile data) {
    // Bundle 1: Player stats
    var player = data.getBundle("player");
    player.put("hp",      geti("health"));
    player.put("maxHp",   geti("maxHealth"));
    player.put("level",   geti("playerLevel"));
    player.put("xp",      geti("xp"));

    // Bundle 2: World state
    var world = data.getBundle("world");
    world.put("currentMap",    gets("currentMap"));
    world.put("unlockedAreas", geto("unlockedAreas"));  // Set<String>

    // Bundle 3: Inventory
    var inv = data.getBundle("inventory");
    inv.put("items", geto("inventoryItems")); // List<Item> — Item must implement Serializable
    inv.put("gold",  geti("gold"));
}

@Override
public void readSaveState(DataFile data) {
    var player = data.getBundle("player");
    set("health",      player.get("hp"));
    set("maxHealth",   player.get("maxHp"));
    set("playerLevel", player.get("level"));
    set("xp",          player.get("xp"));

    var world = data.getBundle("world");
    String mapName = world.get("currentMap");
    setLevelFromMap(mapName + ".tmx");

    var inv = data.getBundle("inventory");
    set("gold", inv.get("gold"));
    restoreInventory(inv.get("items"));
}
```

## Integration with Menu System

When `SaveLoadService` is registered and menu items include `MenuItem.SAVE` / `MenuItem.LOAD`,
FXGL's built-in menu calls `getGameController().saveGame(DataFile)` and
`getGameController().loadGame(DataFile)` which in turn invoke your `writeSaveState` and
`readSaveState` hooks. No extra wiring needed.

For a custom save screen in the menu:

```java
public class MyGameMenu extends FXGLMenu {
    public MyGameMenu() {
        super(MenuType.GAME_MENU);
        Button saveBtn = getUIFactoryService().newButton("Save", () -> {
            getSceneService().pushSubScene(new SaveLoadSubScene(true));
        });
        // ...
    }
}
```

## Gotchas

- **All objects in DataFile bundles must be `Serializable`** — use Java primitive wrappers
  (Integer, Double, Boolean, String), List, Map, or implement `Serializable` on custom classes.
  Non-serializable objects cause `NotSerializableException` at save time.
- **`readSaveState` must rebuild the world** — it's not a diff restore. Clear the old world
  state first with `getGameWorld().clearLevel()` before re-loading the level and re-spawning.
- **`saveFileTask` is asynchronous** — don't assume the file exists immediately after the
  call returns. Use `onSuccess` callback or call `runSync()` if you need blocking behaviour.
- **Bundle key names must be unique per bundle** — two `put("score", ...)` calls on the same
  bundle silently overwrite each other.
- **Save files survive app reinstalls** but are stored per app title. Changing
  `settings.setTitle()` effectively loses old saves (path changes). Use a stable internal name
  via `settings.setAppName()` if you want title changes to be cosmetic only.
- **`readSaveState` fires after `initGame()`** when loading from the menu. This means the
  world is built twice: once from `initGame()` and once from `readSaveState`. Guard
  `initGame()` against creating a duplicate player if a save will be loaded:
  ```java
  // In initGame: only create default state if not loading a save
  if (!getService(SaveLoadService.class).saveFileExists("autosave")) {
      spawn("player", 100, 100);
  }
  ```
