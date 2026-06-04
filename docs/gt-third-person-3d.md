# Game Type — Third-Person 3D

Covers third-person action, adventure, and platformer games in 3D. Camera orbits behind and above the player, character faces movement direction, jump and combat in 3D space.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-TP3D-1\nOrbit camera behind player (yaw + pitch)"]
    Dev --> UC2["UC-TP3D-2\nPlayer moves relative to camera direction"]
    Dev --> UC3["UC-TP3D-3\nPlayer rotates to face movement direction"]
    Dev --> UC4["UC-TP3D-4\nJump in 3D with gravity simulation"]
    Dev --> UC5["UC-TP3D-5\nCamera avoids geometry clipping"]
    Dev --> UC6["UC-TP3D-6\nLock-on target: camera centers between player and enemy"]
    Dev --> UC7["UC-TP3D-7\n3D melee attack with arc hitbox"]
    Dev --> UC8["UC-TP3D-8\nAnimated model state (idle/walk/run/jump/attack)"]
    Dev --> UC9["UC-TP3D-9\nSpring arm: camera spring-lags behind player"]
    Dev --> UC10["UC-TP3D-10\nThird-person OBJ character visible to player"]
```

## Orbit Camera

```mermaid
flowchart TD
    MouseDrag2["mouse drag → cameraYaw += dx\n                cameraYaw += dy"] --> CalcCamPos["camOffset = spherical coords:\n  x = radius × sin(yaw) × cos(pitch)\n  y = -radius × sin(pitch)\n  z = radius × cos(yaw) × cos(pitch)"]
    CalcCamPos --> CamTarget["camera.pos = player.pos + camOffset\ncamera.lookAt(player.pos + (0, playerHeight/2, 0))"]
```

## Player Movement Relative to Camera

```mermaid
flowchart LR
    WASD2["WASD input → local input vector\ninputX = D - A\ninputZ = S - W"] --> CameraRelative["cameraForward = normalize(player.pos - cam.pos)\n(projected to XZ plane)\ncameraRight = cross(cameraForward, UP)"]
    CameraRelative --> WorldMove["worldMove = inputX × cameraRight + inputZ × cameraForward\nnormalize worldMove\napply velocity: pos += worldMove × speed × tpf"]
    WorldMove --> FaceDir2["player.rotationY = atan2(worldMove.x, worldMove.z)\n(smooth with lerp)"]
```

## Jump in 3D

```mermaid
flowchart LR
    Jump3DTrigger["SPACE pressed + isGrounded"] --> LaunchY["yVelocity = jumpForce"]
    LaunchY --> FallLoop["each frame:\n  yVelocity -= gravity × tpf\n  player.pos.y += yVelocity × tpf"]
    FallLoop --> LandCheck["if player.pos.y <= groundY:\n  player.pos.y = groundY\n  yVelocity = 0\n  isGrounded = true"]
```

## Spring Arm (Camera Lag)

```mermaid
flowchart TD
    TargetPos["targetCamPos = player.pos + orbitOffset"] --> SpringArm["actualCamPos = lerp(\n  actualCamPos,\n  targetCamPos,\n  lerpFactor × tpf\n)  // 8.0 = tight, 2.0 = floaty"]
    SpringArm --> ObstacleCheck["if segment(player.pos, actualCamPos) hits geometry:\n  shorten arm to hit point\n  (prevents camera clipping)"]
```

## Lock-On System

```mermaid
flowchart LR
    LockOnKey["L key / R3 button"] --> FindNearestEnemy["get nearest enemy in forward hemisphere\n(dot product with player forward > 0)"]
    FindNearestEnemy --> ActivateLockOn["lockedTarget = enemy\ncamera aims between player and target"]
    ActivateLockOn --> CameraLockBehavior["cam.lookAt = midpoint(player, target)\nplayer rotates to face target\nmovement strafes around target"]
    LockOnKey --> |again| Deactivate["lockedTarget = null\nreturn to free orbit camera"]
```

## Animated Character Model

```mermaid
stateDiagram-v2
    [*] --> Idle3D
    Idle3D --> Walking3D : any movement input
    Walking3D --> Running3D : sprint input held
    Running3D --> Walking3D : sprint released
    Walking3D --> Idle3D : no input
    Idle3D --> Jumping3D : jump input
    Walking3D --> Jumping3D : jump input
    Running3D --> Jumping3D : jump input
    Jumping3D --> Falling3D : apex
    Falling3D --> Idle3D : land
    Idle3D --> Attacking3D : attack input
    Attacking3D --> Idle3D : attack anim complete

    note right of Walking3D : blend walk → run via speed param
```
