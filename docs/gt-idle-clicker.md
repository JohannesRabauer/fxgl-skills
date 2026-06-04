# Game Type — Idle / Clicker Game

Covers incremental games (Cookie Clicker, Adventure Capitalist style). Click to generate resources, buy auto-producers, unlock upgrades, offline progress, prestige reset.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-IDLE-1\nClick generates resources (click value)"]
    Dev --> UC2["UC-IDLE-2\nAuto-producers generate resources per second"]
    Dev --> UC3["UC-IDLE-3\nUpgrade system multiplies production"]
    Dev --> UC4["UC-IDLE-4\nOffline progress calculation on load"]
    Dev --> UC5["UC-IDLE-5\nBig number formatting (K, M, B, T)"]
    Dev --> UC6["UC-IDLE-6\nUnlock new producers as milestones reached"]
    Dev --> UC7["UC-IDLE-7\nPrestige: reset for permanent bonus"]
    Dev --> UC8["UC-IDLE-8\nAchievements for milestones (1K clicks, etc.)"]
    Dev --> UC9["UC-IDLE-9\nPassive income visible in HUD (per-second rate)"]
    Dev --> UC10["UC-IDLE-10\nSave every 30 seconds, load on startup"]
```

## Core Production Loop

```mermaid
flowchart TD
    ClickButton["player clicks main button"] --> AddClickValue["resources += clickValue\n(base 1 × clickUpgradeMultiplier)"]
    AutoTimer["timer: every 1 second"] --> AddPassive["resources += totalPassivePerSecond\n(sum of all producers × their rate × upgrades)"]
    Resources["resources total"] --> Spend["spend on: producers, upgrades, prestige"]
```

## Producer System

```mermaid
flowchart LR
    Producer["Producer: cursor, grandma, farm, factory..."] --> Owned["owned: int (how many purchased)"]
    Producer --> BaseRate["baseRate: double (resources per second each)"]
    Producer --> Cost["cost: base × 1.15^owned (exponential scaling)"]
    Producer --> Contribution["contribution = owned × baseRate × upgradeMultiplier"]
    Producer --> TotalPassive["totalPassivePerSecond = sum of all producer contributions"]
```

## Upgrade System

```mermaid
flowchart TD
    UpgradeList["List of available upgrades\neach: name, cost, condition, effect"] --> CheckCondition["upgrade.unlockCondition:\n  e.g. owned('cursor') >= 1\n  or totalClicks >= 100"]
    CheckCondition --> |condition met| ShowInShop["upgrade appears in shop"]
    ShowInShop --> PlayerBuys["deduct cost\napply effect:\n  cursorRate × 2, or\n  clickValue += flat bonus, or\n  all buildings × 0.01 per cursor owned"]
```

## Offline Progress

```mermaid
flowchart LR
    LoadGame["game loads"] --> ReadTimestamp["read lastSaveTime from save file"]
    ReadTimestamp --> CalcElapsed["elapsed = currentTime - lastSaveTime\ncap at 8 hours (offline cap)"]
    CalcElapsed --> CalcOfflineGain["offlineGain = totalPassivePerSecond × elapsed\n× offlineEfficiencyMultiplier (default 0.5)"]
    CalcOfflineGain --> ApplyGain["resources += offlineGain\nshow popup: 'You earned X while away!'"]
```

## Big Number Formatting

```mermaid
flowchart TD
    Number["double value"] --> Format["format function:"]
    Format --> |value < 1000| Ones["'123'"]
    Format --> |value < 1e6| Thousands["'12.3K'"]
    Format --> |value < 1e9| Millions["'45.6M'"]
    Format --> |value < 1e12| Billions["'7.89B'"]
    Format --> |value >= 1e12| Trillions["'1.23T'"]
```

## Prestige System

```mermaid
flowchart LR
    PrestigeButton["prestige available if\nresources >= prestigeThreshold"] --> ShowConfirm["confirm dialog:\n'Reset all progress for +X% permanent bonus?'"]
    ShowConfirm --> |confirm| CalcBonus["prestigeBonus += floor(log10(resources) - 5) × 2%"]
    CalcBonus --> ResetRun["resources = 0\nproducers.forEach(p -> p.owned = 0)\nupgrades cleared"]
    ResetRun --> SavePrestige["save prestigeBonus and prestigeCount\napply bonus to clickValue and baseRates"]
```
