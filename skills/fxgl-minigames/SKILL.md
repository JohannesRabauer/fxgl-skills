---
name: fxgl-minigames
description: >
  Use and extend the FXGL built-in mini-game system — launch lock-picking, sweet-spot,
  trigger-mash, trigger-sequence (QTE), circuit-breaker, and random-occurrence mini-games
  via MiniGameService, handle success/failure results, configure difficulty, and author
  custom mini-games. Use this skill when adding interactive skill-check moments, lock-
  picking mechanics, quick-time events, button-mashing sequences, or any mini-game
  overlay.
triggers:
  - mini game
  - minigame
  - MiniGameService
  - lock pick
  - sweet spot
  - QTE
  - quick time event
  - trigger mash
  - circuit breaker
  - random occurrence
compatibility: >
  Java 17+, FXGL 21.x. MiniGameService must be registered.
category: fxgl/minigames
tags:
  - fxgl
  - java
  - javafx
  - minigames
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
# FXGL Mini-Game System

## Setup

```java
settings.addEngineService(MiniGameService.class);
```

## Launching a Mini-Game

All mini-games share the same launch pattern:

```java
getMiniGameService().startMiniGame(
    new SomeMiniGame(/* config */),
    result -> {
        if (result.isSuccess()) {
            // player won
        } else {
            // player failed
        }
    }
);
```

The mini-game view overlays the `GameScene`. The underlying game loop continues unless the
mini-game itself pauses it.

---

## Lock Picking Mini-Game

The player rotates a pick to find the sweet spot for each pin.

```java
LockPickMiniGame lockPick = new LockPickMiniGame();
lockPick.setNumPins(3);              // difficulty: 1-6 pins (default: 3)
lockPick.setTimeLimit(Duration.seconds(30));

getMiniGameService().startMiniGame(lockPick, result -> {
    LockPickResult lpr = (LockPickResult) result;
    if (lpr.isSuccess()) {
        openChest();
        play("sounds/unlock.wav");
    } else {
        breakLockPick();
        inc("lockPicksUsed", +1);
    }
});
```

## Sweet Spot Mini-Game

A bar oscillates; the player presses a key when it's inside the target zone.

```java
SweetSpotMiniGame sweetSpot = new SweetSpotMiniGame();
sweetSpot.setBarSpeed(2.0);          // oscillation speed (higher = harder)
sweetSpot.setTargetWidth(0.2);       // zone width as fraction of bar (0.0-1.0)
sweetSpot.setTimeLimit(Duration.seconds(5));

getMiniGameService().startMiniGame(sweetSpot, result -> {
    SweetSpotResult ssr = (SweetSpotResult) result;
    if (ssr.isSuccess()) {
        // Score based on how centred the hit was
        double accuracy = ssr.getAccuracy();  // 0.0-1.0, 1.0 = perfect centre
        int bonus = (int)(accuracy * 100);
        inc("score", bonus);
    }
});
```

## Trigger Mash Mini-Game (Button Spam)

The player must press a key a set number of times before a timer runs out.

```java
TriggerMashMiniGame triggerMash = new TriggerMashMiniGame();
triggerMash.setTrigger(new KeyTrigger(KeyCode.SPACE));
triggerMash.setRequiredPresses(20);
triggerMash.setTimeLimit(Duration.seconds(5));

getMiniGameService().startMiniGame(triggerMash, result -> {
    if (result.isSuccess()) wrestleEnemy();
    else playerTakesDamage(20);
});
```

## Trigger Sequence Mini-Game (QTE)

The player must press keys in the exact displayed order within a time limit.

```java
List<KeyCode> sequence = List.of(KeyCode.UP, KeyCode.UP, KeyCode.DOWN, KeyCode.LEFT, KeyCode.RIGHT);

TriggerSequenceMiniGame qte = new TriggerSequenceMiniGame();
qte.setSequence(sequence.stream().map(KeyTrigger::new).collect(Collectors.toList()));
qte.setInputTimeout(Duration.millis(800));  // time to press each key

getMiniGameService().startMiniGame(qte, result -> {
    if (result.isSuccess()) { performSpecialMove(); play("sounds/success.wav"); }
    else                    { play("sounds/fail.wav"); }
});
```

## Circuit Breaker Mini-Game

The player navigates a maze of electrical circuits without touching walls.

```java
CircuitBreakerMiniGame circuit = new CircuitBreakerMiniGame();
circuit.setMazeWidth(10);
circuit.setMazeHeight(8);
circuit.setPathWidth(12.0);  // narrower path = harder

getMiniGameService().startMiniGame(circuit, result -> {
    if (result.isSuccess()) hackTerminal();
    else                    activateAlarm();
});
```

## Random Occurrence Mini-Game

A visual cue appears randomly; the player must react within a short window.

```java
RandomOccurrenceMiniGame randOccurrence = new RandomOccurrenceMiniGame();
randOccurrence.setDelayRange(Duration.seconds(0.5), Duration.seconds(3));  // random delay
randOccurrence.setReactionWindow(Duration.millis(400));  // 400ms to react
randOccurrence.setTrigger(new KeyTrigger(KeyCode.F));

getMiniGameService().startMiniGame(randOccurrence, result -> {
    if (result.isSuccess()) dodgeAttack();
    else                    playerTakesHit();
});
```

## Custom Mini-Game

```java
public class PuzzleMiniGame extends MiniGame<PuzzleResult> {

    @Override
    protected MiniGameView createView() {
        // Build your UI here
        Pane root = new Pane();
        // ... add your puzzle elements
        return new MiniGameView(root);
    }

    @Override
    public void onOpen() {
        // Called when mini-game starts; set up timers or listeners
    }

    @Override
    public void onClose() {
        // Clean up
    }

    // Call this when the player completes or fails
    private void onPlayerSolves() {
        setResult(new PuzzleResult(true, score));  // success
        // or: setResult(new PuzzleResult(false, 0));  // failure
    }
}

public class PuzzleResult extends MiniGameResult {
    private final int score;
    public PuzzleResult(boolean success, int score) {
        super(success);
        this.score = score;
    }
    public int getScore() { return score; }
}

// Launch
getMiniGameService().startMiniGame(new PuzzleMiniGame(), result -> {
    PuzzleResult pr = (PuzzleResult) result;
    inc("score", pr.getScore());
});
```

## Collision-Triggered Mini-Game Pattern

```java
onCollisionBegin(EntityType.PLAYER, EntityType.LOCKED_CHEST, (player, chest) -> {
    if (getCutsceneService().isActive() || getMiniGameService().isActive()) return;

    chest.removeFromWorld();   // prevent re-trigger

    SweetSpotMiniGame mg = new SweetSpotMiniGame();
    mg.setBarSpeed(1.5 + geti("difficulty") * 0.5);
    mg.setTargetWidth(0.3 - geti("difficulty") * 0.05);

    getMiniGameService().startMiniGame(mg, result -> {
        if (result.isSuccess()) {
            spawn("chestContents", chest.getX(), chest.getY());
            play("sounds/chest_open.wav");
        } else {
            // re-add chest as still locked
            spawn("lockedChest", chest.getX(), chest.getY());
            play("sounds/lock_fail.wav");
        }
    });
});
```

## Gotchas

- **`getMiniGameService().isActive()`** — always check before launching a new mini-game.
  Starting one while another is active will crash.
- **`setResult(...)` ends the mini-game** — call it exactly once. Calling it multiple times
  (e.g., from a timer and a button press) fires the result callback twice.
- **Mini-game UI is added on top of GameScene** — it does NOT replace the scene. The physics
  world and existing entities remain active unless you pause explicitly.
- **`TriggerSequenceMiniGame` displays the sequence** as on-screen key icons. If the player
  has a custom key scheme, update the sequence triggers to match.
- **`LockPickMiniGame` difficulty scales linearly with pin count** — 1 pin is trivial, 6 pins
  is very hard. Calibrate to player skill level with a `difficulty` variable.
- **Register `MiniGameService`** before `getCutsceneService()` if both are used — service
  order in `initSettings` matches initialisation order.
