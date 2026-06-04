# Game Type — First-Person 3D

Covers first-person exploration, FPS, and first-person puzzle games. Camera IS the player eye, WASD movement in 3D, mouse look, weapon view model, interaction raycasting.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-FPS-1\nMouse look (pitch/yaw) for camera rotation"]
    Dev --> UC2["UC-FPS-2\nWASD move in camera's facing direction"]
    Dev --> UC3["UC-FPS-3\nWeapon view model as child of camera"]
    Dev --> UC4["UC-FPS-4\nCrosshair in screen center"]
    Dev --> UC5["UC-FPS-5\nInteraction raycast: pick 3D objects"]
    Dev --> UC6["UC-FPS-6\nShooting: raycast or projectile from camera"]
    Dev --> UC7["UC-FPS-7\nSimulated gravity + jump in 3D space"]
    Dev --> UC8["UC-FPS-8\nOBJ level geometry with 3D collision"]
    Dev --> UC9["UC-FPS-9\n3D audio: sound direction from source"]
    Dev --> UC10["UC-FPS-10\nHUD health, ammo, compass overlay"]
```

## Camera Setup

```mermaid
flowchart TD
    Settings["settings.setExperimental3D(true)\nsettings.setWidth(1280)\nsettings.setHeight(720)"] --> GetCam["Camera3D cam = getGameScene().getCamera3D()"]
    GetCam --> InitPos["cam.getTransform().setTranslateY(-2)\n(eye height above floor)"]
    GetCam --> FOV2["cam.setFieldOfView(70)\ncam.setNearClip(0.1)\ncam.setFarClip(1000)"]
    GetCam --> LockCursor["getInput().setProcessInput(true)\n// capture mouse to window"]
```

## Mouse Look

```mermaid
flowchart TD
    MouseMove["raw mouse delta\ndx, dy per frame"] --> Yaw["cameraYaw += dx × sensitivity\n(rotate around Y axis)"]
    MouseMove --> Pitch["cameraPitch = clamp(\n  cameraPitch + dy × sensitivity,\n  -89, 89\n)  // prevent gimbal flip"]
    Yaw --> ApplyRotY["cam.getTransform().setRotateY(cameraYaw)"]
    Pitch --> ApplyRotX["cam.getTransform().setRotateX(cameraPitch)"]
```

## WASD Movement in 3D

```mermaid
flowchart LR
    Input3D["WASD keys held"] --> ForwardDir["forward = cam.getDirection3D()\nright = cross(forward, UP)"]
    ForwardDir --> CalcVel["vel = (W - S) × forward + (D - A) × right"]
    CalcVel --> FlattenY["vel.y = 0 (no flying)\nnormalize if diagonal"]
    FlattenY --> ApplyPos["cam.pos += vel × moveSpeed × tpf"]
```

## Interaction / Shooting Raycast

```mermaid
flowchart TD
    MouseClick3D["mouse click / E key"] --> CenterRay["ray origin = camera position\nray direction = camera forward"]
    CenterRay --> JavaFXPick["getGameScene().getRoot3D()\n.addEventHandler(MouseEvent.MOUSE_CLICKED, e ->\n  PickResult pick = e.getPickResult())"]
    JavaFXPick --> HitObject["pick.getIntersectedNode()\n→ find FXGL entity from 3D node\n→ interact or damage"]
```

## Simulated Gravity

```mermaid
flowchart LR
    YVelocity["yVelocity (start 0)"] --> UpdateGravity["yVelocity += gravity × tpf (e.g. -9.8)"]
    UpdateGravity --> MoveY["cam.pos.y += yVelocity × tpf"]
    MoveY --> FloorCheck["if cam.pos.y >= floorY:\n  cam.pos.y = floorY\n  yVelocity = 0\n  isGrounded = true"]
    FloorCheck --> Jump3D["if SPACE + isGrounded:\n  yVelocity = jumpStrength"]
```

## Weapon View Model

```mermaid
flowchart LR
    WeaponNode["weapon 3D node (OBJ)"] --> AttachToCam["add as child of camera group\npositioned at (0.3, -0.2, 0.5)\n(right side, slightly down, in front)"]
    AttachToCam --> FireAnim["on shoot:\n  translate backward then forward (recoil)\n  using AnimationBuilder on weapon node"]
    FireAnim --> NoSelfHit["weapon node excluded from\nray intersection tests\n(or check picked node type before applying damage)"]
```
