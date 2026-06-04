# Use Cases — Developer Tools & Debugging

Covers the developer menu, in-game console, entity inspector, profiler, debug camera,
application modes, and graph visualisation.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-DEV-1\nEnable developer menu (F1 overlay)"]
    Dev --> UC2["UC-DEV-2\nUse in-game console for commands"]
    Dev --> UC3["UC-DEV-3\nInspect entity components at runtime"]
    Dev --> UC4["UC-DEV-4\nProfile FPS and memory usage"]
    Dev --> UC5["UC-DEV-5\nSwitch to debug camera (pan/zoom freely)"]
    Dev --> UC6["UC-DEV-6\nPush debug message to console"]
    Dev --> UC7["UC-DEV-7\nVisualize entity bounding boxes"]
    Dev --> UC8["UC-DEV-8\nVisualize collision shapes"]
    Dev --> UC9["UC-DEV-9\nVisualize pathfinding grid"]
    Dev --> UC10["UC-DEV-10\nSet application mode (DEV vs RELEASE)"]
    Dev --> UC11["UC-DEV-11\nGraph / visualise data at runtime"]
    Dev --> UC12["UC-DEV-12\nView world properties in dev pane"]
```

## Enabling Dev Tools

```mermaid
flowchart TD
    Enable["initSettings"] --> DevMenu["settings.setDeveloperMenuEnabled(true)\n→ shows dev pane on F1"]
    Enable --> ProfEn["settings.setProfilingEnabled(true)\n→ shows FPS/memory overlay"]
    Enable --> AppMd["settings.setApplicationMode(ApplicationMode.DEVELOPER)\n→ extra logging, no obfuscation"]
    Enable --> Release["settings.setApplicationMode(ApplicationMode.RELEASE)\n→ disables dev features for end users"]
```

## Developer Menu (DevPane) Contents

```mermaid
graph TD
    DevPane2["DevPane (F1 key)"] --> Props2["World Properties\n• shows all game variables\n• editable at runtime"]
    DevPane2 --> EntityList["Entity list\n• shows all active entities\n• click to inspect"]
    DevPane2 --> Physics2["Physics debug\n• toggle bounding box visualisation\n• show collision shapes"]
    DevPane2 --> Custom4["Custom dev buttons\n(register via DevService)"]
```

## Entity Inspector Use Case

```mermaid
flowchart LR
    Click["Click entity in DevPane"] --> Inspector["EntityInspector window"]
    Inspector --> CompList["List all components with type name"]
    Inspector --> Props3["Show component field values"]
    Inspector --> Live["Values update live each frame"]
```

## In-Game Console

```mermaid
flowchart TD
    Console3["Console (accessible in DEV mode)"] --> Register3["getDevService().registerCommand(\n  'spawnEnemy',\n  args -> spawn('enemy', ...)\n)"]
    Console3 --> Input5["player types command in console"]
    Input5 --> Execute2["command executed at runtime\nno recompile needed"]
    Console3 --> Push2["FXGL.debug('message')\n→ appears in console log"]
```

## Profiler Window

```mermaid
flowchart LR
    PW["ProfilerWindow"] --> FPS["FPS counter (avg, min, max)"]
    PW --> Memory["heap memory usage"]
    PW --> Entities3["entity count"]
    PW --> Physics3["physics step duration"]
    PW --> Render6["render duration per frame"]
    PW --> Toggle["toggle via profiler button\nor settings.setProfilingEnabled(true)"]
```

## Debug Camera Use Case

```mermaid
flowchart LR
    DC["DebugCameraScene"] --> Activate["DevService activates debug camera\nvia dev menu shortcut"]
    DC --> Pan["drag middle-mouse to pan world view"]
    DC --> Zoom2["scroll wheel to zoom in/out"]
    DC --> Return["press key to return to game camera"]
```

## Bounding Box Visualisation

```mermaid
flowchart TD
    Dev([Developer]) --> Enable2["getPhysicsWorld()\n.setShowBoundingBoxes(true)"]
    Enable2 --> DrawBBox["draws entity hitboxes in different colors:\n• DYNAMIC: green\n• STATIC: blue\n• SENSOR: yellow"]
    Dev --> EntityBBox["entity.getBoundingBoxComponent()\n.visualise() for single entity"]
```

## Graph Visualisation Use Case

```mermaid
flowchart LR
    Dev([Developer]) --> GV["GraphVisSample:\nvisualize node graphs at runtime"]
    GV --> Nodes["add Node objects with positions"]
    GV --> Edges["add Edge objects between nodes"]
    GV --> Render7["rendered as circles + lines\nin game scene for visual debugging"]
    GV --> Uses["use cases:\n• pathfinding graphs\n• dialogue trees\n• state machines\n• quest dependency graphs"]
```

## Application Mode Comparison

```mermaid
graph TD
    Modes["ApplicationMode"] --> Developer["DEVELOPER\n• dev menu available\n• verbose logging\n• profiling on\n• no exception suppression"]
    Modes --> Debug2["DEBUG\n• extra assertion checks\n• verbose output\n• shows dev tools"]
    Modes --> Release2["RELEASE\n• dev menu hidden\n• logging minimal\n• profiling off\n• exceptions handled gracefully\n• obfuscation ready"]
```

## Custom Dev Commands Pattern

```mermaid
flowchart TD
    Dev([Developer]) --> Reg4["getDevService().registerCommand('godMode', args -> {"]
    Reg4 --> Impl["  set('health', Integer.MAX_VALUE);\n  getPlayer().getComponent(PhysicsComponent.class)\n    .setBodyType(BodyType.STATIC);\n})"]
    Impl --> Test["type 'godMode' in console → instant test of edge cases"]
```
