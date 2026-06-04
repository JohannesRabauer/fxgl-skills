---
name: fxgl-shmup
description: >
  Build a shoot 'em up (shmup) in FXGL — implement auto-scrolling background for vertical
  or horizontal scrollers, spawn enemy formations with timer-based waves, fire player
  bullets toward the scroll direction, script enemy bullet fan/ring/aimed patterns with
  ProjectileComponent, add power-up collectibles that upgrade weapons (spread shot, laser,
  shield), implement a lives-and-respawn system, build multi-phase boss fights, track
  score with chain multipliers, and despawn off-screen entities efficiently. Use this
  skill when building a space shooter, bullet shooter, vertical shmup, horizontal shmup,
  forced-scroll shooter, or any game in the shoot 'em up genre.
triggers:
  - shmup
  - shoot em up
  - space shooter
  - vertical shooter
  - horizontal shooter
  - scrolling shooter
  - formation
  - wave spawner
  - bullet pattern
  - power-up weapon
  - lives system
  - boss fight phases
  - score multiplier
compatibility: >
  Java 17+, FXGL 21.x
category: fxgl/game-types
tags:
  - fxgl
  - java
  - javafx
  - game-types
  - shmup
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
# FXGL Shoot 'em Up (Shmup)

## Scrolling Background (Vertical Shmup)

```java
// Two background images stacked — when first reaches bottom, second takes over seamlessly
private Entity bg1, bg2;
private static final double SCROLL_SPEED = 120; // pixels per second

@Override
protected void initGame() {
    Image bgImage = getAssetLoader().loadImage("bg_space.png");
    double bgH = bgImage.getHeight();

    bg1 = entityBuilder().at(0, 0)
            .view(new ImageView(bgImage)).zIndex(-1).buildAndAttach();
    bg2 = entityBuilder().at(0, -bgH)
            .view(new ImageView(bgImage)).zIndex(-1).buildAndAttach();
}

@Override
protected void onUpdate(double tpf) {
    bg1.translateY(SCROLL_SPEED * tpf);
    bg2.translateY(SCROLL_SPEED * tpf);

    double bgH = bg1.getHeight();
    if (bg1.getY() >= getAppHeight()) bg1.setY(bg2.getY() - bgH);
    if (bg2.getY() >= getAppHeight()) bg2.setY(bg1.getY() - bgH);
}
```

## Player Ship

```java
@Spawns("player")
public Entity newPlayer(SpawnData data) {
    return entityBuilder(data)
            .type(EntityType.PLAYER)
            .view("ship_player.png")
            .bbox(BoundingShape.box(32, 32))
            .with(new CollidableComponent(true))
            .with(new PlayerShipComponent())
            .build();
}

public class PlayerShipComponent extends Component {
    public int weaponLevel = 1;
    private double fireTimer = 0;
    private static final double FIRE_RATE = 0.15;  // seconds between shots

    @Override
    public void onUpdate(double tpf) {
        // Clamp to screen
        entity.setX(Math.max(0, Math.min(getAppWidth() - 32, entity.getX())));
        entity.setY(Math.max(0, Math.min(getAppHeight() - 32, entity.getY())));

        // Auto-fire
        fireTimer += tpf;
        if (fireTimer >= FIRE_RATE) {
            fireTimer = 0;
            fire();
        }
    }

    private void fire() {
        switch (weaponLevel) {
            case 1 -> spawnBullet(entity.getCenter(), new Point2D(0, -1));
            case 2 -> {
                spawnBullet(entity.getCenter().add(-8, 0), new Point2D(-0.1, -1).normalize());
                spawnBullet(entity.getCenter().add(8, 0),  new Point2D(0.1, -1).normalize());
            }
            case 3 -> {
                spawnBullet(entity.getCenter(), new Point2D(0, -1));
                spawnBullet(entity.getCenter().add(-12, 0), new Point2D(-0.2, -1).normalize());
                spawnBullet(entity.getCenter().add(12, 0),  new Point2D(0.2, -1).normalize());
            }
        }
        play("sounds/laser.wav");
    }

    private void spawnBullet(Point2D pos, Point2D dir) {
        spawn("playerBullet", new SpawnData(pos.getX(), pos.getY()).put("dir", dir));
    }
}
```

## Wave Spawner

```java
// Define wave data
public record Wave(int count, double interval, String formation, double startY) {}

private final List<Wave> waves = List.of(
    new Wave(5, 0.5, "LINE",   -50),
    new Wave(8, 0.4, "V_FORM", -50),
    new Wave(10, 0.3, "CROSS", -50)
);

private int currentWave = 0;
private int enemiesRemaining = 0;

private void startNextWave() {
    if (currentWave >= waves.size()) {
        spawnBoss();
        return;
    }
    Wave wave = waves.get(currentWave++);
    enemiesRemaining = wave.count();

    List<Point2D> positions = getFormationPositions(wave.formation(), wave.count());
    for (int i = 0; i < positions.size(); i++) {
        int idx = i;
        runOnce(() -> {
            spawn("enemy", positions.get(idx).getX(), wave.startY());
            enemiesRemaining--;
            if (enemiesRemaining == 0) {
                runOnce(this::startNextWave, Duration.seconds(2));
            }
        }, Duration.seconds(i * wave.interval()));
    }
}

private List<Point2D> getFormationPositions(String type, int count) {
    return switch (type) {
        case "LINE"   -> IntStream.range(0, count)
                           .mapToObj(i -> new Point2D(100 + i * 80.0, 0))
                           .toList();
        case "V_FORM" -> IntStream.range(0, count)
                           .mapToObj(i -> new Point2D(
                               getAppWidth() / 2.0 + (i - count/2) * 60,
                               (Math.abs(i - count/2)) * 40.0))
                           .toList();
        default       -> List.of(new Point2D(getAppWidth() / 2.0, 0));
    };
}
```

## Enemy Bullet Patterns

```java
// Aimed shot — fires at player's current position
public void fireAimed(Entity enemy) {
    Point2D dir = getGameWorld()
            .getSingleton(EntityType.PLAYER)
            .getCenter()
            .subtract(enemy.getCenter())
            .normalize();
    spawnEnemyBullet(enemy.getCenter(), dir);
}

// Fan spread — 5 bullets spread evenly
public void fireFan(Entity enemy, int bulletCount, double spreadDegrees) {
    double baseAngle = 90;  // downward (for vertical shmup)
    double step = spreadDegrees / (bulletCount - 1);
    double startAngle = baseAngle - spreadDegrees / 2;

    for (int i = 0; i < bulletCount; i++) {
        double angle = Math.toRadians(startAngle + i * step);
        Point2D dir = new Point2D(Math.cos(angle), Math.sin(angle));
        spawnEnemyBullet(enemy.getCenter(), dir);
    }
}

// Ring burst — bullets in all directions
public void fireRing(Entity enemy, int count) {
    double step = 360.0 / count;
    for (int i = 0; i < count; i++) {
        double angle = Math.toRadians(i * step);
        Point2D dir = new Point2D(Math.cos(angle), Math.sin(angle));
        spawnEnemyBullet(enemy.getCenter(), dir);
    }
}

private void spawnEnemyBullet(Point2D pos, Point2D dir) {
    spawn("enemyBullet", new SpawnData(pos.getX(), pos.getY()).put("dir", dir));
}
```

## Power-Up System

```java
// When enemy dies, chance to drop power-up
onCollisionBegin(EntityType.PLAYER_BULLET, EntityType.ENEMY, (bullet, enemy) -> {
    bullet.removeFromWorld();
    enemy.getComponent(HPComponent.class).damage(10);
    if (enemy.getComponent(HPComponent.class).isDead()) {
        enemy.removeFromWorld();
        inc("score", 100);

        if (FXGLMath.random() < 0.2) {  // 20% drop chance
            String[] types = {"WEAPON_UP", "SHIELD", "SPEED"};
            String type = types[FXGLMath.random(0, 2)];
            spawn("powerup", new SpawnData(enemy.getX(), enemy.getY()).put("type", type));
        }
    }
});

// Collect power-up
onCollisionBegin(EntityType.PLAYER, EntityType.POWERUP, (player, powerup) -> {
    String type = powerup.getString("type");
    powerup.removeFromWorld();

    PlayerShipComponent ship = player.getComponent(PlayerShipComponent.class);
    switch (type) {
        case "WEAPON_UP" -> ship.weaponLevel = Math.min(3, ship.weaponLevel + 1);
        case "SHIELD"    -> ship.activateShield(Duration.seconds(5));
        case "SPEED"     -> ship.activateSpeedBoost(Duration.seconds(8));
    }
    play("sounds/powerup.wav");
});
```

## Lives and Respawn

```java
@Override
protected void initGameVars(Map<String, Object> vars) {
    vars.put("lives", 3);
    vars.put("score", 0);
    vars.put("invincible", false);
}

// Player hit by enemy bullet:
onCollisionBegin(EntityType.PLAYER, EntityType.ENEMY_BULLET, (player, bullet) -> {
    if (getb("invincible")) return;
    bullet.removeFromWorld();
    onPlayerHit();
});

private void onPlayerHit() {
    int lives = geti("lives");
    if (lives <= 1) {
        gameOver();
        return;
    }
    inc("lives", -1);
    startInvincibility(Duration.seconds(2));
    play("sounds/explosion.wav");
    spawnExplosion(player.getCenter());
}

private void startInvincibility(Duration duration) {
    set("invincible", true);
    // Flash the player sprite
    animationBuilder()
            .duration(Duration.millis(100))
            .repeat((int)(duration.toMillis() / 100))
            .autoReverse(true)
            .fade(player)
            .from(1.0).to(0.2)
            .buildAndPlay();

    runOnce(() -> set("invincible", false), duration);
}
```

## Boss Fight with Phases

```java
public class BossComponent extends Component {
    private HPComponent hp;
    private int phase = 1;
    private double phaseTimer = 0;

    @Override
    public void onUpdate(double tpf) {
        // Phase transitions based on HP percentage
        double hpPercent = (double) hp.getValue() / hp.getMaxValue();
        if (phase == 1 && hpPercent < 0.6) enterPhase(2);
        if (phase == 2 && hpPercent < 0.3) enterPhase(3);

        // Phase-specific attack patterns
        phaseTimer += tpf;
        double fireInterval = switch (phase) {
            case 1 -> 2.0;
            case 2 -> 1.2;
            case 3 -> 0.7;
            default -> 2.0;
        };

        if (phaseTimer >= fireInterval) {
            phaseTimer = 0;
            executePhaseAttack();
        }
    }

    private void enterPhase(int newPhase) {
        phase = newPhase;
        // Flash boss on phase change
        play("sounds/boss_phase.wav");
    }

    private void executePhaseAttack() {
        switch (phase) {
            case 1 -> fireAimed(entity);
            case 2 -> { fireAimed(entity); fireFan(entity, 5, 60); }
            case 3 -> { fireFan(entity, 5, 60); fireRing(entity, 16); }
        }
    }
}
```

## Off-Screen Entity Cleanup

```java
// Efficient: attach to all bullet entities
.with(new ExpireCleanComponent(Duration.seconds(3)))

// Or in onUpdate, clean anything outside the world bounds:
@Override
protected void onUpdate(double tpf) {
    getGameWorld().getEntitiesByType(EntityType.ENEMY_BULLET,
                                     EntityType.PLAYER_BULLET,
                                     EntityType.POWERUP)
            .stream()
            .filter(e -> e.getY() > getAppHeight() + 20
                      || e.getY() < -20
                      || e.getX() > getAppWidth() + 20
                      || e.getX() < -20)
            .forEach(Entity::removeFromWorld);
}
```

## Gotchas

- **Background looping math** — when using two background images, the second must start at
  `-bgHeight`, not 0. Both move together; the one that goes off-screen resets to just above the other.
- **`ExpireCleanComponent` is required for bullets** — bullets that miss fly forever if not
  cleaned up. At 10 enemies each firing 3 bullets/second, that's 1800 entities per minute.
- **Power-up hitboxes should be sensor bodies** — if power-ups are STATIC physics bodies,
  they block bullets and other entities. Use sensors so they only trigger collection collisions.
- **Player auto-fire in Component, not initInput** — `onKey()` in `initInput` fires every
  frame the key is held, but tracking fire rate timer in the Component is cleaner and decoupled.
- **Boss sine-wave movement** — don't use `setVelocity()` for boss movement patterns; instead
  compute position analytically in `onUpdate` using `Math.sin(time) × amplitude` and `setPosition()`.
- **Lives HUD** — use separate small ship sprites, not a text counter, for a polished feel.
  Remove one ship sprite per life lost with a scale-to-zero animation.
- **Enemy collision with player** — handle kamikaze enemies (enemy that flies into player)
  separately from bullet collisions. Both `ENEMY` and `ENEMY_BULLET` can hurt the player.
