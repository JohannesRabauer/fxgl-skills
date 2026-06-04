---
name: fxgl-entity-component
description: >
  Create and manage entities in FXGL using the Entity-Component System (ECS) — build entities
  with EntityBuilder DSL, write EntityFactory spawners with @Spawns, author custom Component
  subclasses, add state machines (StateComponent), queue actions (ActionComponent), and query
  the game world. Use this skill when spawning game objects, creating enemy/player logic as
  components, building entity factories from Tiled maps, or implementing entity behaviours.
  Triggers on: "spawn entity", "EntityFactory", "EntityBuilder", "custom component",
  "entity component", "StateComponent", "game object", "@Spawns".
compatibility: Java 17+, FXGL 21.x
metadata:
  author: fxgl-skills
  version: "1.0"
  fxgl-version: "21.1"
  category: fxgl/ecs
allowed-tools: Read Write Edit Bash
---

# FXGL Entity-Component System

## Core Concept

Everything in the game world is an `Entity`. Behaviour comes from `Component` subclasses
attached to that entity. Never put game logic in `GameApplication` — put it in Components.

## EntityBuilder DSL

Build entities inline (no factory needed for one-offs):

```java
Entity player = entityBuilder()
        .type(EntityType.PLAYER)         // for collision/query filtering
        .at(100, 200)                    // position (top-left of bounding box)
        .view("player.png")              // texture from assets/textures/
        .bbox(BoundingShape.box(40, 60)) // hitbox
        .collidable()                    // participates in collision detection
        .with(new PhysicsComponent())    // attach components
        .with(new PlayerComponent())
        .zIndex(10)                      // draw order (higher = on top)
        .buildAndAttach();               // adds to game world immediately

// Or build without attaching:
Entity e = entityBuilder().at(0,0).build(); // add later with gameWorld.addEntity(e)
```

## EntityFactory Pattern (recommended for all spawnable entities)

```java
// 1. Define entity types
public enum EntityType { PLAYER, ENEMY, COIN, WALL, BULLET }

// 2. Implement factory
public class GameEntityFactory implements EntityFactory {

    @Spawns("player")
    public Entity newPlayer(SpawnData data) {
        return entityBuilder(data)           // ← use entityBuilder(data) to preserve position
                .type(EntityType.PLAYER)
                .view(new Rectangle(40, 60, Color.BLUE))
                .bbox(BoundingShape.box(40, 60))
                .collidable()
                .with(new PhysicsComponent())
                .with(new PlayerComponent())
                .build();
    }

    @Spawns("enemy")
    public Entity newEnemy(SpawnData data) {
        // Read custom properties set in Tiled editor:
        int hp = data.hasKey("hp") ? data.get("hp") : 100;

        PhysicsComponent physics = new PhysicsComponent();
        physics.setBodyType(BodyType.DYNAMIC);

        return entityBuilder(data)
                .type(EntityType.ENEMY)
                .view("enemy.png")
                .bbox(BoundingShape.circle(20))
                .collidable()
                .with(physics)
                .with(new HPComponent(hp))
                .with(new EnemyComponent())
                .build();
    }

    @Spawns("coin")
    public Entity newCoin(SpawnData data) {
        return entityBuilder(data)
                .type(EntityType.COIN)
                .view(new Circle(10, Color.GOLD))
                .bbox(BoundingShape.circle(10))
                .collidable()
                .build();
    }
}

// 3. Register in initGame()
getGameWorld().addEntityFactory(new GameEntityFactory());

// 4. Spawn at runtime
Entity player = spawn("player", 100, 200);
Entity enemy  = spawn("enemy",  400, 300);

// Spawn with extra data
SpawnData data = new SpawnData(500, 100).put("hp", 200).put("speed", 150);
Entity boss = spawn("boss", data);
```

## Custom Component

```java
public class PlayerComponent extends Component {

    private PhysicsComponent physics;  // @Required auto-injects before onAdded()
    private double speed = 250.0;

    // Called when component is added to entity (after injection)
    @Override
    public void onAdded() {
        // safe to call entity.getComponent(X.class) here
        physics = entity.getComponent(PhysicsComponent.class);
    }

    // Called every game frame
    @Override
    public void onUpdate(double tpf) {
        // tpf makes movement frame-rate independent
    }

    // Called when entity is removed from world
    @Override
    public void onRemoved() {
        // clean up listeners, timers, etc.
    }

    public void moveLeft()  { physics.setVelocityX(-speed); }
    public void moveRight() { physics.setVelocityX( speed); }
    public void jump()      { physics.setVelocityY(-600); }
    public void stop()      { physics.setVelocityX(0); }
}
```

### Dependency injection between components

```java
public class AttackComponent extends Component {

    @Required                            // engine injects before onAdded()
    private AnimationComponent anim;     // fails fast if AnimationComponent is missing

    @Override
    public void onAdded() {
        // anim is guaranteed non-null here
    }

    public void attack() {
        anim.play("attack");
        entity.getComponent(HPComponent.class).dealDamage(10);
    }
}
```

## State Machine (StateComponent)

```java
// 1. Define states
public class IdleState extends EntityState {
    @Override public void onEntering() { /* play idle animation */ }
    @Override public void onUpdate(double tpf) { /* check for input */ }
}
public class WalkState extends EntityState { /* ... */ }
public class JumpState extends EntityState { /* ... */ }

// 2. Add to entity
entity.addComponent(new StateComponent());
StateComponent state = entity.getComponent(StateComponent.class);

// 3. Define allowed transitions
state.addState(new IdleState());
state.addState(new WalkState());
state.addState(new JumpState());

// 4. Transition
state.changeState(WalkState.class);

// 5. Query current state
state.isIn(WalkState.class);
state.getCurrentState();
state.currentStateProperty();  // observable — bind to UI
```

## Action Queue (ActionComponent)

Sequential entity actions (move-to, wait, attack, etc.):

```java
// 1. Create reusable action type
public class MoveToAction extends Action {
    private final Point2D target;
    private final double speed;

    @Override
    public void onUpdate(Entity e, double tpf) {
        Point2D dir = target.subtract(e.getPosition()).normalize();
        e.translate(dir.multiply(speed * tpf));
        if (e.getPosition().distance(target) < 5) {
            setComplete();  // signals ActionComponent to dequeue
        }
    }
}

// 2. Attach component + queue actions
entity.addComponent(new ActionComponent());
entity.getComponent(ActionComponent.class).addAction(new MoveToAction(new Point2D(400, 300), 200));
entity.getComponent(ActionComponent.class).addAction(new WaitAction(Duration.seconds(1)));
entity.getComponent(ActionComponent.class).addAction(new AttackAction());
```

## Entity Queries

```java
// By type (most common)
List<Entity> enemies = getGameWorld().getEntitiesByType(EntityType.ENEMY);

// By component presence
List<Entity> armed = getGameWorld().getEntitiesByComponent(WeaponComponent.class);

// First match of a predicate
Entity player = getGameWorld().getSingleton(e -> e.isType(EntityType.PLAYER));

// By ID (set via entityBuilder().id(42) — useful for Tiled object IDs)
Optional<Entity> boss = getGameWorld().getEntityByID("boss", 1);

// Entities within rectangle
List<Entity> nearby = getGameWorld().getEntitiesInRange(
        new Rectangle2D(x - 100, y - 100, 200, 200));

// Closest to a point
Entity closest = getGameWorld().getClosestEntity(player, e -> e.isType(EntityType.COIN));

// All entities
List<Entity> all = getGameWorld().getEntities();
```

## Built-in Ready-made Components

See [references/builtin-components.md](references/builtin-components.md) for full API.

| Component | Behaviour |
|-----------|-----------|
| `ProjectileComponent(dir, speed)` | Moves entity in direction each frame |
| `WaypointMoveComponent` | Follows a list of waypoints |
| `FollowComponent(target, speed)` | Chases a target entity |
| `RandomMoveComponent(speed, interval)` | Wanders randomly |
| `RandomAStarMoveComponent(grid)` | Wanders via A* on a grid |
| `ExpireCleanComponent(duration)` | Removes entity after duration |
| `OffscreenCleanComponent` | Removes entity when off-screen |
| `KeepInBoundsComponent` | Bounces entity at level bounds |
| `AutoRotationComponent` | Rotates entity to face velocity |
| `LiftComponent` | Oscillates entity up and down |
| `EffectComponent` | Manages time-limited visual effects |
| `HPComponent(maxHp)` | Health with damage/heal API |
| `RechargeableDoubleComponent` | Self-recharging stamina/energy |

## Gotchas

- **Always use `entityBuilder(data)` in factories**, not `entityBuilder()`. The `data` object
  carries the spawn position from Tiled or `spawn("type", x, y)`. Forgetting this spawns
  everything at (0, 0).
- **`@Required` fields are injected before `onAdded()`**, not at construction time.
  Never access them in the constructor.
- **Removing an entity mid-collision callback** causes `ConcurrentModificationException`.
  Use `runOnce(() -> entity.removeFromWorld(), Duration.ZERO)` to defer it.
- **`entity.getComponent(X.class)` throws** if the component is not attached. Use
  `entity.hasComponent(X.class)` to guard.
- **`isType()` uses `==` on enum values** — make sure your entity types are in a single
  enum, not spread across multiple classes, to avoid silent mismatches.
- **`zIndex`** is not depth-sorted automatically for physics entities — assign explicitly.
- **`onUpdate` in components is not called** when the engine is paused (e.g., during dialog).
  Use `EngineService.onUpdate()` if you need updates during pause.
