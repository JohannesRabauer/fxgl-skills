---
name: fxgl-physics-collision
description: >
  Configure Box2D physics in FXGL — add PhysicsComponent to entities, set body types
  (DYNAMIC, STATIC, KINEMATIC), define fixture properties (density, friction, restitution),
  handle collision callbacks (onCollisionBegin, onCollision, onCollisionEnd), detect
  collectibles, filter collisions, perform raycasting, and set up gravity. Use this skill
  when adding physics to a game, implementing platformer jump/gravity, handling bullet hits,
  detecting player picking up items, or setting up wall/floor colliders.
  Triggers on: "Box2D", "PhysicsComponent", "collision", "gravity", "physics body",
  "BodyType", "raycast", "platformer physics", "onCollisionBegin".
compatibility: Java 17+, FXGL 21.x — Box2D is bundled, no extra dependency needed.
metadata:
  author: fxgl-skills
  version: "1.0"
  fxgl-version: "21.1"
  category: fxgl/physics
allowed-tools: Read Write Edit Bash
---

# FXGL Physics & Collision

## Enabling Physics on an Entity

Every physics entity needs three things: a bounding box, `collidable()`, and `PhysicsComponent`.

```java
PhysicsComponent physics = new PhysicsComponent();
physics.setBodyType(BodyType.DYNAMIC);  // moves freely under forces

// Optional fixture properties (material feel)
FixtureDef fd = new FixtureDef()
        .density(1.0f)        // mass per area
        .friction(0.3f)       // surface friction (0=ice, 1=rough)
        .restitution(0.0f);   // bounciness (0=no bounce, 1=perfect bounce)
physics.setFixtureDef(fd);

Entity player = entityBuilder()
        .type(EntityType.PLAYER)
        .at(100, 100)
        .view("player.png")
        .bbox(BoundingShape.box(40, 60))   // matches view size
        .collidable()
        .with(physics)
        .buildAndAttach();
```

## Body Types

| Type | Moves by | Typical use |
|------|----------|-------------|
| `BodyType.STATIC` | Never | Ground, walls, platforms, triggers |
| `BodyType.DYNAMIC` | Forces, impulses, velocity | Player, enemies, projectiles |
| `BodyType.KINEMATIC` | Manual velocity (ignores gravity) | Moving platforms, conveyor belts |

## Setting Up Gravity

```java
// In initPhysics() — must call before entities are added with physics
@Override
protected void initPhysics() {
    getPhysicsWorld().setGravity(0, 980);   // y > 0 = gravity downward
    // No gravity: getPhysicsWorld().setGravity(0, 0);
}
```

## Bounding Shapes

```java
// Axis-aligned rectangle (most common, fastest)
BoundingShape.box(40, 60)

// Circle (rolling objects, collectibles)
BoundingShape.circle(20)

// Chain polygon (irregular shapes, sloped terrain from Tiled)
BoundingShape.polygon(new Point2D[]{
    new Point2D(0, 0), new Point2D(40, 0), new Point2D(40, 60)
})

// Chain shape (one-sided, for platforms player can jump through from below)
BoundingShape.chain(new Point2D[]{new Point2D(0,0), new Point2D(200,0)})
```

## Collision Handlers

Register all collision handlers in `initPhysics()`:

```java
@Override
protected void initPhysics() {
    getPhysicsWorld().setGravity(0, 980);

    // Fires once when two types first touch
    onCollisionBegin(EntityType.PLAYER, EntityType.COIN, (player, coin) -> {
        coin.removeFromWorld();
        inc("coins", +1);
        play("pickup.wav");
    });

    // Fires every frame while overlapping
    onCollision(EntityType.PLAYER, EntityType.LAVA, (player, lava) -> {
        inc("health", -1);
    });

    // Fires once when they separate
    onCollisionEnd(EntityType.PLAYER, EntityType.GROUND, (player, ground) -> {
        player.getComponent(PlayerComponent.class).setOnGround(false);
    });

    // Convenience: collectible pattern (removes collectible, fires callback)
    onCollisionCollectible(EntityType.PLAYER, EntityType.POWERUP, powerup -> {
        applyPowerup(powerup);
    });

    // One-time only collision (first contact then never again per entity pair)
    onCollisionOneTimeOnly(EntityType.PLAYER, EntityType.CHECKPOINT, (player, cp) -> {
        saveCheckpoint(cp);
    });
}
```

## Custom CollisionHandler (class-based)

Use when you need access to the entity types inside the handler class or for complex logic:

```java
public class PlayerEnemyHandler extends CollisionHandler {

    public PlayerEnemyHandler() {
        super(EntityType.PLAYER, EntityType.ENEMY);
    }

    @Override
    protected void onCollisionBegin(Entity player, Entity enemy) {
        int damage = enemy.getComponent(DamageComponent.class).getDamage();
        player.getComponent(HPComponent.class).damage(damage);
        enemy.removeFromWorld();
        playSound("hit.wav");
    }

    @Override
    protected void onCollision(Entity player, Entity enemy) { /* continuous */ }

    @Override
    protected void onCollisionEnd(Entity player, Entity enemy) { /* separated */ }
}

// Register
getPhysicsWorld().addCollisionHandler(new PlayerEnemyHandler());
```

## Platformer Physics Pattern

```java
// In initSettings:
settings.setWidth(1280); settings.setHeight(720);

// In initPhysics:
getPhysicsWorld().setGravity(0, 1250);

// Player entity setup:
PhysicsComponent physics = new PhysicsComponent();
physics.setBodyType(BodyType.DYNAMIC);
physics.setFixtureDef(new FixtureDef().friction(0.0f));  // zero friction for crisp movement

// CRITICAL: prevent rotation — players should not tip over
physics.addGroundSensor(new HitBox("sensor", new Point2D(5, 60), BoundingShape.box(30, 5)),
        () -> onGroundSensor());

// Jump in PlayerComponent:
public void jump() {
    if (isOnGround) {
        physics.setVelocityY(-600);
        isOnGround = false;
    }
}

// Horizontal movement (set X velocity; don't add to existing)
public void moveLeft()  { physics.setVelocityX(-200); }
public void moveRight() { physics.setVelocityX( 200); }
public void stop()      { physics.setVelocityX(0); }

// Ground detection
onCollisionBegin(EntityType.PLAYER, EntityType.PLATFORM, (p, g) -> isOnGround = true);
onCollisionEnd  (EntityType.PLAYER, EntityType.PLATFORM, (p, g) -> isOnGround = false);
```

## Applying Forces and Impulses

```java
PhysicsComponent pc = entity.getComponent(PhysicsComponent.class);

// Instant velocity change (teleport-like push)
pc.setVelocityX(300);
pc.setVelocityY(-400);

// Get current velocity
double vx = pc.getVelocityX();
double vy = pc.getVelocityY();

// Apply continuous force (accumulates each frame)
pc.applyBodyForce(new Point2D(0, -5000));   // lift upward

// Apply impulse (single-frame push, like a jump)
pc.applyBodyImpulse(new Point2D(200, -300));

// Apply at specific point on body (creates torque)
pc.applyForceToCenter(new Point2D(100, 0));
```

## Sensor Bodies (Ghost / Trigger Zone)

Sensors detect overlaps but exert no physical force:

```java
HitBox sensor = new HitBox("zone", new Point2D(0, 0), BoundingShape.box(100, 100));

PhysicsComponent pc = new PhysicsComponent();
pc.setBodyType(BodyType.STATIC);
pc.setOnPhysicsInitialized(() -> {
    pc.getBody().getFixtureList().forEach(f -> f.setSensor(true));
});

Entity trigger = entityBuilder()
        .bbox(sensor)
        .with(pc)
        .type(EntityType.TRIGGER)
        .collidable()
        .buildAndAttach();

// Collision still fires for sensors
onCollisionBegin(EntityType.PLAYER, EntityType.TRIGGER, (p, t) -> startCutscene());
```

## Raycast

```java
// Fire a ray from player to mouse position
Point2D start = player.getCenter();
Point2D end   = getInput().getMousePositionWorld();

getPhysicsWorld().raycast((fixture, point, normal, fraction) -> {
    Entity hit = (Entity) fixture.getBody().getUserData();
    if (hit != null && hit.isType(EntityType.ENEMY)) {
        hit.getComponent(HPComponent.class).damage(50);
        return 0;   // stop at first hit
    }
    return 1;       // continue to next fixture
}, start, end);
```

## Collision Filtering (Category/Mask Bits)

```java
// Define bit flags (up to 16 categories)
short PLAYER   = 0x0001;
short ENEMY    = 0x0002;
short BULLET   = 0x0004;
short PLATFORM = 0x0008;

// Bullet only collides with enemies
FixtureDef bulletFD = new FixtureDef()
        .categoryBits(BULLET)
        .maskBits(ENEMY);  // only hits enemies

// Player collides with everything
FixtureDef playerFD = new FixtureDef()
        .categoryBits(PLAYER)
        .maskBits((short)(ENEMY | PLATFORM));
```

## Gotchas

- **`setBodyType` before `buildAndAttach()`** — changing body type after the entity is in
  the world has no effect unless you recreate the physics body.
- **Zero friction on player** — default friction causes players to "stick" to walls when
  jumping. Set `FixtureDef.friction(0.0f)` on the player fixture.
- **Collision callbacks run on the physics thread** — avoid spawning/removing entities
  directly in callbacks. Wrap with `runOnce(() -> entity.removeFromWorld(), Duration.ZERO)`.
- **`collidable()` is required** — without it, the PhysicsComponent registers the body
  but no collision callbacks will fire.
- **Static bodies don't move** even if you call `setPosition()` directly. Use `KINEMATIC`
  for platforms that move under programmatic control.
- **High-speed objects tunnel** through thin walls. Increase `PhysicsTick` frequency or
  use continuous collision detection (CCD) via `physics.setCCDEnabled(true)`.
- **Gravity affects ALL dynamic bodies** — use `BodyType.KINEMATIC` for top-down games
  with no gravity, or `setGravity(0, 0)` for the entire world.
- **Screen bounds**: use `entityBuilder().buildScreenBoundsAndAttach(40)` to get invisible
  STATIC walls around the viewport without writing manual entity code.
