# Game Type — Bullet Hell (Danmaku)

Covers dense-pattern shooters where the screen fills with enemy bullets the player must weave through. Hitbox is much smaller than sprite. Graze mechanic, bomb screen-clear.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-BH-1\nSmall hitbox independent of sprite size"]
    Dev --> UC2["UC-BH-2\nGraze detection (near miss scores points)"]
    Dev --> UC3["UC-BH-3\nSpiral bullet pattern"]
    Dev --> UC4["UC-BH-4\nCircular aimed bullet pattern"]
    Dev --> UC5["UC-BH-5\nPhase-based boss attack scripting"]
    Dev --> UC6["UC-BH-6\nBomb: clear all enemy bullets"]
    Dev --> UC7["UC-BH-7\nInvincibility frames on hit"]
    Dev --> UC8["UC-BH-8\nBullet acceleration / deceleration"]
    Dev --> UC9["UC-BH-9\nBullet that homes after delay"]
    Dev --> UC10["UC-BH-10\nPerformance: 1000+ bullets on screen"]
```

## Hitbox vs Sprite

```mermaid
flowchart TD
    PlayerSprite["Player sprite\n32×32 pixels"] --> PhysicsHitbox["actual hitbox:\nBoundingShape.circle(4)\ncentered on player\n(tiny for precise dodging)"]
    PlayerSprite --> GrazeSensor["graze sensor:\nBoundingShape.circle(16)\nBodyType.SENSOR\n(slightly larger — for graze detection)"]
    GrazeSensor --> GrazeHandler["onCollisionBegin with ENEMY_BULLET\n(graze sensor, not hitbox)\n→ inc('grazePts', 10)"]
```

## Spiral Pattern

```mermaid
flowchart TD
    Timer2["fire timer (every 100ms)"] --> Angle["angle += 15 degrees per shot"]
    Angle --> Loop["for i in 0..numArms:\n  armAngle = angle + i * (360/numArms)"]
    Loop --> Spawn["spawn bullet\ndirection = angleToVector(armAngle)\nspeed = 180 px/s"]
```

## Boss Phase Script

```mermaid
stateDiagram-v2
    [*] --> Phase1 : boss HP = max
    Phase1 --> Phase2 : HP below 75%
    Phase2 --> Phase3 : HP below 50%
    Phase3 --> Phase4 : HP below 25%
    Phase4 --> Defeated : HP = 0

    Phase1 : simple spiral
    Phase2 : spiral + aimed bursts
    Phase3 : laser sweeps + aimed
    Phase4 : all patterns combined + faster
```

## Bomb Screen Clear

```mermaid
flowchart LR
    BombKey["bomb key pressed\nand bombs > 0"] --> ClearBullets["getGameWorld()\n.getEntitiesByType(ENEMY_BULLET)\n.forEach(e -> e.removeFromWorld())"]
    ClearBullets --> Invincibility["start 2s invincibility\nflash white effect"]
    Invincibility --> DecBombs["dec('bombs', 1)"]
```

## Performance Pattern

```mermaid
flowchart TD
    BulletCount["1000+ bullets simultaneously"] --> EfficientCollision["use sensor bodies for bullets\n(no physics response needed — only overlap detection)"]
    EfficientCollision --> ExpireOffScreen["ExpireCleanComponent when\nbullet.x or bullet.y outside world bounds"]
    ExpireOffScreen --> SkipRender["avoid per-bullet particle effects\n(too expensive at scale)"]
```
