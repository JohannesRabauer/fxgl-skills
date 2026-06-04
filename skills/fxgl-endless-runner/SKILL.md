---
name: fxgl-endless-runner
description: >
  Build an endless runner in FXGL — auto-scroll the camera at increasing speed, keep the
  player at a fixed screen X while allowing only vertical movement (jump/duck), procedurally
  generate obstacles off the right edge and despawn them past the left edge, implement a
  distance-based score, collect coins along the path, scale difficulty with scroll speed
  and obstacle density, add power-ups (shield, magnet, jetpack, double score), and persist
  the high score with SaveLoadService.
  Use this skill when building a Temple Run-style 2D game, Jetpack Joyride-style endless
  scroller, or any auto-scrolling infinite runner.
  Triggers on: "endless runner", "auto-scroll", "infinite runner", "auto-scrolling",
  "procedural obstacles", "distance score", "jetpack joyride", "temple run 2D",
  "obstacle generation", "high score", "coin magnet".
compatibility: Java 17+, FXGL 21.x
metadata:
  author: fxgl-skills
  version: "1.0"
  fxgl-version: "21.1"
  category: fxgl/game-types
allowed-tools: Read Write Edit Bash
---

# FXGL Endless Runner

## Architecture

The camera scrolls right automatically. The player's world X position advances but their
**screen X is fixed** (viewport moves with them). Obstacles are generated ahead and removed behind.

## Game Variables

```java
@Override
protected void initGameVars(Map<String, Object> vars) {
    vars.put("distance",     0.0);   // meters run
    vars.put("score",        0);
    vars.put("highScore",    0);
    vars.put("coins",        0);
    vars.put("scrollSpeed",  200.0); // px/s, increases over time
    vars.put("alive",        true);
    vars.put("shieldActive", false);
    vars.put("magnetActive", false);
    vars.put("x2Active",     false);
}
```

## Auto-Scroll Camera

```java
private static final double PLAYER_SCREEN_X = 200;  // player's fixed screen position
private double worldScrollX = 0;

@Override
protected void onUpdate(double tpf) {
    if (!getb("alive")) return;

    double speed = getd("scrollSpeed");

    // Scroll the world
    worldScrollX += speed * tpf;
    getGameScene().getViewport().setX(worldScrollX - PLAYER_SCREEN_X);

    // Update distance and score
    inc("distance", speed * tpf / 100);  // 100px = 1 meter
    int scoreGain = getb("x2Active") ? 2 : 1;
    inc("score", (int)(speed * tpf / 50) * scoreGain);

    // Increase difficulty over time
    double newSpeed = Math.min(500, 200 + getd("distance") * 3);
    set("scrollSpeed", newSpeed);

    // Spawn obstacles ahead
    trySpawnObstacle();
    cleanupBehind();

    // Coin magnet
    if (getb("magnetActive")) attractCoins();
}
```

## Player Setup

```java
@Spawns("player")
public Entity newPlayer(SpawnData data) {
    PhysicsComponent physics = new PhysicsComponent();
    physics.setBodyType(BodyType.DYNAMIC);
    physics.setFixedRotation(true);

    FixtureDef fd = new FixtureDef();
    fd.setFriction(0);
    physics.addFixtureDef(fd);

    return entityBuilder(data)
            .type(EntityType.PLAYER)
            .view("runner.png")
            .bbox(BoundingShape.box(28, 48))
            .with(physics)
            .with(new CollidableComponent(true))
            .with(new RunnerPlayerComponent())
            .build();
}

public class RunnerPlayerComponent extends Component {
    private PhysicsComponent physics;
    private boolean isGrounded   = false;
    private boolean isDucking    = false;
    private static final double JUMP_FORCE  = 14.0;
    private static final int    JUMP_COUNT  = 2;  // double jump
    private int jumpsLeft = JUMP_COUNT;

    @Override
    public void onUpdate(double tpf) {
        // Keep player scrolling with camera (constant world X advance)
        entity.setX(worldScrollX);

        isDucking = getInput().isHeld(KeyCode.DOWN) || getInput().isHeld(KeyCode.S);
        // Adjust bbox height for duck
        // ...

        if (isGrounded) jumpsLeft = JUMP_COUNT;
        isGrounded = false;  // reset — set true by collision
    }

    public void onJump() {
        if (jumpsLeft > 0) {
            physics.setVelocityY(-JUMP_FORCE);
            jumpsLeft--;
            if (jumpsLeft == JUMP_COUNT - 1) play("sounds/jump.wav");
            else play("sounds/double_jump.wav");
        }
    }

    public void setGrounded(boolean g) {
        isGrounded = g;
        if (g) jumpsLeft = JUMP_COUNT;
    }
}
```

## Procedural Obstacle Generation

```java
private double lastSpawnX = 0;
private double minGap     = 300;   // minimum gap between obstacles
private final Random rng  = new Random();

private void trySpawnObstacle() {
    double spawnThreshold = worldScrollX + getAppWidth() + 100;  // spawn 100px ahead of screen

    if (spawnThreshold <= lastSpawnX + minGap) return;

    // Pick random pattern
    String[] patterns = {"low_block", "high_block", "low_high", "triple", "coin_run", "gap"};
    double[] weights  = {0.3, 0.25, 0.2, 0.1, 0.1, 0.05};
    String pattern = weightedRandom(patterns, weights);

    double spawnX = lastSpawnX + minGap + rng.nextInt(200);
    spawnPattern(pattern, spawnX);

    lastSpawnX = spawnX;
    // Decrease gap as speed increases
    minGap = Math.max(180, 400 - getd("scrollSpeed") * 0.4);
}

private void spawnPattern(String pattern, double x) {
    switch (pattern) {
        case "low_block"  -> spawn("block", x, GROUND_Y - 60);
        case "high_block" -> spawn("flying_obstacle", x, GROUND_Y - 150);
        case "low_high"   -> {
            spawn("block", x, GROUND_Y - 60);
            spawn("flying_obstacle", x + 80, GROUND_Y - 140);
        }
        case "triple"     -> {
            for (int i = 0; i < 3; i++) spawn("block", x + i * 60, GROUND_Y - 60);
        }
        case "coin_run"   -> {
            for (int i = 0; i < 8; i++) spawn("coin", x + i * 40, GROUND_Y - 80 - rng.nextInt(60));
        }
        case "gap"        -> {
            // Platform ends — place next section further ahead
            lastSpawnX += 200;  // creates a pit
        }
    }
}
```

## Behind-Camera Cleanup

```java
private void cleanupBehind() {
    double leftEdge = getGameScene().getViewport().getX() - 100;

    new ArrayList<>(getGameWorld().getEntitiesByType(
            EntityType.OBSTACLE, EntityType.COIN, EntityType.POWERUP))
            .stream()
            .filter(e -> e.getX() < leftEdge)
            .forEach(Entity::removeFromWorld);
}
```

## Collision Handlers

```java
@Override
protected void initPhysics() {
    // Ground detection
    onCollisionBegin(EntityType.PLAYER, EntityType.GROUND, (player, ground) ->
            player.getComponent(RunnerPlayerComponent.class).setGrounded(true));

    // Obstacle hit → game over (unless shielded)
    onCollisionBegin(EntityType.PLAYER, EntityType.OBSTACLE, (player, obstacle) -> {
        if (getb("shieldActive")) {
            set("shieldActive", false);
            obstacle.removeFromWorld();
            play("sounds/shield_break.wav");
        } else {
            onGameOver();
        }
    });

    // Coin collection
    onCollisionBegin(EntityType.PLAYER, EntityType.COIN, (player, coin) -> {
        coin.removeFromWorld();
        inc("coins", 1);
        inc("score", getb("x2Active") ? 20 : 10);
        play("sounds/coin.wav");
    });

    // Power-up collection
    onCollisionBegin(EntityType.PLAYER, EntityType.POWERUP, (player, powerup) -> {
        activatePowerup(powerup.getString("type"));
        powerup.removeFromWorld();
    });
}
```

## Power-Ups

```java
private void activatePowerup(String type) {
    switch (type) {
        case "SHIELD" -> {
            set("shieldActive", true);
            showShieldEffect(player);
            play("sounds/shield.wav");
        }
        case "MAGNET" -> {
            set("magnetActive", true);
            runOnce(() -> set("magnetActive", false), Duration.seconds(8));
        }
        case "JETPACK" -> {
            // Player rises above obstacles briefly
            player.getComponent(RunnerPlayerComponent.class).startJetpack(6.0);
        }
        case "X2_SCORE" -> {
            set("x2Active", true);
            runOnce(() -> set("x2Active", false), Duration.seconds(10));
        }
    }
    play("sounds/powerup.wav");
}

private void attractCoins() {
    Point2D playerPos = player.getCenter();
    getGameWorld().getEntitiesByType(EntityType.COIN)
            .stream()
            .filter(c -> c.getCenter().distance(playerPos) < 200)
            .forEach(coin -> {
                Point2D dir = playerPos.subtract(coin.getCenter()).normalize();
                coin.translate(dir.getX() * 300 * tpf, dir.getY() * 300 * tpf);
            });
}
```

## Game Over and High Score

```java
private void onGameOver() {
    set("alive", false);
    getGameController().pauseEngine();

    // Save high score
    int score = geti("score");
    if (score > geti("highScore")) {
        set("highScore", score);
        getSaveLoadService().saveAndForget("highscore_save");
    }

    showMessage("Game Over!\nScore: " + score + "\nHigh Score: " + geti("highScore"),
            () -> getGameController().startNewGame());
}

@Override
protected void initGame() {
    // Load high score
    getSaveLoadService().load("highscore_save");
}
```

## Gotchas

- **Player world X must advance with scroll** — set `entity.setX(worldScrollX)` each frame
  in `onUpdate`. The player doesn't move on their own; the world scrolls around them.
- **`getGameScene().getViewport().setX(worldScrollX - PLAYER_SCREEN_X)`** — not `translate`.
  `setX` positions the camera absolutely; translate accumulates and drifts.
- **Ground entity must extend beyond the spawn horizon** — use a very long ground STATIC body
  (or tile-based from Tiled) that extends far ahead. Dynamic ground generation is complex.
- **`lastSpawnX` tracks obstacle X in WORLD coordinates** — compare to `worldScrollX +
  appWidth + aheadBuffer`, not screen coordinates.
- **Cleanup behind the camera with a copy** — always `new ArrayList<>(getEntitiesByType())`
  before calling `removeFromWorld()` in a stream to avoid `ConcurrentModificationException`.
- **Double jump: reset on ground contact** — `onCollisionBegin` resets `jumpsLeft`, but
  `isGrounded` resets every frame in `onUpdate`. Both patterns are needed together.
- **Difficulty scaling: cap scroll speed** — uncapped speed eventually makes the game
  impossible on any hardware. Cap at a sensible maximum (400-500 px/s for most players).
