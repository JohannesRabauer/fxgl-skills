# Use Cases — Mini-Game System

Covers the six built-in mini-games: LockPicking, SweetSpot, TriggerMash, TriggerSequence,
CircuitBreaker, and RandomOccurrence.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])
    Player([Player])

    Dev --> UC1["UC-MG-1\nLaunch lock-picking mini-game"]
    Dev --> UC2["UC-MG-2\nLaunch sweet-spot mini-game"]
    Dev --> UC3["UC-MG-3\nLaunch trigger-mash mini-game (button spam)"]
    Dev --> UC4["UC-MG-4\nLaunch trigger-sequence mini-game (QTE)"]
    Dev --> UC5["UC-MG-5\nLaunch circuit-breaker mini-game"]
    Dev --> UC6["UC-MG-6\nLaunch random-occurrence mini-game"]
    Dev --> UC7["UC-MG-7\nHandle mini-game result (success / fail)"]
    Dev --> UC8["UC-MG-8\nCustomise mini-game difficulty"]

    Player --> UC1
    Player --> UC2
    Player --> UC3
    Player --> UC4
    Player --> UC5
    Player --> UC6
```

## MiniGameService Registration

```mermaid
flowchart LR
    Reg2["settings.addEngineService(MiniGameService.class)"] --> SVC["getMiniGameService()"]
    SVC --> Start4["startMiniGame(miniGame, onResult)"]
    Start4 --> Result["MiniGameResult\n.isSuccess() → boolean\n.getVars() → extra data"]
```

## Mini-Game Catalogue

```mermaid
graph TD
    MiniGames["Built-in Mini-Games"] --> LockPick["LockPickMiniGame\n• rotate lock pick to sweet spot\n• skill: fine motor precision\n• result: LockPickResult (success/pins set)"]
    MiniGames --> SweetSpot["SweetSpotMiniGame\n• stop moving bar in target zone\n• configurable zone size\n• result: SweetSpotResult (score)"]
    MiniGames --> TrigMash["TriggerMashMiniGame\n• mash button before timer runs out\n• configurable time + required presses\n• result: success if count reached"]
    MiniGames --> TrigSeq["TriggerSequenceMiniGame\n• input exact key sequence in order\n• configurable sequence length\n• result: success if full sequence correct"]
    MiniGames --> Circuit["CircuitBreakerMiniGame\n• navigate a maze of circuits\n• configurable complexity\n• result: success if goal reached"]
    MiniGames --> RandOcc["RandomOccurrenceMiniGame\n• timed random event\n• player reacts to visual cue\n• result: success if reacted in time"]
```

## Mini-Game Invocation Pattern

```mermaid
flowchart TD
    Trigger2["Player opens chest / door / hacks terminal"] --> Start5["getMiniGameService()\n.startMiniGame(\n  new LockPickMiniGame(),\n  result -> {\n    if(result.isSuccess())\n      openChest();\n    else\n      failAttempt();\n  }\n)"]
    Start5 --> Overlay2["MiniGameView overlays GameScene\nGame loop continues or pauses"]
    Overlay2 --> Done["result callback called on completion"]
```

## Sweet Spot Mini-Game Flow

```mermaid
flowchart LR
    A["Bar oscillates left-right"] --> B["Player presses SPACE at right moment"]
    B --> C{In sweet zone?}
    C -->|yes| D["SweetSpotResult.SUCCESS\nzone size determines difficulty"]
    C -->|no| E["SweetSpotResult.FAIL"]
```

## Trigger Sequence (QTE) Flow

```mermaid
sequenceDiagram
    participant Game
    participant Player2 as Player

    Game->>Player2: show key sequence [W, A, S, D, SPACE]
    Player2->>Game: press W ✓
    Player2->>Game: press A ✓
    Player2->>Game: press S ✓
    Player2->>Game: press X ✗ wrong key
    Game-->>Player2: FAIL result
```

## Custom Mini-Game (Extensibility)

```mermaid
flowchart TD
    Dev([Developer]) --> Extend["Extend MiniGame<T extends MiniGameResult>"]
    Extend --> Override2["override createView() → MiniGameView"]
    Extend --> Override3["override onUserAction(action) → update state"]
    Extend --> Override4["setResult(myResult) when done"]
    Extend --> Register2["getMiniGameService().startMiniGame(myMiniGame, handler)"]
```
