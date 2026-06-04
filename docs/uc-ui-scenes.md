# Use Cases — UI & Scene Management

Covers HUD elements, custom menus, dialogs, notifications, sub-scenes, viewport, and camera follow.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])
    Player([Player])

    Dev --> UC1["UC-UI-1\nAdd UI node to HUD"]
    Dev --> UC2["UC-UI-2\nCreate custom main menu"]
    Dev --> UC3["UC-UI-3\nCreate custom game menu (pause)"]
    Dev --> UC4["UC-UI-4\nShow message dialog"]
    Dev --> UC5["UC-UI-5\nShow confirmation dialog"]
    Dev --> UC6["UC-UI-6\nShow input dialog"]
    Dev --> UC7["UC-UI-7\nPush notification"]
    Dev --> UC8["UC-UI-8\nCreate GameSubScene (overlay)"]
    Dev --> UC9["UC-UI-9\nBind text to game variable"]
    Dev --> UC10["UC-UI-10\nSet viewport to follow entity"]
    Dev --> UC11["UC-UI-11\nAdd FXML-based UI"]
    Dev --> UC12["UC-UI-12\nApply custom CSS stylesheet"]
    Dev --> UC13["UC-UI-13\nUse nine-slice scalable image"]
    Dev --> UC14["UC-UI-14\nOpen MDI window"]
    Dev --> UC15["UC-UI-15\nAdd scrolling background"]
    Dev --> UC16["UC-UI-16\nAdd minimap view"]
    Dev --> UC17["UC-UI-17\nCustom loading / startup / intro scene"]

    Player -->|sees| UC7
    Player -->|interacts with| UC4
    Player -->|interacts with| UC5
```

## HUD Node Addition

```mermaid
flowchart LR
    A["FXGL.addUINode(node)"] --> B["placed at 0,0 on screen"]
    C["FXGL.addUINode(node, x, y)"] --> D["placed at x,y on screen"]
    E["FXGL.removeUINode(node)"] --> F["removes from HUD"]
    G["FXGL.addVarText('score', x, y)"] --> H["Text bound to variable 'score'"]
    I["FXGL.addText('Hello', x, y)"] --> J["static text on HUD"]
```

## Scene Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Startup : app launch
    Startup --> Intro : if intro enabled
    Intro --> MainMenu : intro finishes
    MainMenu --> Loading : start new game
    Loading --> GamePlay : loading done
    GamePlay --> GameMenu : ESC pressed
    GameMenu --> GamePlay : resume
    GameMenu --> MainMenu : quit to menu
    GamePlay --> [*] : exit
```

## Custom Menu via SceneFactory

```mermaid
flowchart TD
    Dev([Developer]) --> SF["Extend SceneFactory"]
    SF --> NewMainMenu["override newMainMenu()\n→ return FXGLMenu subclass"]
    SF --> NewGameMenu["override newGameMenu()\n→ return FXGLMenu subclass"]
    Dev --> Register["settings.setSceneFactory(new MySceneFactory())"]
    Dev --> MenuItems["settings.setEnabledMenuItems(EnumSet.of(MenuItem.NEW_GAME, ...))"]
```

## Dialog Use Cases

```mermaid
graph TD
    DS["DialogService"] --> Msg["showMessageBox(text)\nshowMessageBox(text, callback)"]
    DS --> Confirm["showConfirmationBox(text, consumer)"]
    DS --> Input2["showInputBox(text, consumer)"]
    DS --> InputP["showInputBoxWithPredicate(text, pred, consumer)"]
    DS --> Error2["showErrorBox(error)"]
    DS --> Progress["showProgressBox(title, task, callback)"]
    DS --> AndWait["showAndWait(dialog)"]
```

## GameSubScene (Overlay) Use Case

```mermaid
flowchart LR
    Dev([Developer]) --> GSS["Extend GameSubScene"]
    GSS --> Init["override onOpen() – build UI"]
    GSS --> Close["FXGL.getSceneService().popSubScene()"]
    Dev --> Push["FXGL.getSceneService().pushSubScene(mySubScene)"]
    Push --> Overlay["Rendered on top of GameScene\nEngine paused underneath by default"]
```

## Viewport & Camera Follow

```mermaid
flowchart TD
    VP["FXGL.getGameScene().getViewport()"] --> Follow["viewport.bindToEntity(entity, x, y)"]
    VP --> Lazy["viewport.setLazy(true) — smooth follow"]
    VP --> Bounds["viewport.setBounds(minX, minY, maxX, maxY)"]
    VP --> Zoom["viewport.setZoom(factor)"]
    VP --> Manual["viewport.setX(x) / setY(y) — manual scroll"]
```

## Notification Use Case

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant NotificationService

    Dev->>NotificationService: pushNotification("Achievement Unlocked!")
    NotificationService->>GameScene: display toast notification
    NotificationService->>NotificationService: auto-dismiss after timeout
```

## Scrolling & Minimap

```mermaid
graph TD
    Bg["ScrollingBackgroundView\n(manual scroll speed control)"] --> Usage1["addUINode(new ScrollingBackgroundView(texture, speed))"]
    AutoBg["SelfScrollingBackgroundView\n(scrolls automatically each frame)"] --> Usage2["addUINode(new SelfScrollingBackgroundView(texture, speed, direction))"]
    Minimap["MinimapView"] --> Usage3["new MinimapView(gameWorld, viewport, width, height)"]
```

## UIFactory Service

```mermaid
graph TD
    UIF["UIFactoryService"] --> Text["newText(str, color, size)"]
    UIF --> Button["newButton(text, action)"]
    UIF --> Spinner["newSpinner(items)"]
    UIF --> CheckBox["newCheckBox()"]
    UIF --> ProgressBar["newProgressBar(isHorizontal)"]
    UIF --> Icon["newTooltip(text)"]
```
