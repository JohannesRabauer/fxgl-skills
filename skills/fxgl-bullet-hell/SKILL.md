---
name: fxgl-bullet-hell
description: >
  Build a bullet hell (danmaku) game in FXGL — create a tiny precise hitbox independent of
  the player sprite, add a graze sensor for near-miss scoring, script spiral and circular
  aimed bullet patterns, implement phase-based boss attack scripting, add a screen-
  clearing bomb that removes all enemy bullets, handle invincibility frames on hit,
  accelerate and decelerate bullets mid-flight, create homing bullets with delayed lock-
  on, and efficiently manage 1000+ simultaneous bullets on screen. Use this skill when
  building a danmaku shooter, pattern-based boss, or any game requiring dense bullet
  patterns and precise hitbox design.
triggers:
  - bullet hell
  - danmaku
  - spiral pattern
  - bullet pattern
  - graze
  - bomb
  - hitbox smaller than sprite
  - homing bullet
  - 1000 bullets
  - dense bullets
  - boss pattern
compatibility: >
  Java 17+, FXGL 21.x
category: fxgl/game-types
tags:
  - fxgl
  - java
  - javafx
  - game-types
  - bullet
  - hell
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
# FXGL Bullet Hell

## Player: Tiny Hitbox + Graze Sensor

```java
@Spawns("player")
public Entity newPlayer(SpawnData data) {
    // Actual hitbox — very small, centered on sprite
    PhysicsComponent hitboxPhysics = new PhysicsComponent();
    hitboxPhysics.setBodyType(BodyType.DYNAMIC);
    hitboxPhysics.setFixedRotation(true);

    FixtureDef hitFD = new FixtureDef();
    hitFD.setFriction(0);
    hitFD.setDensity(1);
    hitboxPhysics.addFixtureDef(hitFD);

    Entity player = entityBuilder(data)
            .type(EntityType.PLAYER)
            .view("player_ship.png")                     // 48×48 sprite
            .bbox(BoundingShape.circle(4))               // only 4px radius hitbox!
            .with(hitboxPhysics)
            .with(new CollidableComponent(true))
            .with(new BulletHellPlayerComponent())
            .build();

    return player;
}

// Separate graze sensor entity attached nearby:
private Entity grazeEntity;

@Override
protected void initGame() {
    // ... spawn player ...
    grazeEntity = entityBuilder()
            .type(EntityType.GRAZE_SENSOR)
            .at(player.getX(), player.getY())
            .bbox(BoundingShape.circle(18))              // slightly larger
            .with(new CollidableComponent(true))
            .buildAndAttach();
}

@Override
protected void onUpdate(double tpf) {
    // Keep graze sensor centered on player
    grazeEntity.setPosition(player.getPosition());
}
```

## Player Movement and Focused Mode

```java
public class BulletHellPlayerComponent extends Component {
    private static final double NORMAL_SPEED  = 250.0;
    private static final double FOCUSED_SPEED = 100.0;   // shift = slow precise movement

    @Override
    public void onUpdate(double tpf) {
        boolean focused = getInput().isHeld(KeyCode.SHIFT);
        double speed = focused ? FOCUSED_SPEED : NORMAL_SPEED;

        double dx = 0, dy = 0;
        if (getInput().isHeld(KeyCode.LEFT))  dx -= 1;
        if (getInput().isHeld(KeyCode.RIGHT)) dx += 1;
        if (getInput().isHeld(KeyCode.UP))    dy -= 1;
        if (getInput().isHeld(KeyCode.DOWN))  dy += 1;

        if (dx != 0 && dy != 0) { dx *= 0.7071; dy *= 0.7071; }

        entity.getComponent(PhysicsComponent.class).setVelocityX(dx * speed);
        entity.getComponent(PhysicsComponent.class).setVelocityY(dy * speed);

        // Clamp to play field (typically narrower than screen)
        double px = Math.max(FIELD_X, Math.min(FIELD_X + FIELD_W - 8, entity.getX()));
        double py = Math.max(FIELD_Y, Math.min(FIELD_Y + FIELD_H - 8, entity.getY()));
        entity.setPosition(px, py);
    }
}
```

## Collision Handlers

```java
@Override
protected void initPhysics() {
    // Actual death — tiny hitbox contact
    onCollisionBegin(EntityType.PLAYER, EntityType.ENEMY_BULLET, (player, bullet) -> {
        if (getb("invincible")) return;
        bullet.removeFromWorld();
        onPlayerDeath();
    });

    // Graze — near miss scores bonus and charges bomb
    Set<Entity> grazedBullets = new HashSet<>();
    onCollisionBegin(EntityType.GRAZE_SENSOR, EntityType.ENEMY_BULLET, (sensor, bullet) -> {
        if (!grazedBullets.contains(bullet)) {
            grazedBullets.add(bullet);
            inc("grazeScore", 10);
            inc("bombCharge", 1);
            play("sounds/graze.wav");
        }
    });
    onCollisionEnd(EntityType.GRAZE_SENSOR, EntityType.ENEMY_BULLET, (sensor, bullet) ->
            grazedBullets.remove(bullet));
}
```

## Spiral Pattern

```java
public class SpiralShooterComponent extends Component {
    private double angle = 0;
    private double timer = 0;
    private static final double FIRE_INTERVAL = 0.05;  // fire every 50ms
    private static final int    ARMS          = 3;      // 3-arm spiral

    @Override
    public void onUpdate(double tpf) {
        timer += tpf;
        if (timer < FIRE_INTERVAL) return;
        timer = 0;

        for (int arm = 0; arm < ARMS; arm++) {
            double armAngle = angle + arm * (360.0 / ARMS);
            double rad = Math.toRadians(armAngle);
            Point2D dir = new Point2D(Math.cos(rad), Math.sin(rad));
            spawnEnemyBullet(entity.getCenter(), dir, 180);
        }
        angle = (angle + 3) % 360;   // rotate 3 degrees per shot
    }
}
```

## Aimed Pattern + Delay

```java
public class AimedBurstComponent extends Component {
    private double burstTimer = 0;
    private static final double BURST_INTERVAL = 2.0;
    private static final int    BURST_COUNT    = 5;

    @Override
    public void onUpdate(double tpf) {
        burstTimer += tpf;
        if (burstTimer < BURST_INTERVAL) return;
        burstTimer = 0;
        fireAimedBurst();
    }

    private void fireAimedBurst() {
        Point2D playerPos = getGameWorld().getSingleton(EntityType.PLAYER).getCenter();
        Point2D dir = playerPos.subtract(entity.getCenter()).normalize();
        double baseAngle = Math.toDegrees(Math.atan2(dir.getY(), dir.getX()));

        for (int i = 0; i < BURST_COUNT; i++) {
            int fi = i;
            runOnce(() -> {
                double rad = Math.toRadians(baseAngle);
                spawnEnemyBullet(entity.getCenter(),
                        new Point2D(Math.cos(rad), Math.sin(rad)), 200);
            }, Duration.millis(i * 80L));
        }
    }
}
```

## Homing Bullet (Delayed Lock-On)

```java
public class HomingBulletComponent extends Component {
    private Point2D velocity;
    private double homingDelay;      // seconds before homing activates
    private double elapsed = 0;
    private static final double TURN_SPEED = 180; // degrees per second

    public HomingBulletComponent(Point2D initialDir, double speed, double homingDelay) {
        this.velocity = initialDir.multiply(speed);
        this.homingDelay = homingDelay;
    }

    @Override
    public void onUpdate(double tpf) {
        elapsed += tpf;

        if (elapsed > homingDelay) {
            // Steer toward player
            Point2D toPlayer = getGameWorld()
                    .getSingleton(EntityType.PLAYER)
                    .getCenter()
                    .subtract(entity.getCenter())
                    .normalize();

            double currentAngle = Math.toDegrees(Math.atan2(velocity.getY(), velocity.getX()));
            double targetAngle  = Math.toDegrees(Math.atan2(toPlayer.getY(), toPlayer.getX()));
            double delta        = ((targetAngle - currentAngle + 540) % 360) - 180;
            double maxTurn      = TURN_SPEED * tpf;
            double newAngle     = currentAngle + Math.signum(delta) * Math.min(Math.abs(delta), maxTurn);

            double speed = velocity.magnitude();
            double rad   = Math.toRadians(newAngle);
            velocity     = new Point2D(Math.cos(rad) * speed, Math.sin(rad) * speed);
        }

        entity.translate(velocity.getX() * tpf, velocity.getY() * tpf);
    }
}
```

## Bomb — Screen Clear

```java
private void useBomb() {
    if (geti("bombs") <= 0) return;
    inc("bombs", -1);

    // Remove all enemy bullets
    new ArrayList<>(getGameWorld().getEntitiesByType(EntityType.ENEMY_BULLET))
            .forEach(Entity::removeFromWorld);

    // Invincibility during bomb explosion
    set("invincible", true);
    runOnce(() -> set("invincible", false), Duration.seconds(2));

    // Visual: full screen white flash
    Entity flash = entityBuilder()
            .view(new Rectangle(getAppWidth(), getAppHeight(), Color.WHITE))
            .zIndex(100)
            .buildAndAttach();
    animationBuilder()
            .duration(Duration.seconds(0.5))
            .fadeOut(flash)
            .onFinished(() -> flash.removeFromWorld())
            .buildAndPlay();

    play("sounds/bomb.wav");
}
```

## Invincibility Frames

```java
@Override
protected void initGameVars(Map<String, Object> vars) {
    vars.put("lives", 3);
    vars.put("bombs", 3);
    vars.put("invincible", false);
    vars.put("grazeScore", 0);
    vars.put("bombCharge", 0);
}

private void onPlayerDeath() {
    if (geti("lives") <= 0) {
        showGameOver();
        return;
    }
    inc("lives", -1);
    inc("bombs", 1);   // grant a bomb on death (mercy mechanic)
    set("invincible", true);

    // Flash sprite for invincibility duration
    animationBuilder()
            .duration(Duration.millis(100))
            .repeat(20)
            .autoReverse(true)
            .fade(player).from(1.0).to(0.1)
            .buildAndPlay();

    runOnce(() -> set("invincible", false), Duration.seconds(2));
}
```

## Performance: Managing 1000+ Bullets

```java
// Use sensor bodies for bullets (no physics response — only overlap detection)
@Spawns("enemyBullet")
public Entity newEnemyBullet(SpawnData data) {
    Point2D dir   = data.get("dir");
    double  speed = data.getOrDefault("speed", 200.0);

    PhysicsComponent physics = new PhysicsComponent();
    physics.setBodyType(BodyType.DYNAMIC);
    physics.setFixedRotation(true);

    FixtureDef fd = new FixtureDef();
    fd.setSensor(true);   // SENSOR: no physics response — just overlap detection
    physics.addFixtureDef(fd);

    return entityBuilder(data)
            .type(EntityType.ENEMY_BULLET)
            .view(new Circle(3, Color.CRIMSON))
            .bbox(BoundingShape.circle(3))
            .with(physics)
            .with(new CollidableComponent(true))
            .with(new BulletMovementComponent(dir, speed))
            .with(new ExpireCleanComponent(Duration.seconds(8)))   // safety cleanup
            .build();
}

// Clean up when bullet leaves the play field (cheaper than checking full world bounds)
public class BulletMovementComponent extends Component {
    private final Point2D dir;
    private final double speed;

    @Override
    public void onUpdate(double tpf) {
        entity.translate(dir.getX() * speed * tpf, dir.getY() * speed * tpf);

        // Remove when off-screen
        if (entity.getX() < -20 || entity.getX() > getAppWidth() + 20
         || entity.getY() < -20 || entity.getY() > getAppHeight() + 20) {
            entity.removeFromWorld();
        }
    }
}
```

## Boss Phase State Machine

```java
public class BossComponent extends Component {
    private HPComponent hp;
    private int phase = 1;
    private double attackTimer = 0;

    @Override
    public void onUpdate(double tpf) {
        double hpRatio = (double) hp.getValue() / hp.getMaxValue();

        int newPhase = hpRatio > 0.6 ? 1 : hpRatio > 0.3 ? 2 : 3;
        if (newPhase != phase) {
            phase = newPhase;
            attackTimer = 0;
            play("sounds/phase_change.wav");
        }

        attackTimer += tpf;
        double interval = switch (phase) {
            case 1 -> 2.5;
            case 2 -> 1.5;
            case 3 -> 0.8;
            default -> 2.5;
        };

        if (attackTimer >= interval) {
            attackTimer = 0;
            switch (phase) {
                case 1 -> fireAimedBurst();
                case 2 -> { fireSpiral(); fireAimedBurst(); }
                case 3 -> { fireSpiral(); fireRing(24); }
            }
        }
    }
}
```

## Gotchas

- **Sensor bodies for bullets, not solid bodies** — solid bullets at high density interact
  with each other's physics, causing unpredictable velocity changes. Sensors have overlap
  detection only with zero physics response.
- **Player hitbox must be independent of view** — FXGL uses the `bbox` for physics and
  collision, NOT the view image size. A 4px-radius circle bbox on a 48px sprite gives proper
  bullet hell hitboxes.
- **`BulletMovementComponent` is faster than `ProjectileComponent` at scale** — `ProjectileComponent`
  uses Box2D velocity. A custom `translate` in `onUpdate` is cheaper for 1000+ bullets.
- **Graze sensor must track which bullets were already grazed** — `onCollisionBegin` fires
  every frame the contact persists in FXGL. Use a `Set<Entity>` to deduplicate.
- **`new ArrayList<>()` before removing from world** — calling `entity.removeFromWorld()`
  while iterating `getEntitiesByType()` causes `ConcurrentModificationException`. Always copy first.
- **Bomb clears bullets in next frame** — bullets destroyed this frame still process one more
  `onUpdate` and collision check. The invincibility window prevents the player dying in that gap.
- **Boss movement should use `setPosition` not physics velocity** — boss patterns are typically
  scripted (sine wave, figure-8) and are most predictable when position is computed analytically.
