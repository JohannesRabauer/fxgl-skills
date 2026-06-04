---
name: fxgl-variables-events
description: >
  Manage reactive game state in FXGL — declare typed world variables in initGameVars,
  read/write/increment them via DSL, bind JavaFX UI properties to live variable values,
  register property-change listeners triggered at specific thresholds, fire and subscribe
  to custom events on the EventBus, use the built-in game timer (runOnce, runAtInterval),
  and create offline timers that persist between sessions. Use this skill when tracking
  score, lives, time, game flags, wiring HUD to game state, implementing event-driven
  logic, or scheduling delayed/recurring actions.
triggers:
  - game variable
  - initGameVars
  - EventBus
  - property binding
  - reactive
  - inc
  - geti
  - getip
  - onIntChangeTo
  - game timer
  - runOnce
  - runAtInterval
  - world properties
  - fire event
compatibility: >
  Java 17+, FXGL 21.x
category: fxgl/state
tags:
  - fxgl
  - java
  - javafx
  - state
  - variables
  - events
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
# FXGL Variables & Events

## Declaring Variables

All variables **must** be declared in `initGameVars`. FXGL creates strongly-typed
`Property` objects for each entry — use them for reactive UI bindings.

```java
@Override
protected void initGameVars(Map<String, Object> vars) {
    vars.put("score",       0);       // → IntegerProperty
    vars.put("lives",       3);       // → IntegerProperty
    vars.put("health",      100.0);   // → DoubleProperty
    vars.put("hasShield",   false);   // → BooleanProperty
    vars.put("playerName",  "Hero");  // → StringProperty
    vars.put("currentLevel", 1);      // → IntegerProperty
    vars.put("inventory",   new ArrayList<Item>()); // → ObjectProperty<T>
}
```

## Reading & Writing at Runtime

```java
// Read
int    score   = geti("score");
double hp      = getd("health");
boolean shield = getb("hasShield");
String  name   = gets("playerName");
List<Item> inv = geto("inventory");   // <T> unchecked cast

// Write
set("score",     1500);
set("playerName", "Alice");
set("hasShield",  true);

// Increment (int or double)
inc("score",  +10);
inc("score",  -5);
inc("health", +20.5);
```

## Reactive Property Binding (JavaFX)

```java
// Get observable properties
IntegerProperty  scoreP  = getip("score");
DoubleProperty   healthP = getdp("health");
BooleanProperty  shieldP = getbp("hasShield");
StringProperty   nameP   = getsp("playerName");
ObjectProperty<T> invP   = getop("inventory");

// Bind UI label to score
Text scoreLabel = getUIFactoryService().newText("", Color.WHITE, 22.0);
scoreLabel.textProperty().bind(scoreP.asString("Score: %d"));

// Bind progress bar to health
ProgressBar hpBar = new ProgressBar();
hpBar.progressProperty().bind(healthP.divide(100.0));

// Bind visibility to boolean flag
shieldIcon.visibleProperty().bind(shieldP);

// Bidirectional binding (changes either end update the other)
myTextField.textProperty().bindBidirectional(nameP);
```

## Property Change Listeners

```java
// Fire action when variable reaches a specific value
onIntChangeTo("lives", 0, () -> showGameOver());
onIntChangeTo("score", 1000, () -> spawnBonusEnemy());

// Fire for any change
onIntChange("lives",  newLives  -> updateLivesHUD(newLives));
onDoubleChange("health", hp    -> updateHealthBar(hp));
onBooleanChangeTo("hasShield", true, () -> playShieldSound());
onBooleanChange("paused", isPaused -> toggleMusicPause(isPaused));
onStringChangeTo("playerName", "Hero", () -> triggerHeroDialogue());

// Store reference to remove listener later
PropertyChangeListener<Integer> listener = onIntChange("score", s -> log("score=" + s));
// listener.unsubscribe() when done
```

## Event Bus — Custom Events

### Define a Custom Event

```java
public class GameEvent extends Event {
    public static final EventType<GameEvent> LEVEL_COMPLETE =
            new EventType<>(Event.ANY, "LEVEL_COMPLETE");
    public static final EventType<GameEvent> ENEMY_KILLED =
            new EventType<>(Event.ANY, "ENEMY_KILLED");

    private final Entity sourceEntity;

    public GameEvent(EventType<GameEvent> type, Entity source) {
        super(type);
        this.sourceEntity = source;
    }
    public Entity getSource() { return sourceEntity; }
}
```

### Fire & Subscribe

```java
// Fire an event (anywhere in game code)
fire(new GameEvent(GameEvent.ENEMY_KILLED, killedEnemy));
fire(new GameEvent(GameEvent.LEVEL_COMPLETE, null));

// Subscribe (in initGame or any init* hook)
Subscriber sub = onEvent(GameEvent.ENEMY_KILLED, e -> {
    inc("kills", +1);
    inc("score", +100);
    playEffect(e.getSource().getPosition());
});

// Unsubscribe when no longer needed
sub.unsubscribe();

// Subscribe directly on EventBus (class-based handler)
getEventBus().addEventHandler(GameEvent.LEVEL_COMPLETE, e -> loadNextLevel());
```

### Built-in FXGL Events

```java
// Listen for ANY entity added to world
getEventBus().addEventHandler(WorldEvent.ENTITY_ADDED, e -> {
    Entity entity = e.getEntity();
    if (entity.isType(EntityType.ENEMY)) enemyCount++;
});

getEventBus().addEventHandler(WorldEvent.ENTITY_REMOVED, e -> {
    if (e.getEntity().isType(EntityType.ENEMY)) enemyCount--;
});

// Achievement unlocked
getEventBus().addEventHandler(AchievementEvent.ANY, e -> {
    showNotification("Achievement: " + e.getAchievement().getName());
});
```

## Game Timer

```java
// Run once after delay
runOnce(() -> spawnBoss(), Duration.seconds(10));

// Run at interval (until cancelled)
TimerAction repeatingTask = run(() -> spawnEnemy(), Duration.seconds(5));

// Run limited number of times
run(() -> flashWarning(), Duration.millis(300), 5);  // 5 flashes

// Cancel a repeating task
repeatingTask.expire();

// Local timer (per-entity or per-component use)
LocalTimer timer = newLocalTimer();
timer.capture();
// ... later ...
if (timer.elapsed(Duration.seconds(3))) {
    doAttack();
    timer.capture();  // reset
}
```

## Offline Timer (Persists Between Sessions)

```java
// Useful for daily bonuses, cooldowns across game restarts
LocalTimer offlineTimer = newOfflineTimer("dailyBonus");
// First run — timer is captured at app start automatically

// Check if 24 hours have passed since last capture
if (offlineTimer.elapsed(Duration.hours(24))) {
    grantDailyBonus();
    offlineTimer.capture();  // reset for next day
}
```

## Common Patterns

### Score Multiplier

```java
// Declare
vars.put("scoreMultiplier", 1);
vars.put("score", 0);

// Award with multiplier
public void awardScore(int basePoints) {
    inc("score", basePoints * geti("scoreMultiplier"));
}

// Time-limited multiplier
public void activateDoubleScore() {
    set("scoreMultiplier", 2);
    runOnce(() -> set("scoreMultiplier", 1), Duration.seconds(10));
}
```

### Wave System

```java
// In initGameVars
vars.put("wave", 0);
vars.put("enemiesAlive", 0);

// In game logic
public void startNextWave() {
    inc("wave", +1);
    int waveNum = geti("wave");
    set("enemiesAlive", waveNum * 3);

    for (int i = 0; i < waveNum * 3; i++) {
        spawn("enemy", random(0, getAppWidth()), -50);
    }
}

// In collision handler
onCollisionBegin(EntityType.BULLET, EntityType.ENEMY, (b, e) -> {
    e.removeFromWorld();
    inc("enemiesAlive", -1);
    if (geti("enemiesAlive") <= 0) startNextWave();
});
```

## Gotchas

- **All variables must be declared in `initGameVars()`** — `geti("score")` throws
  `IllegalArgumentException` if "score" was never declared.
- **Type must match** — declaring `vars.put("score", 0)` (int) then calling `getd("score")`
  throws `ClassCastException`. Use matching getter (geti/getd/getb/gets/geto).
- **`getip()` returns a live property** — any binding you create stays active for the
  app lifetime. Bind only once; don't call `getip()` in `onUpdate()`.
- **Custom events must use unique `EventType` names** — two `EventType` instances with the
  same string name are considered equal. Prefix with your game name to avoid conflicts.
- **`runOnce` / `run` timers scale with game time** — if the game is paused (dialogs,
  menus), the timers pause too. Use engine-level timers (`getEngineTimer()`) for real-time.
- **`newOfflineTimer` persists via `SystemBundle`** — it reads/writes from a properties
  file managed by FXGL. The file is stored in `~/.fxgl/{AppTitle}/`.
