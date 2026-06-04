# Game Type — Breakout / Arkanoid

Covers ball-and-paddle games. Player controls a paddle, ball bounces off bricks, bricks destroyed on contact, power-ups fall from bricks, multi-ball, shrink/grow paddle.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-BRK-1\nKinematic paddle follows mouse X"]
    Dev --> UC2["UC-BRK-2\nBall bounces with constant speed"]
    Dev --> UC3["UC-BRK-3\nBrick grid loaded from level data"]
    Dev --> UC4["UC-BRK-4\nBall hits brick: brick destroyed, ball reflects"]
    Dev --> UC5["UC-BRK-5\nBall hits paddle: angle based on hit position"]
    Dev --> UC6["UC-BRK-6\nBall falls past paddle: lose life"]
    Dev --> UC7["UC-BRK-7\nPower-ups fall from destroyed bricks"]
    Dev --> UC8["UC-BRK-8\nMulti-ball power-up"]
    Dev --> UC9["UC-BRK-9\nBrick HP variants (hit multiple times)"]
    Dev --> UC10["UC-BRK-10\nLevel cleared when all bricks gone"]
```

## Physics Configuration

```mermaid
flowchart TD
    BallBody["Ball: DYNAMIC body\nrestitution = 1.0\nfriction = 0.0\nlinearDamping = 0.0\nmass = 1.0"] --> ConstantSpeed["ensure constant speed:\neach frame: clamp body speed to ballSpeed\n(restitution ≠ 1.0 exactly in Box2D — must correct)"]
    PaddleBody["Paddle: KINEMATIC body\nfollows mouse.x"] --> BallPaddle["ball-paddle collision\nprovides angle variation"]
    BrickBodies["Bricks: STATIC bodies\ndestroyed on contact"] --> SensorDrain["drain sensor at bottom\nBALL + DRAIN → lose life"]
```

## Angle Control from Paddle

```mermaid
flowchart LR
    BallHitsPaddle["onCollisionBegin BALL + PADDLE"] --> HitPosition["relativeX = (ball.centerX - paddle.centerX) / (paddle.width / 2)\n(-1.0 = left edge, 0 = center, +1.0 = right edge)"]
    HitPosition --> AngleCalc["angle = relativeX × maxBounceAngle\n(e.g. 75 degrees at edge, 5 degrees at center)"]
    AngleCalc --> SetVelocity["newDir = (sin(angle), -cos(angle))\nball.setLinearVelocity(newDir × ballSpeed)"]
```

## Brick Grid

```mermaid
flowchart TD
    LevelData["int[][] layout\n0=empty, 1=normal, 2=tough, 3=indestructible"] --> SpawnBricks["for x in 0..cols, y in 0..rows:\n  spawn('brick_' + layout[x][y], x*BRICK_W, y*BRICK_H + topOffset)"]
    SpawnBricks --> BrickHP["brick entity stores hp:\n  type 1 → hp=1\n  type 2 → hp=2\n  type 3 → indestructible (no collision event)"]
    BrickHP --> BrickHit["onCollisionBegin BALL + BRICK:\n  hp-- → if hp == 0: removeFromWorld()"]
```

## Power-Up System

```mermaid
flowchart LR
    BrickDestroyed["brick removed"] --> RollDrop2["30% chance to drop power-up"]
    RollDrop2 --> FallDown["power-up entity falls at speed 100px/s\n(DYNAMIC or animated)"]
    FallDown --> PaddleCollect["onCollisionBegin PADDLE + POWERUP\n→ apply effect\n→ removeFromWorld()"]
    PaddleCollect --> Effects["WIDE_PADDLE: paddle.width × 1.5\nMULTI_BALL: spawn 2 extra balls\nSLOW_BALL: reduce ballSpeed\nLASER: paddle fires at bricks"]
```

## Multi-Ball

```mermaid
flowchart LR
    MultiballPowerup["multi-ball collected"] --> SpawnExtra["spawn 2 new ball entities\nat current ball position\nvelocity = rotated ±25° from current ball dir"]
    SpawnExtra --> TrackBalls2["manage ball count:\nballs = getGameWorld().getEntitiesByType(BALL)"]
    TrackBalls2 --> LastBall2["if last ball drains:\n  dec('lives', 1)"]
```
