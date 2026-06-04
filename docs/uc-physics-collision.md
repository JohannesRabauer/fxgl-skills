# Use Cases — Physics & Collision

Covers Box2D integration, rigid bodies, collision handlers, sensors, and raycasting.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-PHY-1\nAdd physics to an entity"]
    Dev --> UC2["UC-PHY-2\nSet world gravity"]
    Dev --> UC3["UC-PHY-3\nHandle collision begin / during / end"]
    Dev --> UC4["UC-PHY-4\nMake entity a one-time collectible"]
    Dev --> UC5["UC-PHY-5\nFilter collisions between types"]
    Dev --> UC6["UC-PHY-6\nPerform raycast"]
    Dev --> UC7["UC-PHY-7\nCreate screen boundary walls"]
    Dev --> UC8["UC-PHY-8\nApply impulse / force to body"]
    Dev --> UC9["UC-PHY-9\nUse sensor (ghost) body"]
    Dev --> UC10["UC-PHY-10\nBuild platformer physics"]
    Dev --> UC11["UC-PHY-11\nBuild billiard / snooker physics"]
```

## Physics Entity Setup

```mermaid
flowchart TD
    Builder["FXGL.entityBuilder()"] --> BBox["bbox(BoundingShape.box/circle/polygon)"]
    BBox --> Collidable[".collidable()"]
    Collidable --> PhysComp["with(new PhysicsComponent())"]
    PhysComp --> BodyType["physicsComponent.setBodyType\n(BodyType.DYNAMIC / STATIC / KINEMATIC)"]
    BodyType --> FixtureDef["physicsComponent.setFixtureDef\n(density, friction, restitution)"]
    FixtureDef --> Attach[".buildAndAttach()"]
```

## Collision Handler Registration

```mermaid
flowchart LR
    Dev([Developer]) --> H1["onCollisionBegin(typeA, typeB, (a,b) -> ...)"]
    Dev --> H2["onCollision(typeA, typeB, (a,b) -> ...)"]
    Dev --> H3["onCollisionEnd(typeA, typeB, (a,b) -> ...)"]
    Dev --> H4["onCollisionCollectible(collector, collectible, e -> ...)"]
    Dev --> H5["onCollisionOneTimeOnly(typeA, typeB, (a,b) -> ...)"]
    Dev --> H6["physicsWorld.addCollisionHandler\n(new CollisionHandler(A,B){...})"]

    H4 -.->|uses| Collect["CollectibleHandler\n(removes collectible on touch)"]
    H5 -.->|uses| OneTime["OneTimeCollisionHandler\n(fires exactly once)"]
```

## Collision Filter Use Case

```mermaid
flowchart TD
    Dev([Developer]) --> Filter["physicsWorld.addCollisionHandler with\ncustom CollisionFilter"]
    Filter --> Mask["CategoryBits / MaskBits\non FixtureDef"]
    Mask -->|"bitwise AND decides collision"| Result{Collide?}
    Result -->|yes| Fire["Handler callback fired"]
    Result -->|no| Ignore["Bodies pass through"]
```

## Raycast Use Case

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant PhysicsWorld

    Dev->>PhysicsWorld: raycast(callback, startPt, endPt)
    PhysicsWorld-->>Dev: RaycastCallback.reportFixture(fixture, point, normal, fraction)
    Dev->>Dev: filter which entity was hit
    Dev->>Dev: fraction < 1 → stop at first hit
```

## Platformer Physics Pattern

```mermaid
flowchart TD
    Setup["initPhysics()"] --> Gravity["getPhysicsWorld().setGravity(0, 980)"]
    Gravity --> Player["Player entity\nPhysicsComponent DYNAMIC\nbbox chain/box shape"]
    Player --> Ground["Ground/Platform entities\nPhysicsComponent STATIC"]
    Player --> Jump["onKeyDown → body.setLinearVelocity(0, -600)"]
    Player --> Walk["onKey → body.setLinearVelocity(speed, vel.y)"]
    Ground --> Land["CollisionHandler player+ground\n→ enable jump again"]
```

## Physics Body Types

```mermaid
graph LR
    BodyTypes["BodyType"]
    BodyTypes --> Static["STATIC\nImmovable walls,\nground, obstacles"]
    BodyTypes --> Dynamic["DYNAMIC\nPlayer, enemies,\nprojectiles"]
    BodyTypes --> Kinematic["KINEMATIC\nPlatforms that move\nunder script control"]
    BodyTypes --> Sensor["Sensor FixtureDef\n(ghost body for trigger zones)"]
