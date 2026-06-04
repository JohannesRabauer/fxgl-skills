---
name: fxgl-third-person-3d
description: >
  Build a third-person 3D game in FXGL — orbit a camera behind the player, move the character
  relative to camera direction, rotate the player to face travel direction, jump with manual 3D
  gravity, smooth the camera with a spring arm, avoid camera clipping, and optionally add lock-on
  combat behavior.
triggers:
  - third person 3d
  - third person
  - orbit camera
  - spring arm
  - lock on
  - camera clipping
  - player faces movement
compatibility: >
  Java 17+, FXGL 21.x. Requires FXGL 3D mode and builds on fxgl-scene3d.
category: fxgl/3d
tags:
  - fxgl
  - java
  - javafx
  - 3d
  - game-types
  - third-person
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
# FXGL Third-Person 3D

## Layering

Use **fxgl-scene3d** for the baseline 3D scene. This skill adds:

- orbit camera controls
- character-relative movement
- spring-arm smoothing
- lock-on behavior
- third-person combat / traversal structure

## Orbit Camera

```java
private Camera3D camera;
private double cameraYaw = 0;
private double cameraPitch = 20;
private double cameraRadius = 8;

private Point3D computeCameraOffset() {
    double yawRad = Math.toRadians(cameraYaw);
    double pitchRad = Math.toRadians(cameraPitch);

    double x = cameraRadius * Math.sin(yawRad) * Math.cos(pitchRad);
    double y = -cameraRadius * Math.sin(pitchRad);
    double z = cameraRadius * Math.cos(yawRad) * Math.cos(pitchRad);

    return new Point3D(x, y, z);
}
```

Update the camera every frame:

```java
private void updateCamera(double tpf) {
    Point3D target = player.getPosition3D().add(0, -1.5, 0);
    Point3D desired = target.add(computeCameraOffset());

    var transform = camera.getTransform();
    transform.setX(lerp(transform.getX(), desired.getX(), tpf * 8));
    transform.setY(lerp(transform.getY(), desired.getY(), tpf * 8));
    transform.setZ(lerp(transform.getZ(), desired.getZ(), tpf * 8));
    transform.lookAt(target);
}
```

## Player Movement Relative to Camera

```java
private void updatePlayerMovement(double tpf) {
    Point3D camToPlayer = player.getPosition3D().subtract(camera.getTransform().getPosition3D());
    Point3D forward = new Point3D(camToPlayer.getX(), 0, camToPlayer.getZ()).normalize();
    Point3D right = forward.crossProduct(new Point3D(0, 1, 0)).normalize();

    Point3D move = Point3D.ZERO;
    if (getInput().isHeld(KeyCode.W)) move = move.add(forward);
    if (getInput().isHeld(KeyCode.S)) move = move.subtract(forward);
    if (getInput().isHeld(KeyCode.D)) move = move.add(right);
    if (getInput().isHeld(KeyCode.A)) move = move.subtract(right);

    if (move.magnitude() > 0) {
        Point3D dir = move.normalize();
        player.translate3D(dir.multiply(5 * tpf));
        player.getTransformComponent().lookAt(player.getPosition3D().add(dir));
    }
}
```

## Jump and Grounding

```java
private double yVelocity = 0;
private boolean grounded = true;

private void updateVerticalMotion(double tpf) {
    yVelocity += 18 * tpf;
    player.translateY(yVelocity * tpf);

    double floorY = 0;
    if (player.getY() > floorY) {
        player.setY(floorY);
        yVelocity = 0;
        grounded = true;
    }
}
```

## Camera Clipping

For a prototype, shorten the camera arm when geometry blocks the segment from player to camera.
Use a ray / pick test against known collidable geometry before committing the final camera position.

## Lock-On Pattern

```java
private Entity lockedTarget;

private void toggleLockOn() {
    if (lockedTarget != null) {
        lockedTarget = null;
        return;
    }

    lockedTarget = findNearestEnemyInFront();
}
```

When locked on:

- keep camera aim centered between player and target
- rotate player to face target
- reinterpret movement as strafe / orbit

## Animation State Suggestions

Typical 3D state set:

- idle
- walk
- run
- jump
- fall
- attack
- hurt

Drive this from movement magnitude, grounded state, and combat input rather than directly from keys.

## Gotchas

- **Orbit camera and player movement are separate systems** — do not couple them so tightly that
  rotating the camera also rotates the player when standing still.
- **Use `lookAt()` on transform components, not guessed rotation math where avoidable** — FXGL
  already provides a 3D look-at helper on transform components.
- **Spring-arm smoothing must run every frame** — abrupt snapping feels bad immediately in
  third-person games.
- **Camera clipping needs active handling** — a smooth camera that goes through walls is still wrong.
