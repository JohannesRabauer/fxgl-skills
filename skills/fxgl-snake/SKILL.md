---
name: fxgl-snake
description: >
  Build a Snake game in FXGL — move on a discrete grid by timer steps, store the body as a deque
  of grid cells, grow when food is eaten, buffer direction changes, detect self-collision and
  wall rules, increase speed as the snake grows, and support multiple food types or wrap mode.
triggers:
  - snake
  - grid movement
  - deque body
  - food spawn
  - no 180 turn
  - wrap mode
  - self collision
  - step timer
compatibility: >
  Java 17+, FXGL 21.x.
category: fxgl/game-types
tags:
  - fxgl
  - java
  - javafx
  - game-types
  - snake
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
# FXGL Snake

## Grid Model

```java
private static final int COLS = 20;
private static final int ROWS = 20;
private static final int CELL = 32;

private final Deque<Point2D> body = new ArrayDeque<>();
private final Queue<Direction> directionQueue = new ArrayDeque<>();
private Direction currentDirection = Direction.RIGHT;
private Point2D foodCell = new Point2D(10, 10);
private boolean growNextStep = false;
```

## Game Start

```java
private void resetSnake() {
    body.clear();
    body.addFirst(new Point2D(5, 5));
    body.addLast(new Point2D(4, 5));
    body.addLast(new Point2D(3, 5));

    currentDirection = Direction.RIGHT;
    directionQueue.clear();
    growNextStep = false;
    spawnFood();
}
```

## Step-Based Movement

Move by timer ticks, not by per-frame translation.

```java
private Duration stepDuration = Duration.seconds(0.18);

private void scheduleStepLoop() {
    run(this::step, stepDuration);
}

private void step() {
    consumeBufferedDirection();

    Point2D head = body.peekFirst();
    Point2D next = head.add(currentDirection.dx, currentDirection.dy);

    if (isWallDeath() && isOutside(next)) {
        gameOver();
        return;
    }

    if (isWrapMode()) {
        next = wrap(next);
    }

    if (body.contains(next)) {
        gameOver();
        return;
    }

    body.addFirst(next);

    if (next.equals(foodCell)) {
        growNextStep = true;
        inc("score", 10);
        spawnFood();
    }

    if (!growNextStep) {
        body.removeLast();
    } else {
        growNextStep = false;
    }

    redrawSnake();
    updateSpeed();
}
```

## Direction Buffer

```java
private void onDirectionInput(Direction nextDirection) {
    if (nextDirection == currentDirection.opposite())
        return;

    if (directionQueue.size() < 2) {
        directionQueue.offer(nextDirection);
    }
}

private void consumeBufferedDirection() {
    Direction queued = directionQueue.poll();
    if (queued != null && queued != currentDirection.opposite()) {
        currentDirection = queued;
    }
}
```

## Food Placement

```java
private void spawnFood() {
    Point2D candidate;
    do {
        candidate = new Point2D(random(0, COLS - 1), random(0, ROWS - 1));
    } while (body.contains(candidate));

    foodCell = candidate;
}
```

## Speed Scaling

```java
private void updateSpeed() {
    double interval = Math.max(0.05, 0.18 - (body.size() - 3) * 0.005);
    stepDuration = Duration.seconds(interval);
    // Reschedule if your timer implementation requires cancel + restart
}
```

## Rendering Pattern

Render the snake body from the deque each step. The safest approach is to rebuild the visible
segments or reuse a parallel list of body entities.

## Food Variants

Use a small enum and separate rewards:

- normal food → growth + score
- speed food → temporary acceleration
- bonus food → higher score, expires quickly

## Gotchas

- **Never use continuous movement** — Snake must move by discrete cell steps or turns feel wrong.
- **Block opposite-direction inputs** — 180° turns create unavoidable self-collisions.
- **Food must never spawn inside the body** — always retry until you find an empty cell.
- **Speed changes often need timer rescheduling** — if the loop interval is cached, updating a
  variable alone may not change the actual timer period.
