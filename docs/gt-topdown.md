# Game Type — Top-Down 2D

Covers Zelda-style, twin-stick shooter, and top-down RPG games. Bird's eye view, 8-direction movement, no gravity.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-TD-1\n8-direction movement without gravity"]
    Dev --> UC2["UC-TD-2\nCamera follows player, bounded to world"]
    Dev --> UC3["UC-TD-3\nMelee attack in facing direction"]
    Dev --> UC4["UC-TD-4\nRanged attack toward mouse cursor"]
    Dev --> UC5["UC-TD-5\nNPC interaction on proximity"]
    Dev --> UC6["UC-TD-6\nRoom/area transition at screen edge"]
    Dev --> UC7["UC-TD-7\nMinimap overlay"]
    Dev --> UC8["UC-TD-8\nPush and slide collisions with walls"]
    Dev --> UC9["UC-TD-9\nLine of sight from player to enemy"]
    Dev --> UC10["UC-TD-10\nTile-based world from Tiled map"]
```

## Movement Without Gravity

```mermaid
flowchart TD
    InitPhysics["initPhysics"] --> NoGravity["getPhysicsWorld().setGravity(0, 0)"]
    Player["Player PhysicsComponent\nBodyType.DYNAMIC\nfixedRotation = true"] --> Movement["combine pressed keys\ninto normalized velocity vector\n× moveSpeed"]
    Movement --> FaceDir["entity.setRotation(\n  Math.toDegrees(Math.atan2(dy, dx))\n)"]
```

## 8-Direction Input Pattern

```mermaid
flowchart LR
    WASD["W/A/S/D held"] --> DirVector["dx = right - left\ndy = down - up"]
    DirVector --> Normalize["if dx≠0 and dy≠0:\n  multiply by 0.707"]
    Normalize --> ApplyVelocity["body.setLinearVelocity(dx * speed, dy * speed)"]
```

## Melee Attack Arc

```mermaid
flowchart TD
    AttackKey["attack key pressed"] --> SpawnHitbox["spawn invisible hitbox entity\nat player position + facingOffset"]
    SpawnHitbox --> Collidable["hitbox: sensor body\ncollide with ENEMY type"]
    SpawnHitbox --> Expire["ExpireCleanComponent\n(Duration.millis(150))"]
    Collidable --> Damage["onCollisionBegin:\nenemy.getComponent(HPComponent.class).damage(atk)"]
```

## Area Transition Pattern

```mermaid
flowchart LR
    TriggerZone["sensor entity\nat level edge"] --> PlayerEnters["onCollisionBegin\nPLAYER + TRANSITION"]
    PlayerEnters --> SavePos["record player direction\n(which edge was crossed)"]
    SavePos --> LoadNextRoom["setLevelFromMap('room_x_y.tmx')"]
    LoadNextRoom --> RepositionPlayer["place player at\nopposite edge entry point"]
```

## Camera + World Bounds

```mermaid
flowchart TD
    Camera["getGameScene().getViewport()"] --> Bind["bindToEntity(player, appWidth/2, appHeight/2)"]
    Bind --> Clamp2["setBounds(0, 0,\n  levelPixelWidth, levelPixelHeight)"]
    Clamp2 --> LazyFollow["setLazy(true) — slight lag on follow\n(optional, smoother feel)"]
```
