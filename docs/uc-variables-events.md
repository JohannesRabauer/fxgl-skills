# Use Cases — Variables, Properties & Event Bus

Covers world properties, reactive JavaFX bindings, property change listeners, the event bus,
and custom events.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-VAR-1\nDeclare game variables in initGameVars()"]
    Dev --> UC2["UC-VAR-2\nRead / write variable at runtime"]
    Dev --> UC3["UC-VAR-3\nIncrement integer / double variable"]
    Dev --> UC4["UC-VAR-4\nBind UI text to variable (reactive)"]
    Dev --> UC5["UC-VAR-5\nListen for value change (threshold)"]
    Dev --> UC6["UC-VAR-6\nListen for any value change"]
    Dev --> UC7["UC-VAR-7\nFire custom game event"]
    Dev --> UC8["UC-VAR-8\nSubscribe to custom event"]
    Dev --> UC9["UC-VAR-9\nSubscribe to built-in FXGL events"]
    Dev --> UC10["UC-VAR-10\nUse offline timer (persisted across sessions)"]
```

## Variable Declaration and Access

```mermaid
flowchart TD
    Declare["initGameVars(Map vars){\n  vars.put('score', 0);\n  vars.put('lives', 3);\n  vars.put('paused', false);\n}"] --> Runtime

    Runtime["At runtime via DSL"] --> SetVar["FXGL.set('score', 1000)"]
    Runtime --> GetI["FXGL.geti('score')  → Int"]
    Runtime --> GetD["FXGL.getd('speed') → Double"]
    Runtime --> GetB["FXGL.getb('paused') → Boolean"]
    Runtime --> GetS["FXGL.gets('playerName') → String"]
    Runtime --> GetO["FXGL.geto('inventory') → T"]
    Runtime --> Inc2["FXGL.inc('score', +10)"]
```

## Reactive Property Binding

```mermaid
flowchart LR
    Prop["FXGL.getip('score')  → IntegerProperty\nFXGL.getdp('speed') → DoubleProperty\nFXGL.getbp('alive') → BooleanProperty\nFXGL.getsp('name')  → StringProperty"]
    Prop --> Bind["JavaFX label.textProperty()\n.bind(FXGL.getip('score').asString())"]
    Prop --> BarBind["progressBar.progressProperty()\n.bind(FXGL.getdp('health').divide(maxHealth))"]
    Prop --> CSS2["CSS pseudo-class auto-updates\nwhen property changes"]
```

## Property Change Listeners

```mermaid
flowchart TD
    L1["FXGL.onIntChangeTo('score', 100, () -> levelUp())"]
    L2["FXGL.onIntChange('lives', count -> updateHUD(count))"]
    L3["FXGL.onBooleanChangeTo('gameOver', true, () -> showGameOver())"]
    L4["FXGL.onBooleanChange('paused', isPaused -> toggleMusic(isPaused))"]
    L5["FXGL.onDoubleChange('speed', s -> adjustParticles(s))"]

    L1 --> Note["Returns PropertyChangeListener\nstore ref to remove later if needed"]
    L2 --> Note
```

## Event Bus Use Cases

```mermaid
flowchart LR
    Fire["FXGL.fire(new MyGameEvent(MyGameEvent.LEVEL_UP))"] --> Bus["EventBus"]
    Bus --> Handler["FXGL.onEvent(MyGameEvent.LEVEL_UP, e -> ...)"]
    Bus --> Handler2["getEventBus().addEventHandler(type, handler)"]
    Handler --> Unsub["subscriber.unsubscribe() — remove listener"]
```

## Custom Event Definition

```mermaid
flowchart TD
    Define["class EnemyKilledEvent extends Event{\n  static final EventType ANY =\n    new EventType(Event.ANY, 'ENEMY_KILLED');\n  Entity enemy;\n}"] --> Fire2["FXGL.fire(new EnemyKilledEvent(killedEntity))"]
    Fire2 --> Listen["FXGL.onEvent(EnemyKilledEvent.ANY,\n  e -> inc('killCount', 1))"]
```

## Built-in FXGL Events

```mermaid
graph TD
    BuiltIn["Built-in Event Types"] --> WorldEvents["WorldEvent\n• ENTITY_ADDED\n• ENTITY_REMOVED\n• RESET"]
    BuiltIn --> AchievEvents["AchievementEvent.ACHIEVED"]
    BuiltIn --> CollisionEvents["CollisionEvent (physics)"]
    BuiltIn --> InputEvents["ActionEvent (input actions)"]
```

## Timer Use Cases

```mermaid
graph TD
    Timers["Timer System"] --> Once["FXGL.runOnce(() -> spawn('bomb'), Duration.seconds(3))"]
    Timers --> Interval2["FXGL.run(() -> spawnEnemy(), Duration.seconds(5))"]
    Timers --> Limited["FXGL.run(() -> flash(), Duration.millis(200), 5)"]
    Timers --> Local["FXGL.newLocalTimer()\n.capture() / elapsed(duration)"]
    Timers --> Offline2["FXGL.newOfflineTimer('dailyBonus')\npersists between game sessions"]
```
