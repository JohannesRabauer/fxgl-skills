---
name: fxgl-platformer
description: >
  Build a side-scrolling platformer in FXGL — set up physics with gravity for a player
  entity, implement jump with coyote time and jump buffer, handle one-way pass-through
  platforms, attach moving kinematic platforms the player can ride, bind the camera
  viewport to the player with world bounds, add parallax scrolling background layers, load
  Tiled TMX levels with solid tile collision, detect pit/fall-out-of-bounds deaths, stomp
  enemies from above, and implement a checkpoint and respawn system. Use this skill when
  building a Mario-style, precision platformer, run-and-jump, or any side-scrolling game
  with gravity-driven movement.
triggers:
  - platformer
  - side-scroller
  - jump
  - gravity
  - platform
  - coyote time
  - jump buffer
  - one-way platform
  - moving platform
  - parallax
  - stomp
  - Mario-style
compatibility: >
  Java 17+, FXGL 21.x
category: fxgl/game-types
tags:
  - fxgl
  - java
  - javafx
  - game-types
  - platformer
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
# FXGL Platformer

## Player Entity Setup

```java
// In your EntityFactory
@Spawns("player")
public Entity newPlayer(SpawnData data) {
    PhysicsComponent physics = new PhysicsComponent();
    physics.setBodyType(BodyType.DYNAMIC);

    FixtureDef fd = new FixtureDef();
    fd.setFriction(0.0f);        // zero friction — prevent sticking to walls
    fd.setDensity(1.0f);
    physics.addFixtureDef(fd);

    return entityBuilder(data)
            .type(EntityType.PLAYER)
            .view("player.png")
            .bbox(BoundingShape.box(32, 48))
            .with(physics)
            .with(new CollidableComponent(true))
            .with(new PlayerComponent())
            .build();
}
```

## PlayerComponent — Jump, Coyote Time, Jump Buffer

```java
public class PlayerComponent extends Component {
    private PhysicsComponent physics;

    private boolean isGrounded = false;
    private double coyoteTimer = 0;
    private double jumpBufferTimer = 0;

    private static final double JUMP_FORCE      = 14.0;
    private static final double MOVE_SPEED      = 200.0;
    private static final double COYOTE_TIME     = 0.15;  // seconds after leaving ledge
    private static final double JUMP_BUFFER     = 0.12;  // seconds jump is remembered before landing

    @Override
    public void onUpdate(double tpf) {
        // Coyote time: decrement while not grounded
        if (!isGrounded) coyoteTimer = Math.max(0, coyoteTimer - tpf);
        else             coyoteTimer = COYOTE_TIME;

        // Jump buffer: decrement
        if (jumpBufferTimer > 0) jumpBufferTimer -= tpf;

        // Apply buffered jump when landing
        if (isGrounded && jumpBufferTimer > 0) {
            jumpBufferTimer = 0;
            performJump();
        }

        // Horizontal movement
        double dx = 0;
        if (getInput().isHeld(KeyCode.A) || getInput().isHeld(KeyCode.LEFT))  dx -= MOVE_SPEED;
        if (getInput().isHeld(KeyCode.D) || getInput().isHeld(KeyCode.RIGHT)) dx += MOVE_SPEED;

        physics.setVelocityX(dx);

        // Face direction
        if (dx < 0) entity.setScaleX(-1);
        else if (dx > 0) entity.setScaleX(1);

        // Variable jump height: releasing jump early reduces height
        if (!getInput().isHeld(KeyCode.SPACE) && physics.getVelocityY() < 0) {
            physics.setVelocityY(physics.getVelocityY() * 0.85);
        }

        isGrounded = false;  // reset each frame — set true by collision handler
    }

    public void onJumpPressed() {
        if (coyoteTimer > 0) {
            coyoteTimer = 0;
            performJump();
        } else {
            jumpBufferTimer = JUMP_BUFFER;  // remember the jump
        }
    }

    private void performJump() {
        physics.setVelocityY(-JUMP_FORCE);
        play("sounds/jump.wav");
    }

    public void setGrounded(boolean grounded) {
        this.isGrounded = grounded;
    }

    public boolean isGrounded() { return isGrounded; }
}
```

## Input Binding

```java
@Override
protected void initInput() {
    onKeyDown(KeyCode.SPACE, () -> player.getComponent(PlayerComponent.class).onJumpPressed());
    onKeyDown(KeyCode.UP,    () -> player.getComponent(PlayerComponent.class).onJumpPressed());
}
```

## Ground Detection via Sensor

```java
// Add a thin sensor below player feet in factory:
entityBuilder(data)
    // ... other setup
    .with(physics)
    .buildAndAttach();

// Use a separate sensor entity, or detect via collision callbacks:
@Override
protected void initPhysics() {
    // Player landing on any PLATFORM or GROUND entity
    onCollisionBegin(EntityType.PLAYER, EntityType.GROUND, (player, ground) -> {
        double playerBottom = player.getY() + player.getHeight();
        double groundTop    = ground.getY();
        if (playerBottom <= groundTop + 8) {   // small tolerance
            player.getComponent(PlayerComponent.class).setGrounded(true);
        }
    });

    onCollisionEnd(EntityType.PLAYER, EntityType.GROUND, (player, ground) -> {
        // don't reset grounded here — let PlayerComponent.onUpdate handle it
    });
}
```

## One-Way Platforms

```java
// In EntityFactory — a platform you can jump through from below
@Spawns("oneWayPlatform")
public Entity newOneWayPlatform(SpawnData data) {
    PhysicsComponent physics = new PhysicsComponent();
    physics.setBodyType(BodyType.STATIC);

    // One-way: only collide from above
    FixtureDef fd = new FixtureDef();
    fd.restitution = 0.0f;
    physics.addFixtureDef(fd);

    return entityBuilder(data)
            .type(EntityType.ONE_WAY_PLATFORM)
            .view(new Rectangle(data.<Integer>get("width"), 12, Color.BROWN))
            .bbox(BoundingShape.box(data.get("width"), 12))
            .with(physics)
            .build();
}

// In initPhysics — use pre-solve to cancel collision from below
// (requires PhysicsContactListener override — see FXGL physics collision skill)
```

## Moving Platforms

```java
@Spawns("movingPlatform")
public Entity newMovingPlatform(SpawnData data) {
    PhysicsComponent physics = new PhysicsComponent();
    physics.setBodyType(BodyType.KINEMATIC);

    Entity platform = entityBuilder(data)
            .type(EntityType.GROUND)
            .view(new Rectangle(128, 16, Color.DARKGREEN))
            .bbox(BoundingShape.box(128, 16))
            .with(physics)
            .with(new MovingPlatformComponent(data.get("startX"), data.get("endX"), 80))
            .build();
    return platform;
}

public class MovingPlatformComponent extends Component {
    private PhysicsComponent physics;
    private final double startX, endX, speed;
    private int direction = 1;

    @Override
    public void onUpdate(double tpf) {
        physics.setVelocityX(direction * speed);
        if (entity.getX() >= endX) direction = -1;
        if (entity.getX() <= startX) direction = 1;
    }
}
```

## Camera Binding with Bounds

```java
@Override
protected void initGame() {
    // After loading the level from Tiled:
    setLevelFromMap("level1.tmx");

    // Bind camera to player — will follow player continuously
    Viewport viewport = getGameScene().getViewport();
    viewport.bindToEntity(player, getAppWidth() / 2.0, getAppHeight() / 2.0);

    // Clamp camera to level bounds (world size from Tiled)
    viewport.setBounds(-64, 0, LEVEL_WIDTH * 32, LEVEL_HEIGHT * 32);
}
```

## Parallax Background

```java
// Create background layers that scroll at different speeds
private void initParallax() {
    // Far background (slowest)
    Entity bg0 = entityBuilder()
            .at(-100, 0)
            .view(new ImageView(image("bg_far.png")))
            .zIndex(-3)
            .buildAndAttach();

    // Mid background
    Entity bg1 = entityBuilder()
            .at(0, 0)
            .view(new ImageView(image("bg_mid.png")))
            .zIndex(-2)
            .buildAndAttach();

    // Update parallax in onUpdate
}

@Override
protected void onUpdate(double tpf) {
    double camX = getGameScene().getViewport().getX();
    bg0.setX(camX * 0.1);   // 10% of camera speed
    bg1.setX(camX * 0.4);   // 40% of camera speed
}
```

## Pit Detection

```java
// Sensor at the bottom of the world to detect falling out
@Spawns("pitSensor")
public Entity newPitSensor(SpawnData data) {
    return entityBuilder(data)
            .type(EntityType.PIT)
            .bbox(BoundingShape.box(LEVEL_WIDTH * 32, 64))
            .with(new PhysicsComponent())   // sensor
            .build();
}

// In initPhysics:
onCollisionBegin(EntityType.PLAYER, EntityType.PIT, (player, pit) -> {
    onPlayerDeath();
});
```

## Enemy Stomp Pattern

```java
// In initPhysics:
onCollisionBegin(EntityType.PLAYER, EntityType.ENEMY, (player, enemy) -> {
    PlayerComponent pc = player.getComponent(PlayerComponent.class);
    double playerBottomY = player.getY() + player.getHeight();
    double enemyTopY     = enemy.getY();

    // Stomp: player is falling (velocity > 0) and above the enemy
    if (player.getComponent(PhysicsComponent.class).getVelocityY() > 0
            && playerBottomY <= enemyTopY + 12) {
        enemy.removeFromWorld();
        inc("score", 100);
        // Bounce player up
        player.getComponent(PhysicsComponent.class).setVelocityY(-8);
        play("sounds/stomp.wav");
    } else {
        onPlayerHurt(player);
    }
});
```

## Checkpoint System

```java
// In initPhysics:
onCollisionBegin(EntityType.PLAYER, EntityType.CHECKPOINT, (player, checkpoint) -> {
    if (!checkpoint.getBoolean("activated")) {
        checkpoint.set("activated", true);
        // Save spawn point
        set("spawnX", checkpoint.getX());
        set("spawnY", checkpoint.getY());
        checkpoint.getViewComponent().setOpacity(0.5);  // visual feedback
        play("sounds/checkpoint.wav");
    }
});

private void respawnPlayer() {
    player.setPosition(getd("spawnX"), getd("spawnY"));
    // Restore HP, reset velocity
    player.getComponent(PhysicsComponent.class).setVelocityX(0);
    player.getComponent(PhysicsComponent.class).setVelocityY(0);
}
```

## Gotchas

- **Zero friction on player is critical** — without `fd.setFriction(0)`, the player sticks
  to walls and slides along them due to Box2D's default friction. Always set friction=0 on
  the player body fixture.
- **`setVelocityX` not `applyForce` for horizontal movement** — force-based movement feels
  sluggish and overshoots. Velocity setting gives tight, predictable control.
- **Coyote time and jump buffer must both be implemented** — without them, jumps at ledge
  edges feel unresponsive and players feel cheated. Both are industry-standard patterns.
- **`isGrounded` reset each frame** — reset `isGrounded = false` in `onUpdate`, then set
  it to `true` only when collision confirms it. Do NOT set it in `onCollisionEnd` because
  that fires when one platform ends while another begins.
- **Moving platforms: player must be a DYNAMIC body** — kinematic-on-kinematic collision
  doesn't work in Box2D. Player must be DYNAMIC for moving platform physics to transfer.
- **Viewport `bindToEntity` centers on entity origin, not center** — pass `appWidth/2,
  appHeight/2` as offset to center the player on screen, or adjust for different screen regions.
- **Parallax layers need to be at a low zIndex** — use `zIndex(-3)` or lower so game
  entities render in front. FXGL defaults entities to zIndex 0.
