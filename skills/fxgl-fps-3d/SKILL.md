---
name: fxgl-fps-3d
description: >
  Build a first-person 3D game in FXGL — set up a player-driven Camera3D, implement mouse look,
  move relative to the camera facing direction, add a crosshair HUD, raycast or pick 3D targets,
  simulate gravity and jumping, and manage a first-person weapon or interaction model. Use this
  skill for FPS, first-person exploration, or first-person puzzle prototypes built on FXGL's 3D
  scene support.
triggers:
  - fps
  - first person
  - fps 3d
  - mouse look
  - crosshair
  - hitscan
  - camera3d shooter
  - 3d raycast
compatibility: >
  Java 17+, FXGL 21.x. Requires `settings.setExperimental3D(true)` and JavaFX 3D support. Builds
  on the primitives in fxgl-scene3d.
category: fxgl/3d
tags:
  - fxgl
  - java
  - javafx
  - 3d
  - game-types
  - fps
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
# FXGL First-Person 3D

## Layering

Use **fxgl-scene3d** for the base 3D setup. This skill adds the **game structure** for an FPS:

- first-person camera control
- gameplay movement rules
- crosshair + interaction model
- gravity and jump
- weapon / interaction feedback

## Camera Setup

```java
@Override
protected void initSettings(GameSettings settings) {
    settings.setExperimental3D(true);
}

private Camera3D camera;
private double yaw = 0;
private double pitch = 0;

@Override
protected void initGame() {
    camera = getGameScene().getCamera3D();
    camera.getTransform().setTranslate(0, -2, -10);   // eye height
    camera.setFieldOfView(70);
    camera.setNearClip(0.1);
    camera.setFarClip(1000);
}
```

## Mouse Look

```java
private double prevMouseX;
private double prevMouseY;

@Override
protected void initInput() {
    getInput().addMouseEventHandler(MouseEvent.MOUSE_DRAGGED, e -> {
        double dx = e.getSceneX() - prevMouseX;
        double dy = e.getSceneY() - prevMouseY;

        yaw += dx * 0.2;
        pitch = clamp(pitch + dy * 0.2, -89, 89);

        camera.getTransform().setRotationY(yaw);
        camera.getTransform().setRotationX(pitch);

        prevMouseX = e.getSceneX();
        prevMouseY = e.getSceneY();
    });
}
```

## WASD Movement

Use the camera's current facing direction, flattened onto the XZ plane, for movement.

```java
private double moveSpeed = 7.0;
private double yVelocity = 0.0;
private boolean grounded = true;

@Override
protected void onUpdate(double tpf) {
    Point3D forward = camera.getTransform().getDirection3D().normalize();
    Point3D flatForward = new Point3D(forward.getX(), 0, forward.getZ()).normalize();
    Point3D right = flatForward.crossProduct(Point3D.ZERO.add(0, 1, 0)).normalize();

    Point3D move = Point3D.ZERO;
    if (getInput().isHeld(KeyCode.W)) move = move.add(flatForward);
    if (getInput().isHeld(KeyCode.S)) move = move.subtract(flatForward);
    if (getInput().isHeld(KeyCode.D)) move = move.add(right);
    if (getInput().isHeld(KeyCode.A)) move = move.subtract(right);

    if (move.magnitude() > 0) {
        move = move.normalize().multiply(moveSpeed * tpf);
        camera.getTransform().translate3D(move);
    }

    updateVerticalMotion(tpf);
}
```

## Gravity and Jump

```java
private void updateVerticalMotion(double tpf) {
    yVelocity += 18 * tpf;
    camera.getTransform().translateY(yVelocity * tpf);

    double floorY = -2;
    if (camera.getTransform().getY() > floorY) {
        camera.getTransform().setY(floorY);
        yVelocity = 0;
        grounded = true;
    }
}

private void tryJump() {
    if (!grounded)
        return;

    yVelocity = -8.5;
    grounded = false;
}
```

## Crosshair HUD

```java
@Override
protected void initUI() {
    var crosshair = getUIFactoryService().newText("+", Color.WHITE, 28);
    addUINode(crosshair, getAppWidth() / 2.0 - 6, getAppHeight() / 2.0 - 12);
}
```

## Interaction and Hitscan

Use JavaFX 3D picking from the scene root.

```java
private void initPicking() {
    getGameScene().getRoot3D().addEventHandler(MouseEvent.MOUSE_CLICKED, event -> {
        PickResult pick = event.getPickResult();
        if (pick.getIntersectedNode() == null)
            return;

        Point3D hit = pick.getIntersectedPoint();
        Node node = pick.getIntersectedNode();

        // map the picked node back to an entity or tag before applying damage/interact
    });
}
```

## Weapon / Interaction Model

For prototypes, keep the weapon model as a simple node updated relative to the camera instead of
building a full skeletal rig.

## Gotchas

- **This skill depends on fxgl-scene3d** — do not duplicate the base 3D setup everywhere.
- **Mouse drag is not true OS-level mouse capture** — desktop FPS feel may need additional window
  handling beyond the default JavaFX drag behavior.
- **Gravity is manual** — FXGL's Box2D `PhysicsComponent` is 2D, not 3D.
- **PickResult gives you a JavaFX node, not automatically an FXGL gameplay target** — keep a
  reliable mapping from 3D node back to owning entity or gameplay component.
