# Game Type — Roguelike / Roguelite

Covers run-based games with procedural generation, permadeath, and meta-progression. Each run is unique; death resets the run but some permanent unlocks persist.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-RL-1\nRun structure: generate level, play, die, repeat"]
    Dev --> UC2["UC-RL-2\nPermadeath: full run reset on death"]
    Dev --> UC3["UC-RL-3\nProcedural dungeon each run"]
    Dev --> UC4["UC-RL-4\nRNG loot table item drops"]
    Dev --> UC5["UC-RL-5\nOffers: choose 1 of 3 random items"]
    Dev --> UC6["UC-RL-6\nMeta-progression: permanent unlocks"]
    Dev --> UC7["UC-RL-7\nRun stats tracking (kills, gold, floors)"]
    Dev --> UC8["UC-RL-8\nBossed milestone every N floors"]
    Dev --> UC9["UC-RL-9\nItem synergies (items modify each other)"]
    Dev --> UC10["UC-RL-10\nCurse mechanic: negative item side-effects"]
```

## Run Lifecycle

```mermaid
stateDiagram-v2
    [*] --> MainMenu
    MainMenu --> RunStart : New Run
    RunStart --> GenerateFloor : enter dungeon
    GenerateFloor --> FloorPlay : floor ready
    FloorPlay --> GenerateFloor : reach stairs to next floor
    FloorPlay --> RunEnd : player dies
    FloorPlay --> Victory : final boss defeated
    RunEnd --> RecordStats : save run results
    RecordStats --> UnlockCheck : check meta unlock conditions
    UnlockCheck --> MainMenu : return
    Victory --> RecordStats
```

## Permadeath State Reset

```mermaid
flowchart TD
    PlayerDeath["player HP = 0"] --> SaveRunStats["save kills, gold, floors, seed to leaderboard\n(permanent save file)"]
    SaveRunStats --> CheckUnlocks["check if any meta-progression unlock achieved"]
    CheckUnlocks --> ResetRunState["clear all run-scoped state:\n• inventory\n• current stats\n• current floor\n• run-specific flags"]
    ResetRunState --> ShowDeathScreen["show death summary screen\nwith run stats"]
```

## RNG Loot Table

```mermaid
flowchart LR
    EnemyDied["enemy defeated"] --> RollDrop["random(0..100)"]
    RollDrop --> |0-40| Nothing["no drop"]
    RollDrop --> |41-70| Gold["drop gold (random amount)"]
    RollDrop --> |71-90| CommonItem["pick random common item\nfrom commons table"]
    RollDrop --> |91-99| RareItem["pick random rare item"]
    RollDrop --> |100| LegendaryItem["pick random legendary item"]
```

## Item Offer Screen

```mermaid
flowchart TD
    EnterRoom["player enters item room"] --> RollThree["pick 3 items from weighted pool\n(exclude already-owned unique items)"]
    RollThree --> ShowOffers["show 3 item cards\nwith name + description"]
    ShowOffers --> PlayerPicks["player clicks one"]
    PlayerPicks --> AddToInventory["add item, apply passive effects\ndiscard remaining offers"]
```

## Meta-Progression

```mermaid
flowchart LR
    RunComplete["run ends (win or loss)"] --> EarnMeta["earn meta-currency\n(= floors cleared × difficulty)"]
    EarnMeta --> Persist["save to PERMANENT save file\n(separate from run save)"]
    Persist --> UnlockShop["spend meta-currency to unlock:\n• starting items\n• new character classes\n• harder difficulty modes"]
```
