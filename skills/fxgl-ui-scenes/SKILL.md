---
name: fxgl-ui-scenes
description: >
  Build HUD, menus, dialogs, overlays, and scenes in FXGL — add UI nodes to the HUD,
  create custom main and game menus via SceneFactory, open modal dialogs (message,
  confirm, input, error, progress), push in-game notifications, implement GameSubScene
  overlays, bind text to game variables, control viewport and camera-follow, integrate
  FXML layouts, apply custom CSS, use nine-slice scaling images, add scrolling
  backgrounds, and add a minimap. Use this skill for anything related to game UI, HUD,
  screen transitions, or in-game menus.
triggers:
  - HUD
  - menu
  - dialog
  - notification
  - GameSubScene
  - addUINode
  - viewport
  - camera follow
  - FXML
  - CSS
  - minimap
  - scrolling background
  - custom menu
  - scene
  - UIFactory
compatibility: >
  Java 17+, FXGL 21.x, JavaFX FXML for FXML features.
category: fxgl/ui
tags:
  - fxgl
  - java
  - javafx
  - ui
  - scenes
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
# FXGL UI & Scene System

## Adding Nodes to the HUD

The HUD layer sits above the game world and is NOT scrolled by the viewport.

```java
@Override
protected void initUI() {
    // Static text
    Text label = getUIFactoryService().newText("Score: 0", Color.WHITE, 22.0);
    addUINode(label, 20, 40);      // top-left at (20, 40)

    // Text bound to a game variable (reactive)
    Text scoreText = getUIFactoryService().newText("", Color.WHITE, 22.0);
    scoreText.textProperty().bind(getip("score").asString("Score: %d"));
    addUINode(scoreText, 20, 40);

    // Shorthand bind-to-var (creates Text automatically)
    addVarText("lives", 20, 70);   // shows "3" (raw value)

    // Center text
    Text centerMsg = getUIFactoryService().newText("READY!", Color.YELLOW, 48.0);
    centerText(centerMsg);   // centred in window
    addUINode(centerMsg);

    // Remove later
    // removeUINode(scoreText);
}
```

## UIFactory — Available Widgets

```java
UIFactoryService ui = getUIFactoryService();

Text           t  = ui.newText("text", Color.WHITE, 18.0);
Button         b  = ui.newButton("Click Me", () -> doSomething());
CheckBox       cb = ui.newCheckBox();
Spinner<T>     sp = ui.newSpinner(FXCollections.observableArrayList("a","b","c"));
ProgressBar    pb = ui.newProgressBar(true);   // true = horizontal
pb.setProgress(0.75);

Tooltip tip = ui.newTooltip("Heal your character");
Tooltip.install(b, tip);
```

## Custom Main Menu / Game Menu

```java
// 1. Create custom menu class
public class MyMainMenu extends FXGLMenu {
    public MyMainMenu() {
        super(MenuType.MAIN_MENU);
        // Build your JavaFX scene graph here
        Button newGame = getUIFactoryService().newButton("New Game", this::fireNewGame);
        Button exit    = getUIFactoryService().newButton("Exit",     this::fireExit);
        getContentRoot().getChildren().addAll(newGame, exit);
    }
}

public class MyGameMenu extends FXGLMenu {
    public MyGameMenu() {
        super(MenuType.GAME_MENU);
        Button resume = getUIFactoryService().newButton("Resume", this::fireResume);
        Button quit   = getUIFactoryService().newButton("Quit",   this::fireExitToMainMenu);
        getContentRoot().getChildren().addAll(resume, quit);
    }
}

// 2. Create SceneFactory
public class MySceneFactory extends SceneFactory {
    @Override public FXGLMenu newMainMenu() { return new MyMainMenu(); }
    @Override public FXGLMenu newGameMenu() { return new MyGameMenu(); }
}

// 3. Register
settings.setSceneFactory(new MySceneFactory());
settings.setMainMenuEnabled(true);
settings.setGameMenuEnabled(true);
```

## Dialog Boxes

```java
// Message (with optional callback on close)
getDialogService().showMessageBox("Level complete!", () -> loadNextLevel());

// Confirm (callback receives true/false)
getDialogService().showConfirmationBox("Start new game?", yes -> {
    if (yes) getGameController().startNewGame();
});

// Text input (callback receives the entered string)
getDialogService().showInputBox("Enter your name:", playerName -> {
    set("playerName", playerName);
});

// Input with validation
getDialogService().showInputBoxWithPredicate("Enter a number:", input ->
        input.matches("\\d+"), numStr -> set("level", Integer.parseInt(numStr)));

// Error
getDialogService().showErrorBox("Failed to load save file!", () -> {});

// Progress (use for async tasks)
IOTask<Result> task = new IOTask<Result>("Loading...") {
    @Override protected Result onExecute() throws Exception { return heavyLoad(); }
};
getDialogService().showProgressBox("Loading level...", task, result -> {
    applyResult(result);
});
```

## GameSubScene — Modal Overlay

Use SubScenes for shop screens, pause menus, inventory, etc.

```java
public class ShopSubScene extends GameSubScene {
    public ShopSubScene() {
        // Build UI in constructor or onOpen()
        Text title = getUIFactoryService().newText("Shop", Color.GOLD, 36.0);
        Button close = getUIFactoryService().newButton("Close", this::close);
        getRoot().getChildren().addAll(title, close);
        // Add background
        getRoot().setStyle("-fx-background-color: rgba(0,0,0,0.8);");
    }

    @Override
    public void onOpen() {
        // populate shop items
    }

    private void close() {
        getSceneService().popSubScene();
    }
}

// Open from collision handler or button press
ShopSubScene shop = new ShopSubScene();
getSceneService().pushSubScene(shop);
```

## Viewport & Camera-Follow

```java
Viewport vp = getGameScene().getViewport();

// Follow an entity (typical usage: follow player)
Entity player = getGameWorld().getSingleton(e -> e.isType(EntityType.PLAYER));
vp.bindToEntity(player, getAppWidth() / 2.0, getAppHeight() / 2.0);

// Smooth (lazy) follow
vp.setLazy(true);

// Clamp to level bounds (set after level is loaded)
vp.setBounds(-50, -50, levelWidth + 50, levelHeight + 50);

// Zoom
vp.setZoom(1.5);   // 1.5× zoomed in

// Manual scroll (e.g., in cutscene)
vp.setX(500);
vp.setY(200);

// Unbind and reset
vp.unbind();
vp.setX(0); vp.setY(0);
```

## Push Notification (Toast)

```java
// Requires NotificationService
settings.addEngineService(NotificationService.class);

getNotificationService().pushNotification("Achievement Unlocked: First Kill!");
// Notification appears at top of screen and auto-dismisses
```

## FXML Integration

```java
// assets/ui/shop.fxml
@Override
protected void initUI() {
    UIFactoryService ui = getUIFactoryService();
    Node shopUI = ui.loadUI("shop.fxml");         // path relative to assets/ui/
    ShopController ctrl = ui.getControllerFor(shopUI);
    ctrl.setInventory(playerInventory);
    addUINode(shopUI, 200, 100);
}

// Controller class (standard JavaFX controller)
public class ShopController {
    @FXML private ListView<Item> itemList;
    public void setInventory(Inventory<Item> inv) {
        itemList.setItems(inv.getItems());
    }
}
```

## Custom CSS

```java
// Place stylesheet at: assets/ui/my-style.css
settings.setCSSList(List.of("my-style.css"));

// Or apply at runtime to a specific node
node.getStyleClass().add("my-button");
// CSS:  .my-button { -fx-background-color: #ff0000; -fx-text-fill: white; }
```

## Nine-Slice Scalable Image

```java
// Scales image corners intact, stretches only center/edges
NineSliceImageView nineSlice = new NineSliceImageView(
        getAssetLoader().loadImage("ui/panel.png"),
        20, 20, 20, 20  // insets: top, right, bottom, left
);
nineSlice.setPrefSize(400, 300);   // resize without distorting corners
addUINode(nineSlice, 50, 50);
```

## Scrolling Background

```java
// Adds to UI layer, scrolls based on viewport movement
// Self-scrolling (auto-moves independent of viewport):
addUINode(new SelfScrollingBackgroundView(
        getAssetLoader().loadTexture("bg/clouds.png"),
        ScrollingBackgroundView.Direction.LEFT, 30.0), 0, 0);

// Viewport-coupled (parallax):
ScrollingBackgroundView bg = new ScrollingBackgroundView(
        getAssetLoader().loadTexture("bg/mountains.png"),
        getAppWidth(), getAppHeight(), 0.3);  // 0.3 = parallax factor
addUINode(bg, 0, 0);
```

## Minimap

```java
MinimapView minimap = new MinimapView(getGameWorld(), getGameScene().getViewport(),
        200, 150);   // minimap size in pixels
minimap.setBackgroundColor(Color.color(0, 0, 0, 0.5));
addUINode(minimap, getAppWidth() - 220, 20);  // top-right corner
```

## Gotchas

- **HUD nodes use screen coordinates, NOT world coordinates** — `addUINode(node, 50, 50)` places
  the node 50px from the top-left of the window, regardless of viewport scroll.
- **`initUI()` runs after `initGame()`** — access world state freely here. The reverse is
  not safe.
- **`GameSubScene` pushed on top suspends the game loop** only if `isPausedWhenOpen()` returns
  true (default is true). Override it to return false for non-pausing overlays like inventory.
- **FXML files must be in `assets/ui/`** and their controllers must be in a package
  on the class path. Use `ui.getControllerFor(node)` only once per node load.
- **Viewport bounds must be set AFTER `setLevelFromMap()`** because level dimensions are
  only known after the level loads.
- **Minimap performance** degrades with thousands of entities. Filter what's shown:
  `minimap.setEntityFilter(e -> e.isType(PLAYER, ENEMY))`.
- **`SceneFactory` must be set in `initSettings()`** — it cannot be changed at runtime.
- **Custom menu must call `fireNewGame()` / `fireExit()` etc.** (inherited methods) rather
  than `getGameController()` directly to ensure proper scene transitions.
