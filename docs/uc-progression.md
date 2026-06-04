# Use Cases — Achievements & Quests

Covers variable-driven achievement tracking, the AchievementService, quest objectives, and the QuestService.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])
    Player([Player])

    Dev --> UC1["UC-ACH-1\nDefine achievement (variable threshold)"]
    Dev --> UC2["UC-ACH-2\nListen for achievement unlocked event"]
    Dev --> UC3["UC-ACH-3\nDisplay achievement notification"]
    Dev --> UC4["UC-ACH-4\nQuery list of achievements + status"]
    Dev --> UC5["UC-ACH-5\nPersist achievement progress across sessions"]

    Dev --> UC6["UC-QST-1\nCreate a quest with objectives"]
    Dev --> UC7["UC-QST-2\nAdd integer / boolean objective"]
    Dev --> UC8["UC-QST-3\nStart / complete / fail a quest"]
    Dev --> UC9["UC-QST-4\nListen for quest state changes"]
    Dev --> UC10["UC-QST-5\nChain objectives (sequential quest)"]

    Player --> UC3
    Player --> UC4
```

## Achievement Definition & Registration

```mermaid
flowchart TD
    Define["initSettings(GameSettings settings)"] --> Add["settings.getAchievements().add(\n  new Achievement(\n    'name',\n    'description',\n    'varName',\n    targetValue\n  )\n)"]
    Add --> Track["FXGL tracks variable 'varName'\nautomatically compares to targetValue"]
    Track --> Unlock["When varName >= targetValue\n→ AchievementEvent.ACHIEVED fired"]
```

## Achievement Event Handling

```mermaid
flowchart LR
    Event["AchievementEvent.ANY"] --> Listen2["FXGL.getEventBus()\n.addEventHandler(AchievementEvent.ANY, e -> {\n  Achievement a = e.getAchievement();\n  showMessage('Unlocked: ' + a.getName());\n})"]
    Listen2 --> Notify2["Typically triggers\npush notification or cutscene"]
```

## Achievement State Machine

```mermaid
stateDiagram-v2
    [*] --> Locked : app start
    Locked --> Active : game started / vars initialised
    Active --> Achieved : tracked variable reaches target
    Achieved --> [*]

    note right of Active
        variable 'enemiesKilled' increments
        each time enemy dies
    end note
```

## Quest Creation & Lifecycle

```mermaid
flowchart TD
    Register["settings.addEngineService(QuestService.class)"] --> Create["getQuestService().newQuest('Delivery Quest')"]
    Create --> Obj1["quest.addIntObjective('Collect 10 coins', 'coins', 10)"]
    Create --> Obj2["quest.addBooleanObjective('Open chest', 'chestOpened', true)"]
    Obj1 --> Start["getQuestService().startQuest(quest)"]
    Start --> Track2["objectives auto-track variable changes"]
    Track2 --> State2["quest.stateProperty() observable\nSTART → ACTIVE → COMPLETED / FAILED"]
```

## Quest State Machine

```mermaid
stateDiagram-v2
    [*] --> IDLE : quest created
    IDLE --> ACTIVE : startQuest(quest)
    ACTIVE --> COMPLETED : all objectives satisfied
    ACTIVE --> FAILED : failure condition met
    COMPLETED --> [*]
    FAILED --> [*]
```

## Quest Objective Types

```mermaid
graph TD
    QO["Quest Objectives"] --> IntObj["addIntObjective(description, varName, targetValue)\nCompleted when varName >= target"]
    QO --> BoolObj["addBooleanObjective(description, varName, targetValue)\nCompleted when varName == target"]
    IntObj --> Observe["Auto-observe variable via property binding"]
    BoolObj --> Observe
```

## Quest State Listener

```mermaid
flowchart LR
    Quest --> Sub["quest.stateProperty()\n.subscribe((old, newState) -> {\n  if(newState == QuestState.COMPLETED)\n    unlockNextArea();\n})"]
    Obj3["objective.completedProperty()\n.addListener((obs, old, newVal) -> {\n  if(newVal) markOnMap();\n})"] --> Track3["per-objective tracking"]
```

## Achievement + Quest Integration Pattern

```mermaid
flowchart TD
    Var["World variable 'questsCompleted'"] --> Quest2["QuestService completes quest\n→ inc('questsCompleted', 1)"]
    Quest2 --> Ach["Achievement: 'completesCompleted' >= 5\n→ 'Quest Master' achievement unlocked"]
    Ach --> Event2["AchievementEvent fires\n→ notification shown to player"]
```
