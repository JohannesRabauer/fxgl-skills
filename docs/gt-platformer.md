# Game Type — Side-Scroller Platformer

Covers Mario-style, precision platformer, and run-and-jump games. Character moves left/right, jumps on platforms, navigates vertically structured levels.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-PLAT-1\nApply gravity and ground physics"]
    Dev --> UC2["UC-PLAT-2\nJump from ground with coyote time"]
    Dev --> UC3["UC-PLAT-3\nBuffer jump input before landing"]
    Dev --> UC4["UC-PLAT-4\nOne-way pass-through platforms"]
    Dev --> UC5["UC-PLAT-5\nMoving platforms (player rides)"]
    Dev --> UC6["UC-PLAT-6\nScroll camera to follow player"]
    Dev --> UC7["UC-PLAT-7\nParallax background layers"]
    Dev --> UC8["UC-PLAT-8\nLoad Tiled level with collision tiles"]
    Dev --> UC9["UC-PLAT-9\nDetect fall-out-of-bounds / pit death"]
    Dev --> UC10["UC-PLAT-10\nCheckpoint and respawn system"]
    Dev --> UC11["UC-PLAT-11\nCollect coins / pickups"]
    Dev --> UC12["UC-PLAT-12\nEnemy stomped by player"]
```

## Core Physics Setup

```mermaid
flowchart TD
    GravityWorld["Physics world gravity\nset in initPhysics"] --> Player["Player entity\nBodyType.DYNAMIC\ngravityScale = 1.0\nfriction = 0.0"]
    Player --> Grounded["Ground sensor\n(narrow sensor below feet)\nonCollision → isGrounded = true"]
    Platform["Platforms\nBodyType.STATIC\nnormal friction"] --> Player
```

## Jump State Machine

```mermaid
stateDiagram-v2
    [*] --> Grounded
    Grounded --> Jumping : press JUMP + isOnGround
    Grounded --> Falling : walk off ledge
    Falling --> Jumping : press JUMP within coyote window
    Jumping --> Falling : vertical velocity < 0
    Falling --> Grounded : land on platform
    Jumping --> Jumping : hold JUMP → variable height
```

## Coyote Time + Jump Buffer

```mermaid
flowchart LR
    LeaveLedge["player leaves platform\n(no longer grounded)"] --> CoyoteTimer["start coyote timer\n(150ms)"]
    CoyoteTimer --> |within 150ms| AllowJump["JUMP pressed → still jump"]
    CoyoteTimer --> |expired| NoJump["JUMP press ignored (in air)"]

    JumpPress["JUMP pressed in air"] --> BufferTimer["start jump buffer\n(120ms)"]
    BufferTimer --> |land within 120ms| TriggerJump["jump triggers on landing"]
    BufferTimer --> |expired| Drop["buffer discarded"]
```

## Level Scroll Pattern

```mermaid
flowchart LR
    Player2["Player entity"] --> Viewport["getGameScene().getViewport()\n.bindToEntity(player,\n  appWidth/2, appHeight/2)"]
    Viewport --> Clamp["viewport.setBounds(\n  0, 0, levelWidth, levelHeight\n)"]
    Clamp --> Parallax2["background layers move\nat fraction of camera speed"]
```

## Enemy Stomp Pattern

```mermaid
flowchart TD
    CollisionBegin["onCollisionBegin\nPLAYER vs ENEMY"] --> CheckYVelocity["player.yVelocity > 0\nand player.bottom ≤ enemy.top + tolerance"]
    CheckYVelocity --> |true| Stomp["enemy.removeFromWorld()\nplayer bounces up\n(setLinearVelocityY(-jumpSpeed * 0.6))"]
    CheckYVelocity --> |false| Hurt["player takes damage"]
```
