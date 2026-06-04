---
name: fxgl-progression
description: >
  Implement achievements and quests in FXGL — define variable-tracked achievements in
  initSettings, listen for AchievementEvent, create quests with int/boolean objectives via
  QuestService, start/fail/complete quests, observe quest state changes, and chain objectives.
  Use this skill when adding an achievement system, implementing quest tracking, wiring
  game variables to unlockable goals, or building a quest log UI.
  Triggers on: "achievement", "quest", "AchievementService", "QuestService", "objective",
  "unlock", "quest log", "player progression", "milestone", "AchievementEvent".
compatibility: Java 17+, FXGL 21.x. QuestService must be registered via addEngineService.
metadata:
  author: fxgl-skills
  version: "1.0"
  fxgl-version: "21.1"
  category: fxgl/progression
allowed-tools: Read Write Edit Bash
---

# FXGL Achievements & Quest System

## Achievements

Achievements are automatically tracked: you declare a variable name and a threshold value,
and FXGL fires `AchievementEvent.ACHIEVED` when the variable reaches or exceeds the target.

### Setup (in initSettings)

```java
@Override
protected void initSettings(GameSettings settings) {
    // Each Achievement(name, description, varName, targetValue)
    settings.getAchievements().add(
        new Achievement("First Blood",   "Kill your first enemy",        "kills",       1));
    settings.getAchievements().add(
        new Achievement("Sharpshooter",  "Score 100 headshots",          "headshots",   100));
    settings.getAchievements().add(
        new Achievement("Speedrunner",   "Complete level 1 in under 60s","level1Time",  0));  // special: check in code
    settings.getAchievements().add(
        new Achievement("Collector",     "Collect 50 coins",             "coinsTotal",  50));
    settings.getAchievements().add(
        new Achievement("Survivor",      "Survive 10 minutes",           "survivalSecs",600));
}
```

### Declare tracked variables (in initGameVars)

```java
@Override
protected void initGameVars(Map<String, Object> vars) {
    vars.put("kills",        0);
    vars.put("headshots",    0);
    vars.put("coinsTotal",   0);
    vars.put("survivalSecs", 0.0);  // updated in onUpdate
}
```

### Listen for unlock events (in initGame)

```java
@Override
protected void initGame() {
    getEventBus().addEventHandler(AchievementEvent.ANY, e -> {
        Achievement a = e.getAchievement();
        // Show notification
        getNotificationService().pushNotification("Achievement: " + a.getName());
        play("sounds/achievement.wav");
        // Log
        System.out.println("Unlocked: " + a.getName() + " — " + a.getDescription());
    });
}
```

### Incrementing Variables to Drive Achievements

```java
// In collision handler
onCollisionBegin(EntityType.BULLET, EntityType.ENEMY, (bullet, enemy) -> {
    inc("kills", +1);      // AchievementService auto-checks "First Blood" threshold
    bullet.removeFromWorld();
    enemy.removeFromWorld();
});

// Survival timer in onUpdate
@Override
protected void onUpdate(double tpf) {
    if (!getb("gameOver")) {
        inc("survivalSecs", tpf);  // AchievementService checks 600s threshold automatically
    }
}
```

### Achievement Status Display

```java
// Query all achievements and their status
getAchievementService().getAchievements().forEach(a -> {
    System.out.printf("%-20s [%s] progress: %d/%d%n",
        a.getName(),
        a.isAchieved() ? "DONE" : "----",
        geti(a.getVarName()),
        a.getVarValue()
    );
});
```

---

## Quest System

### Setup

```java
// Register service
settings.addEngineService(QuestService.class);
```

### Create & Start a Quest

```java
@Override
protected void initGame() {
    // Create quest
    Quest mainQuest = getQuestService().newQuest("The Lost Relic");

    // Add objectives — they auto-track world variables
    QuestObjective killObj = mainQuest.addIntObjective(
        "Defeat the goblin guards",   // display text
        "goblinKills",                // variable to track
        5                             // target value
    );

    QuestObjective fetchObj = mainQuest.addBooleanObjective(
        "Retrieve the relic",
        "relicCollected",
        true
    );

    QuestObjective returnObj = mainQuest.addBooleanObjective(
        "Return to the elder",
        "returnedToElder",
        true
    );

    // Observe overall quest state
    mainQuest.stateProperty().subscribe((old, newState) -> {
        switch (newState) {
            case ACTIVE    -> pushNotification("Quest started: " + mainQuest.getName());
            case COMPLETED -> { grantQuestReward(); pushNotification("Quest complete!"); }
            case FAILED    -> pushNotification("Quest failed.");
        }
    });

    // Observe individual objective
    killObj.completedProperty().addListener((obs, was, now) -> {
        if (now) pushNotification("Goblins defeated! Retrieve the relic.");
    });

    // Start tracking
    getQuestService().startQuest(mainQuest);
}
```

### Completing / Failing Objectives Manually

Most objectives complete automatically when the tracked variable hits its target.
For objectives that don't map 1-to-1 to a single variable, set it manually:

```java
// Trigger the "returnedToElder" boolean objective
onCollisionBegin(EntityType.PLAYER, EntityType.ELDER_NPC, (p, npc) -> {
    if (getb("relicCollected")) {
        set("returnedToElder", true);   // objective auto-completes
    } else {
        startDialogue("elder_noRelic.json");
    }
});

// Fail a quest on game event
onEvent(GameEvent.PLAYER_DIED, e -> {
    getQuestService().getActiveQuests().forEach(q -> {
        if (q.getName().equals("Escort Mission")) {
            getQuestService().failQuest(q);
        }
    });
});
```

### Multiple Concurrent Quests

```java
// Quests run in parallel — each tracks its own variables
Quest sideQuest = getQuestService().newQuest("Herb Collection");
sideQuest.addIntObjective("Collect 10 herbs", "herbsCollected", 10);
sideQuest.stateProperty().subscribe((o, n) -> {
    if (n == QuestState.COMPLETED) grantHerbReward();
});
getQuestService().startQuest(sideQuest);

// List active quests for quest log
List<Quest> active = getQuestService().getActiveQuests();
// List completed quests
List<Quest> completed = getQuestService().getCompletedQuests();
```

### Quest Log UI

```java
public class QuestLogSubScene extends GameSubScene {

    @Override
    public void onOpen() {
        VBox log = new VBox(10);
        getQuestService().getActiveQuests().forEach(q -> {
            Label questTitle = new Label("► " + q.getName());
            questTitle.setStyle("-fx-text-fill: gold; -fx-font-size: 18px;");
            log.getChildren().add(questTitle);

            q.getObjectives().forEach(obj -> {
                String status = obj.isCompleted() ? "✓ " : "○ ";
                Label objLabel = new Label("  " + status + obj.getDescription());
                objLabel.setStyle("-fx-text-fill: white;");
                log.getChildren().add(objLabel);
            });
        });
        getRoot().getChildren().add(log);
    }
}
```

## Achievement + Quest Integration Pattern

```java
// Achievement that fires when a quest is completed
vars.put("questsCompleted", 0);
settings.getAchievements().add(new Achievement("Quest Master", "Complete 10 quests", "questsCompleted", 10));

// In quest state listener:
mainQuest.stateProperty().subscribe((o, n) -> {
    if (n == QuestState.COMPLETED) {
        inc("questsCompleted", +1);  // this auto-drives the achievement check
    }
});
```

## Gotchas

- **Achievements are declared in `initSettings()`**, not `initGame()` — they are registered
  before the world is created and persist for the app lifetime.
- **Variable names in `Achievement` must exactly match** variables declared in `initGameVars()`.
  A mismatch causes the achievement to never fire (silently ignored).
- **QuestService must be added as engine service** via `settings.addEngineService(QuestService.class)`.
  Calling `getQuestService()` without registering it throws `IllegalStateException`.
- **`addIntObjective` requires an Integer variable** — if your variable is declared as `0.0`
  (Double), the objective will never match. Declare kills/counts as `0` (int).
- **`startQuest()`** must be called before objective variables are modified. A quest's
  objectives start tracking only after `startQuest()`.
- **Achievement progress is NOT automatically saved** by FXGL's default save system. Include
  achievement-related variables in `writeSaveState()` to persist progress across sessions.
- **`AchievementEvent.ACHIEVED` fires once per achievement** — even if the variable goes
  above the threshold repeatedly, the event fires only on the first crossing.
