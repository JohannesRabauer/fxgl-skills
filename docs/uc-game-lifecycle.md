# Use Cases — Game Application Lifecycle

Covers the bootstrap process, lifecycle hooks, settings configuration, and application modes.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])
    Engine([FXGL Engine])

    Dev -->|"UC-1 Create minimal game"| CreateGame["Create GameApplication subclass"]
    Dev -->|"UC-2 Configure window & title"| InitSettings["Override initSettings()"]
    Dev -->|"UC-3 Declare game variables"| InitVars["Override initGameVars()"]
    Dev -->|"UC-4 Register input actions"| InitInput["Override initInput()"]
    Dev -->|"UC-5 Build initial world"| InitGame["Override initGame()"]
    Dev -->|"UC-6 Configure physics world"| InitPhysics["Override initPhysics()"]
    Dev -->|"UC-7 Assemble HUD"| InitUI["Override initUI()"]
    Dev -->|"UC-8 Implement game loop"| OnUpdate["Override onUpdate(tpf)"]
    Dev -->|"UC-9 Register engine services"| AddService["settings.addEngineService()"]
    Dev -->|"UC-10 Choose app mode"| AppMode["ApplicationMode: DEV / RELEASE"]

    Engine -->|"drives"| OnUpdate
    Engine -->|"calls in order"| InitSettings
    Engine -->|"calls in order"| InitVars
    Engine -->|"calls in order"| InitInput
    Engine -->|"calls in order"| InitGame
    Engine -->|"calls in order"| InitPhysics
    Engine -->|"calls in order"| InitUI
```

## Game Initialisation Order

```mermaid
flowchart TD
    A([launch]) --> B["initSettings(GameSettings)"]
    B --> C["initGameVars(Map vars)"]
    C --> D["initInput()"]
    D --> E["initGame()"]
    E --> F["initPhysics()"]
    F --> G["initUI()"]
    G --> H{{"Game Loop Running"}}
    H -->|"every frame"| I["onUpdate(tpf)"]
    I --> H
```

## Settings Configuration Use Cases

```mermaid
graph TD
    Settings["GameSettings"]

    Settings --> Window["Window\n• setWidth / setHeight\n• setTitle\n• setFullScreenAllowed\n• setFullScreenFromStart"]
    Settings --> Menu["Menu\n• setMainMenuEnabled\n• setGameMenuEnabled\n• setEnabledMenuItems\n• setSceneFactory"]
    Settings --> Mode["Mode\n• setApplicationMode DEV/RELEASE\n• setDeveloperMenuEnabled\n• setProfilingEnabled"]
    Settings --> Platform["Platform\n• isDesktop / isMobile / isBrowser"]
    Settings --> Services["Services\n• addEngineService(class)\n• Custom service injection"]
    Settings --> Achievements["Achievements\n• getAchievements().add(Achievement)"]
    Settings --> Credits["Credits\n• getCredits().add(line)"]
```

## Embedded & Special Modes

```mermaid
graph LR
    Dev([Developer])

    Dev --> Standalone["Standalone App\nGameApplication.launch()"]
    Dev --> Embedded["Embedded in JavaFX\nEmbeddedGameApplication\n+ JavaFX Stage"]
    Dev --> Headless["Headless / Test\nFXGLMock / fxgl-test module"]
    Dev --> GameCtrl["Programmatic Control\ngetGameController().startNewGame()\ngetGameController().exit()"]
```

## Custom Engine Service Use Case

```mermaid
flowchart LR
    Dev([Developer]) -->|"1 Extend"| ES["EngineService"]
    ES -->|"2 Annotate methods"| Hooks["@OnInit\n@OnUpdate\n@OnExit"]
    Dev -->|"3 Register"| Reg["settings.addEngineService(MyService.class)"]
    Reg -->|"4 Retrieve at runtime"| Get["FXGL.getService(MyService.class)"]
```
