# GameSettings Full Reference

Load this file when the user needs detailed configuration of GameSettings beyond the common options.

## Window & Display

| Method | Type | Default | Notes |
|--------|------|---------|-------|
| `setWidth(int)` | int | 800 | Logical game width in pixels |
| `setHeight(int)` | int | 600 | Logical game height in pixels |
| `setTitle(String)` | String | "Untitled" | Window title bar text |
| `setVersion(String)` | String | "0.0" | Shown in default menu |
| `setFullScreenAllowed(boolean)` | boolean | false | Enables fullscreen toggle (F11) |
| `setFullScreenFromStart(boolean)` | boolean | false | Starts in fullscreen |
| `setManualResizeEnabled(boolean)` | boolean | false | Allow window resize by dragging |
| `setScaleAffectedOnResize(Scene)` | Scene | — | Which scene scales on resize |
| `setPreserveResizeRatio(boolean)` | boolean | true | Maintain aspect ratio on resize |
| `setIntroEnabled(boolean)` | boolean | true | Show intro scene before menu |

## Application Mode

| Mode | Description |
|------|-------------|
| `ApplicationMode.DEVELOPER` | Dev menu, verbose logging, profiling enabled |
| `ApplicationMode.DEBUG` | Same as DEVELOPER but extra assertions |
| `ApplicationMode.RELEASE` | All dev features disabled, minimal logging |

## Menu Configuration

```java
settings.setMainMenuEnabled(true);
settings.setGameMenuEnabled(true);
settings.setEnabledMenuItems(EnumSet.of(
    MenuItem.NEW_GAME,
    MenuItem.CONTINUE,
    MenuItem.SAVE,
    MenuItem.LOAD,
    MenuItem.EXTRA,   // Credits, achievements sub-menu
    MenuItem.EXIT
));
settings.setSceneFactory(new MySceneFactory()); // custom menu/loading/intro
```

## Engine Services (common ones)

```java
// Add before first use; all available via FXGL.getService(Class)
settings.addEngineService(SaveLoadService.class);
settings.addEngineService(QuestService.class);
settings.addEngineService(CutsceneService.class);
settings.addEngineService(MiniGameService.class);
settings.addEngineService(NotificationService.class);
settings.addEngineService(LocalizationService.class);
```

## Credits

```java
settings.getCredits().add("Lead Developer: Alice");
settings.getCredits().add("Music: Bob");
settings.getCredits().add("Art: Carol");
```

## Cursor

```java
settings.setDefaultCursor(new ImageCursor(
    getAssetLoader().loadCursorImage("cursor.png"), 0, 0));
```

## Physics

```java
settings.setPhysicsTicksPerFrame(1); // increase for tunneling prevention
```

## Localization

```java
settings.setLanguage(Language.ENGLISH); // or Language.fromName("German")
```
