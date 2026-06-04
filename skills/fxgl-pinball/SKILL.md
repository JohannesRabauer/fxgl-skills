---
name: fxgl-pinball
description: >
  Build a pinball game in FXGL — configure a kinematic flipper that rotates on key press
  using Box2D physics, set up a high-restitution DYNAMIC ball that bounces elastically,
  add circular bumpers that apply linear impulse to the ball on contact, implement a plunger
  launch with charge-and-release force, set up a drain sensor at the bottom for ball loss,
  handle multi-ball mode, implement score multipliers from bumper combos, and add ramps
  that divert the ball to an upper playfield.
  Use this skill when building a pinball game, ball-and-flipper mechanic, or any physics
  simulation with flippers, bumpers, and high-restitution ball dynamics.
  Triggers on: "pinball", "flipper", "bumper", "plunger", "drain", "multi-ball",
  "ball physics", "high restitution", "pinball table", "score multiplier bumper".
compatibility: Java 17+, FXGL 21.x
metadata:
  author: fxgl-skills
  version: "1.0"
  fxgl-version: "21.1"
  category: fxgl/game-types
allowed-tools: Read Write Edit Bash
---

# FXGL Pinball

## initSettings

```java
@Override
protected void initSettings(GameSettings settings) {
    settings.setWidth(600);
    settings.setHeight(900);   // tall portrait table
    settings.setTitle("FXGL Pinball");
}
```

## Ball

```java
@Spawns("ball")
public Entity newBall(SpawnData data) {
    PhysicsComponent physics = new PhysicsComponent();
    physics.setBodyType(BodyType.DYNAMIC);

    FixtureDef fd = new FixtureDef();
    fd.setDensity(1.0f);
    fd.setFriction(0.2f);
    fd.setRestitution(0.8f);    // bouncy — but not exactly 1.0 (Box2D energy drift)
    physics.addFixtureDef(fd);

    return entityBuilder(data)
            .type(EntityType.BALL)
            .view(new Circle(12, Color.SILVER))
            .bbox(BoundingShape.circle(12))
            .with(physics)
            .with(new CollidableComponent(true))
            .with(new BallSpeedClampComponent(300.0, 600.0))   // min/max speed
            .build();
}

// Speed clamp component — Box2D's restitution isn't exactly 1.0, so correct it each frame
public class BallSpeedClampComponent extends Component {
    private PhysicsComponent physics;
    private final double minSpeed;
    private final double maxSpeed;

    @Override
    public void onUpdate(double tpf) {
        double vx = physics.getVelocityX();
        double vy = physics.getVelocityY();
        double speed = Math.sqrt(vx * vx + vy * vy);

        if (speed < minSpeed && speed > 1) {
            double scale = minSpeed / speed;
            physics.setVelocityX(vx * scale);
            physics.setVelocityY(vy * scale);
        } else if (speed > maxSpeed) {
            double scale = maxSpeed / speed;
            physics.setVelocityX(vx * scale);
            physics.setVelocityY(vy * scale);
        }
    }
}
```

## Flippers

```java
// Left flipper: pivots at left end, swings down-to-up on Z press
@Spawns("leftFlipper")
public Entity newLeftFlipper(SpawnData data) {
    PhysicsComponent physics = new PhysicsComponent();
    physics.setBodyType(BodyType.KINEMATIC);

    return entityBuilder(data)
            .type(EntityType.FLIPPER)
            .view(new Rectangle(100, 16, Color.DARKBLUE))
            .bbox(BoundingShape.box(100, 16))
            .with(physics)
            .build();
}

// Flipper control in onUpdate:
private Entity leftFlipper, rightFlipper;
private static final double FLIPPER_SPEED = 600;   // degrees per second

@Override
protected void onUpdate(double tpf) {
    // Left flipper: Z key rotates UP (counter-clockwise)
    if (getInput().isHeld(KeyCode.Z)) {
        double targetAngle = -30;   // up position
        rotateFlipperTo(leftFlipper, targetAngle, tpf);
    } else {
        double restAngle = 30;      // down rest position
        rotateFlipperTo(leftFlipper, restAngle, tpf);
    }

    // Right flipper: / key rotates UP (clockwise on right side)
    if (getInput().isHeld(KeyCode.SLASH)) {
        rotateFlipperTo(rightFlipper, 180 + 30, tpf);
    } else {
        rotateFlipperTo(rightFlipper, 180 - 30, tpf);
    }
}

private void rotateFlipperTo(Entity flipper, double targetAngle, double tpf) {
    double current = flipper.getRotation();
    double diff = targetAngle - current;
    double maxDelta = FLIPPER_SPEED * tpf;
    double delta = Math.signum(diff) * Math.min(Math.abs(diff), maxDelta);
    flipper.setRotation(current + delta);

    // Keep KINEMATIC body in sync
    PhysicsComponent pc = flipper.getComponent(PhysicsComponent.class);
    pc.setAngularVelocity(Math.toRadians(delta / tpf));
}
```

## Bumpers

```java
@Spawns("bumper")
public Entity newBumper(SpawnData data) {
    PhysicsComponent physics = new PhysicsComponent();
    physics.setBodyType(BodyType.STATIC);

    FixtureDef fd = new FixtureDef();
    fd.setRestitution(1.2f);   // over-1 restitution for bumper bounce-back effect
    physics.addFixtureDef(fd);

    return entityBuilder(data)
            .type(EntityType.BUMPER)
            .view(new Circle(20, Color.ORANGE))
            .bbox(BoundingShape.circle(20))
            .with(physics)
            .with(new CollidableComponent(true))
            .set("points", data.getOrDefault("points", 100))
            .build();
}

@Override
protected void initPhysics() {
    onCollisionBegin(EntityType.BALL, EntityType.BUMPER, (ball, bumper) -> {
        // Apply impulse away from bumper center
        Point2D dir = ball.getCenter().subtract(bumper.getCenter()).normalize();
        PhysicsComponent ballPhysics = ball.getComponent(PhysicsComponent.class);
        ballPhysics.applyLinearImpulse(dir.multiply(8.0));

        // Score
        int points = bumper.getInt("points");
        inc("score", points * geti("multiplier"));

        // Flash bumper
        flashBumper(bumper);
        play("sounds/bumper.wav");

        // Multiplier combo: consecutive bumper hits within 1s raise multiplier
        inc("multiplier", 1);
        set("multiplier", Math.min(8, geti("multiplier")));
        runOnce(() -> set("multiplier", Math.max(1, geti("multiplier") - 1)), Duration.seconds(1));
    });
}
```

## Plunger Launch

```java
private double chargeLevel = 0;
private boolean charging   = false;

@Override
protected void initInput() {
    onKeyDown(KeyCode.ENTER, () -> {
        charging = true;
        chargeLevel = 0;
    });
    onKeyUp(KeyCode.ENTER, () -> {
        if (charging) {
            launchBall(chargeLevel);
            charging = false;
            chargeLevel = 0;
        }
    });
}

@Override
protected void onUpdate(double tpf) {
    if (charging) {
        chargeLevel = Math.min(1.0, chargeLevel + tpf * 1.2);
        updatePlungerVisual(chargeLevel);
    }
    // ... flipper updates ...
}

private void launchBall(double charge) {
    double minForce = 200.0;
    double maxForce = 600.0;
    double force = minForce + charge * (maxForce - minForce);

    ball.getComponent(PhysicsComponent.class)
        .setLinearVelocity(0, -force);  // upward

    play("sounds/launch.wav");
}
```

## Drain Sensor

```java
// Sensor entity at bottom of table:
@Spawns("drain")
public Entity newDrain(SpawnData data) {
    return entityBuilder(data)
            .type(EntityType.DRAIN)
            .bbox(BoundingShape.box(getAppWidth(), 20))
            .with(new CollidableComponent(true))
            .build();
}

@Override
protected void initPhysics() {
    onCollisionBegin(EntityType.BALL, EntityType.DRAIN, (ball, drain) -> {
        ball.removeFromWorld();
        dec("balls", 1);
        play("sounds/drain.wav");

        if (geti("balls") > 0) {
            runOnce(this::serveBall, Duration.seconds(1.5));
        } else {
            gameOver();
        }
    });
}

private void serveBall() {
    ball = spawn("ball", 540, 820);   // plunger lane position
}
```

## Multi-Ball Mode

```java
private void activateMultiBall() {
    int extraBalls = 2;
    for (int i = 0; i < extraBalls; i++) {
        Entity extra = spawn("ball", getAppWidth() / 2.0, getAppHeight() / 2.0);
        // Random initial velocity
        double angle = Math.toRadians(FXGLMath.random(30, 150));
        extra.getComponent(PhysicsComponent.class)
             .setLinearVelocity(Math.cos(angle) * 400, -Math.sin(angle) * 400);
    }
    play("sounds/multiball.wav");
}
```

## Table Geometry

```java
@Override
protected void initGame() {
    // Static walls: table sides and top
    spawnStaticWall(0,   0,   20,  getAppHeight());   // left wall
    spawnStaticWall(580, 0,   20,  getAppHeight());   // right wall
    spawnStaticWall(0,   0,   600, 20);               // top wall

    // Angled side gutters (kickers)
    spawnRotatedWall(20,  700, 150, 12, -30);   // left kicker
    spawnRotatedWall(430, 700, 150, 12,  30);   // right kicker

    // Bumpers
    spawn("bumper", new SpawnData(200, 250).put("points", 100));
    spawn("bumper", new SpawnData(300, 200).put("points", 100));
    spawn("bumper", new SpawnData(380, 260).put("points", 100));

    // Flippers
    leftFlipper  = spawn("leftFlipper",  new SpawnData(80,  820));
    rightFlipper = spawn("rightFlipper", new SpawnData(370, 820));

    // Drain
    spawn("drain", new SpawnData(0, 880));

    serveBall();
}
```

## Gotchas

- **`BallSpeedClampComponent` is mandatory** — Box2D's restitution coefficient is not exactly
  1.0 due to floating-point rounding. The ball gradually slows down or speeds up over time
  without active speed correction. Clamp velocity to `[minSpeed, maxSpeed]` each frame.
- **Flipper collision must use KINEMATIC body** — STATIC flippers don't transfer momentum to
  the ball. KINEMATIC bodies carry velocity and push the ball correctly in Box2D.
- **Bumper restitution > 1.0 is unusual but intentional** — `setRestitution(1.2f)` on bumpers
  ensures the ball speeds up slightly on each bumper hit, maintaining lively play.
- **Angular velocity for flipper physics** — simply rotating the entity view doesn't update
  the Box2D body for collision purposes. Set `physics.setAngularVelocity()` in sync with the
  visual rotation to ensure the moving flipper actually "hits" the ball.
- **Multi-ball drain tracking** — all balls share one pool. Drain triggers per ball, not per "life".
  Only decrement `balls` when the LAST active ball drains. Track count via `getEntitiesByType(BALL).size()`.
- **Table boundary geometry must be STATIC** — walls, gutters, and guides are STATIC bodies.
  The ball's restitution combined with STATIC high-friction surfaces produces realistic behavior.
- **Plunger lane isolation** — keep the plunger lane separate from the main playfield with a
  one-way gate (only lets ball go up from the plunger lane into the table).
