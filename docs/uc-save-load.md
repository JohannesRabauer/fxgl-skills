# Use Cases — Save & Load

Covers the SaveLoadService, data serialisation, slot-based saves, and save-game variable persistence.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])
    Player([Player])

    Dev --> UC1["UC-SAV-1\nSave current game state to slot"]
    Dev --> UC2["UC-SAV-2\nLoad game state from slot"]
    Dev --> UC3["UC-SAV-3\nList available save slots"]
    Dev --> UC4["UC-SAV-4\nDelete a save slot"]
    Dev --> UC5["UC-SAV-5\nAuto-save on checkpoint"]
    Dev --> UC6["UC-SAV-6\nSave arbitrary game variables"]
    Dev --> UC7["UC-SAV-7\nSave custom object (serialisable)"]
    Dev --> UC8["UC-SAV-8\nLoad game from main menu"]

    Player --> UC1
    Player --> UC2
    Player --> UC8
```

## SaveLoadService API

```mermaid
flowchart TD
    SLS["SaveLoadService"] --> Save["saveFileTask(fileName)\n→ writes DataFile to disk"]
    SLS --> Load["readSaveFileTask(fileName)\n→ reads DataFile from disk"]
    SLS --> List["saveFiles() → List of save file names"]
    SLS --> Delete["deleteSaveFileTask(fileName)"]
    SLS --> Exists["saveFileExists(fileName)"]
```

## Save Game Data Flow

```mermaid
flowchart LR
    Override["Override in GameApplication"] --> Write["writeSaveState(DataFile file){\n  file.getData().put('score', geti('score'));\n  file.getData().put('level', geti('currentLevel'));\n}"]
    Override --> Read["readSaveState(DataFile file){\n  set('score', file.getData().get('score'));\n  set('currentLevel', file.getData().get('level'));\n}"]

    Write --> SLS2["SaveLoadService.saveFileTask(name).run()"]
    SLS2 --> Disk["~/.fxgl/{AppTitle}/saves/{name}.dat"]

    Disk --> Load2["SaveLoadService.readSaveFileTask(name)"]
    Load2 --> Read
```

## Slot-Based Save System Pattern

```mermaid
flowchart TD
    Dev([Developer]) --> Slots["Define N save slots\ne.g. 'save1', 'save2', 'save3'"]
    Slots --> UI2["Show save/load screen\n(GameSubScene or dialog)"]
    UI2 --> Select["Player selects slot"]
    Select --> SaveOp["getSaveLoadService()\n.saveFileTask(slotName).run()"]
    Select --> LoadOp["getSaveLoadService()\n.readSaveFileTask(slotName).run()"]
```

## Auto-Save on Checkpoint

```mermaid
sequenceDiagram
    participant Entity as Checkpoint Entity
    participant CollisionHandler
    participant SaveLoadService

    Entity-->>CollisionHandler: player collides with checkpoint
    CollisionHandler->>CollisionHandler: mark checkpoint activated
    CollisionHandler->>SaveLoadService: saveFileTask("autosave").run()
    SaveLoadService-->>CollisionHandler: save complete
```

## Save Game Variables (SaveGameVars pattern)

```mermaid
flowchart TD
    Annotate["@SaveGame\nfields in DataComponent"] --> Auto["FXGL serialises annotated fields automatically"]
    Auto --> Note2["Fields must be serialisable types\n(int, double, String, List, Map)"]

    Manual["Manual approach:\nwriteSaveState() / readSaveState()\ncomplete developer control"] --> Note3["Works with any DataFile.getData() Map"]
```

## Integration with Menu System

```mermaid
flowchart LR
    Menu["FXGLMenu built-in"] --> SaveTrigger["saveGame(DataFile)"]
    Menu --> LoadTrigger["loadGame(DataFile)"]
    SaveTrigger --> Delegate["delegates to\nGameApplication.writeSaveState()"]
    LoadTrigger --> Delegate2["delegates to\nGameApplication.readSaveState()"]
```
