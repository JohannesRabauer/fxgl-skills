---
name: fxgl-breakout
description: >
  Build a Breakout or Arkanoid style game in FXGL — control a paddle horizontally, keep a ball
  at constant speed, bounce it off walls, paddle, and bricks, load brick layouts from level
  data, angle the reflection based on paddle hit position, handle lives and bottom-drain loss,
  spawn falling power-ups, and finish the level when all breakable bricks are destroyed.
triggers:
  - breakout
  - arkanoid
  - paddle ball
  - brick breaker
  - multiball
  - paddle bounce
  - brick hp
  - power-up drop
  - lose life on drain
compatibility: >
  Java 17+, FXGL 21.x. Uses FXGL 2D physics and collision handlers.
category: fxgl/game-types
tags:
  - fxgl
  - java
  - javafx
  - game-types
  - breakout
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
# FXGL Breakout / Arkanoid

## Core Setup

Use these entity roles:

- `PADDLE` — kinematic horizontal controller
- `BALL` — dynamic body with manual speed correction
- `BRICK` — static collidable block with optional HP
- `POWERUP` — falling collectible
- `DRAIN` — bottom sensor that costs a life

## Paddle Entity

```java
@Spawns("paddle")
public Entity newPaddle(SpawnData data) {
    var physics = new PhysicsComponent();
    physics.setBodyType(BodyType.KINEMATIC);

    return entityBuilder(data)
            .type(EntityType.PADDLE)
            .bbox(BoundingShape.box(120, 20))
            .with(physics)
            .collidable()
            .build();
}

@Override
protected void initInput() {
    onMouseMove(e -> {
        double x = clamp(e.getX() - paddle.getWidth() / 2.0, 0, getAppWidth() - paddle.getWidth());
        paddle.setX(x);
    });
}
```

## Ball Entity and Constant Speed

```java
private static final double BALL_SPEED = 420;

@Spawns("ball")
public Entity newBall(SpawnData data) {
    var physics = new PhysicsComponent();
    physics.setBodyType(BodyType.DYNAMIC);

    var fd = new FixtureDef();
    fd.setRestitution(1.0f);
    fd.setFriction(0.0f);
    physics.addFixtureDef(fd);

    return entityBuilder(data)
            .type(EntityType.BALL)
            .bbox(BoundingShape.circle(8))
            .with(physics)
            .collidable()
            .with(new BallComponent())
            .build();
}

public class BallComponent extends Component {
    private PhysicsComponent physics;

    @Override
    public void onAdded() {
        physics.setLinearVelocity(BALL_SPEED * 0.6, -BALL_SPEED);
    }

    @Override
    public void onUpdate(double tpf) {
        Point2D v = physics.getLinearVelocity();
        if (v.magnitude() == 0) {
            physics.setLinearVelocity(BALL_SPEED * 0.6, -BALL_SPEED);
            return;
        }

        Point2D corrected = v.normalize().multiply(BALL_SPEED);
        physics.setLinearVelocity(corrected);
    }
}
```

## Paddle Reflection by Hit Position

```java
@Override
protected void initPhysics() {
    onCollisionBegin(EntityType.BALL, EntityType.PADDLE, (ball, paddle) -> {
        var physics = ball.getComponent(PhysicsComponent.class);

        double relativeX = (ball.getCenter().getX() - paddle.getCenter().getX()) / (paddle.getWidth() / 2.0);
        relativeX = clamp(relativeX, -1.0, 1.0);

        double angle = Math.toRadians(relativeX * 75.0);
        double vx = Math.sin(angle) * BALL_SPEED;
        double vy = -Math.cos(angle) * BALL_SPEED;

        physics.setLinearVelocity(vx, vy);
    });
}
```

## Brick Grid and HP

```java
private void spawnLevel(int[][] layout) {
    int brickW = 64;
    int brickH = 24;
    int topOffset = 80;

    for (int row = 0; row < layout.length; row++) {
        for (int col = 0; col < layout[row].length; col++) {
            int type = layout[row][col];
            if (type == 0)
                continue;

            spawn("brick", new SpawnData(col * brickW, row * brickH + topOffset).put("hp", type));
        }
    }
}

@Spawns("brick")
public Entity newBrick(SpawnData data) {
    int hp = data.get("hp");

    return entityBuilder(data)
            .type(EntityType.BRICK)
            .bbox(BoundingShape.box(64, 24))
            .collidable()
            .with(new BrickComponent(hp))
            .build();
}
```

## Brick Collision and Power-Ups

```java
onCollisionBegin(EntityType.BALL, EntityType.BRICK, (ball, brick) -> {
    BrickComponent bc = brick.getComponent(BrickComponent.class);
    bc.hit();

    if (bc.isDestroyed()) {
        if (randomBoolean(0.30)) {
            spawn("powerup", brick.getCenter());
        }
        brick.removeFromWorld();
        inc("score", 100);
        checkLevelClear();
    }
});

private void checkLevelClear() {
    boolean anyBreakable = !getGameWorld().getEntitiesByType(EntityType.BRICK).isEmpty();
    if (!anyBreakable) {
        showMessage("Level clear!");
    }
}
```

## Drain Sensor and Lives

```java
@Spawns("drain")
public Entity newDrain(SpawnData data) {
    return entityBuilder(data)
            .type(EntityType.DRAIN)
            .bbox(BoundingShape.box(getAppWidth(), 16))
            .collidable()
            .build();
}

onCollisionBegin(EntityType.BALL, EntityType.DRAIN, (ball, drain) -> {
    ball.removeFromWorld();

    if (getGameWorld().getEntitiesByType(EntityType.BALL).isEmpty()) {
        inc("lives", -1);
        if (geti("lives") > 0) {
            spawn("ball", paddle.getX() + paddle.getWidth() / 2.0, paddle.getY() - 24);
        } else {
            showGameOver();
        }
    }
});
```

## Multi-Ball

```java
private void spawnExtraBalls(Entity sourceBall) {
    var v = sourceBall.getComponent(PhysicsComponent.class).getLinearVelocity();

    for (double angle : List.of(-25.0, 25.0)) {
        Point2D dir = v.normalize();
        Point2D rotated = dir.rotate(angle);

        Entity extra = spawn("ball", sourceBall.getCenter());
        extra.getComponent(PhysicsComponent.class).setLinearVelocity(rotated.multiply(BALL_SPEED));
    }
}
```

## Gotchas

- **Restitution alone is not enough** — Box2D collisions lose speed over time, so the ball must
  be re-normalized every frame.
- **Paddle should be kinematic** — directly positioning a dynamic paddle causes unstable collisions.
- **Center hits need a small upward angle** — a perfectly vertical bounce can create boring loops.
- **Drain logic must consider multi-ball** — only cost a life when the final active ball is gone.
