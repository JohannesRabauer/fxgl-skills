# Use Cases — Entity–Component System (ECS)

Covers entity creation, the component model, factories, state machines, and action queues.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-ECS-1\nCreate entity via DSL builder"]
    Dev --> UC2["UC-ECS-2\nCreate entity from factory"]
    Dev --> UC3["UC-ECS-3\nAttach custom component"]
    Dev --> UC4["UC-ECS-4\nQuery entities by type/component"]
    Dev --> UC5["UC-ECS-5\nAdd entity state machine"]
    Dev --> UC6["UC-ECS-6\nQueue entity actions"]
    Dev --> UC7["UC-ECS-7\nReact to entity lifecycle events"]
    Dev --> UC8["UC-ECS-8\nSet entity draw order (z-index)"]
    Dev --> UC9["UC-ECS-9\nTag entity with properties"]
    Dev --> UC10["UC-ECS-10\nRemove / despawn entities"]
```

## EntityBuilder DSL Flow

```mermaid
flowchart LR
    A["FXGL.entityBuilder()"] --> B["at(x, y)"]
    B --> C["type(EntityType.FOO)"]
    C --> D["view(Node or texture)"]
    D --> E["with(Component...)"]
    E --> F["collidable()"]
    F --> G["bbox(BoundingShape)"]
    G --> H{Build}
    H --> H1["build()\nreturns Entity\n(not yet in world)"]
    H --> H2["buildAndAttach()\nadds to game world"]
    H --> H3["buildScreenBoundsAndAttach(gap)\ncreates invisible walls"]
```

## Entity Factory Pattern

```mermaid
flowchart TD
    Dev([Developer]) -->|"1 Implement"| Factory["@EntityFactory\nclass MyFactory\nimplements EntityFactory"]
    Factory -->|"2 Annotate spawn methods"| Spawn["@Spawns('enemy')\nEntity spawnEnemy(SpawnData data)"]
    Dev -->|"3 Register"| Reg["getGameWorld().addEntityFactory(new MyFactory())"]
    Dev -->|"4 Spawn at runtime"| Runtime["FXGL.spawn('enemy', x, y)\nor spawn with SpawnData"]
    Runtime -->|triggers| Spawn
```

## Custom Component Lifecycle

```mermaid
flowchart TD
    C["class MyComponent\nextends Component"] --> Init["onAdded()\ninitialise state\nget other components"]
    Init --> Update["onUpdate(tpf)\ngame-loop per-frame logic"]
    Update --> Removed["onRemoved()\ncleanup listeners"]

    Inject["@Required\nOtherComponent dep"] -->|"auto-injected before onAdded"| Init
```

## Entity State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle : entity spawned
    Idle --> Walking : move input
    Walking --> Running : sprint input
    Walking --> Idle : stop input
    Running --> Walking : release sprint
    Walking --> Jumping : jump input
    Jumping --> Idle : land
    Idle --> Dead : health <= 0
    Walking --> Dead : health <= 0
    Dead --> [*]

    note right of Idle
        StateComponent manages
        transitions via entity.getComponent(StateComponent.class)
    end note
```

## Entity Queries

```mermaid
graph TD
    World["GameWorld"] --> Q1["getEntitiesByType(Type...)"]
    World --> Q2["getEntitiesByComponent(Class)"]
    World --> Q3["getEntitiesAt(Point2D)"]
    World --> Q4["getEntitiesInRange(Rectangle2D)"]
    World --> Q5["getEntityByID(name, id)"]
    World --> Q6["getSingleton(Predicate)"]
    World --> Q7["getEntities() – all entities"]
    World --> Q8["getClosestEntity(entity, filter)"]
```

## Built-in DSL Components (Ready-made behaviours)

```mermaid
graph LR
    Components["DSL Components"]

    Components --> Movement["Movement\nProjectileComponent\nProjectileWithAcceleration\nTopDownMoveComponent\nRandomMoveComponent\nRandomAStarMoveComponent\nWaypointMoveComponent\nFollowComponent"]
    Components --> Lifecycle["Lifecycle\nExpireCleanComponent\nOffscreenCleanComponent\nOffscreenPauseComponent\nOffscreenInvisibleComponent"]
    Components --> Visual["Visual\nGenericBarViewComponent\nTextViewComponent\nTrailParticleComponent\nChildViewComponent\nAutoRotationComponent"]
    Components --> Gameplay["Gameplay\nActivatorComponent\nDraggableComponent\nKeepInBoundsComponent\nLiftComponent\nEffectComponent\nRechargeableComponent\nIntervalPauseComponent\nIntervalSwitchComponent"]
```

## Entity Action Queue

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Entity
    participant ActionComponent

    Dev->>Entity: entity.addComponent(new ActionComponent())
    Dev->>ActionComponent: getComponent(ActionComponent).addAction(MoveAction)
    Dev->>ActionComponent: getComponent(ActionComponent).addAction(AttackAction)
    ActionComponent->>ActionComponent: executes actions sequentially each frame
    ActionComponent-->>Dev: action completes → next action starts
```
