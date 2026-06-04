# Built-in FXGL Components — Full API Reference

Load this file when you need the constructor signatures and configuration methods for
FXGL's pre-built components.

## Movement Components

### ProjectileComponent
```java
// Moves in a fixed direction at constant speed
new ProjectileComponent(direction, speed)
// direction: Point2D (normalised automatically)
// speed: pixels per second

ProjectileComponent pc = entity.getComponent(ProjectileComponent.class);
pc.setSpeed(400);
pc.setDirection(new Point2D(1, -0.5)); // reconfigure after add
```

### ProjectileWithAccelerationComponent
```java
new ProjectileWithAccelerationComponent(direction, initialSpeed, acceleration)
// acceleration: pixels/sec²
```

### WaypointMoveComponent
```java
WaypointMoveComponent wmc = new WaypointMoveComponent();
wmc.setSpeed(150);
wmc.setLooping(true);    // loop back to start after last waypoint
wmc.addWaypoint(new Point2D(100, 100));
wmc.addWaypoint(new Point2D(500, 100));
wmc.addWaypoint(new Point2D(500, 400));
entity.addComponent(wmc);

// At runtime
wmc.setLooping(false);
wmc.clearWaypoints();
```

### FollowComponent
```java
new FollowComponent(targetEntity, speed)
// Moves entity toward targetEntity at speed pixels/sec
// Stops when within minDistance of target (default 5px)

FollowComponent fc = entity.getComponent(FollowComponent.class);
fc.setMinDistance(30);   // stop chasing when within 30px
fc.setSpeed(200);
```

### TopDownMoveComponent
```java
new TopDownMoveComponent(speed)
// Top-down movement controlled by input (integrates with Input system)
// Call moveLeft(), moveRight(), moveUp(), moveDown() from input actions
```

### RandomMoveComponent
```java
new RandomMoveComponent(speed, changeDirectionInterval)
// changeDirectionInterval: Duration between direction changes

RandomMoveComponent rmc = entity.getComponent(RandomMoveComponent.class);
rmc.setSpeed(120);
```

### RandomAStarMoveComponent
```java
new RandomAStarMoveComponent(aStarGrid)
// AStarGrid grid = AStarGrid.fromWorld(gameWorld, cellW, cellH);
// Sets NOT_WALKABLE cells based on solid entities
```

## Lifecycle Components

### ExpireCleanComponent
```java
new ExpireCleanComponent(Duration.seconds(3))
// Removes entity after 3 seconds
// Optionally add OffscreenCleanComponent for faster cleanup
```

### OffscreenCleanComponent
```java
new OffscreenCleanComponent()
// Removes entity when bounding box leaves viewport
// Use with projectiles, particles, enemies moving off-screen
```

### OffscreenPauseComponent
```java
new OffscreenPauseComponent()
// Pauses onUpdate() when entity is off-screen
// Useful for performance with many idle enemies
```

### OffscreenInvisibleComponent
```java
new OffscreenInvisibleComponent()
// Hides entity view when off-screen (keeps it alive)
```

## View Components

### GenericBarViewComponent
```java
// Horizontal or vertical progress bar (health bar, XP bar, etc.)
GenericBarViewComponent bar = new GenericBarViewComponent(
    width, height, Color.RED, 100, true  // isHorizontal
);
entity.addComponent(bar);

bar.setValue(currentHP);     // 0..maxValue
bar.setMaxValue(maxHP);
bar.setFill(Color.GREEN);    // change color
bar.setTrackedValue(entity.getComponent(HPComponent.class).hpProperty());  // bind
```

### TextViewComponent
```java
new TextViewComponent(fontSize, text, Color.WHITE)
// Renders text above/at entity position
// Get via entity.getComponent(TextViewComponent.class).setText("hello")
```

### AutoRotationComponent
```java
new AutoRotationComponent()
// Rotates entity to face its velocity vector
// Useful for bullets, arrows, etc.
```

### LiftComponent
```java
LiftComponent lift = new LiftComponent();
lift.xAxisDistanceDuration(20, Duration.seconds(1));  // oscillate 20px over 1s on X
lift.yAxisDistanceDuration(10, Duration.seconds(0.5)); // and 10px over 0.5s on Y
entity.addComponent(lift);
```

### TrailParticleComponent
```java
new TrailParticleComponent(emitter, Duration.millis(50))
// Leaves a particle trail behind the entity
// emitter: configure a ParticleEmitter (see fxgl-particles-effects skill)
```

## Gameplay Components

### EffectComponent
```java
entity.addComponent(new EffectComponent());
entity.getComponent(EffectComponent.class).startEffect(new SlowTimeEffect(Duration.seconds(3)));
entity.getComponent(EffectComponent.class).startEffect(new WobbleEffect(Duration.seconds(1)));
// Effects stack and expire independently
```

### ActivatorComponent
```java
new ActivatorComponent()
// Requires ActivatorComponent on the entity AND an activating entity nearby
// Config: setActivationDistance(50.0)
// Subscribe: entity.getComponent(ActivatorComponent.class).onActivated(other -> ...)
```

### DraggableComponent
```java
new DraggableComponent()
// Makes entity draggable with the mouse (primary button)
// Works in GameScene and SubScenes
```

### KeepInBoundsComponent
```java
new KeepInBoundsComponent(new Rectangle2D(0, 0, appWidth, appHeight))
// Clamps entity position within bounds each frame
// Alternatively: entityBuilder().buildScreenBoundsAndAttach(thickness)
```

### IntervalPauseComponent
```java
new IntervalPauseComponent(Duration.seconds(2), Duration.seconds(0.5))
// Entity moves for 2 seconds, pauses for 0.5 seconds, repeat
```

### IntervalSwitchComponent
```java
new IntervalSwitchComponent(Duration.seconds(1), () -> entity.setVisible(!entity.isVisible()))
// Calls the action every 1 second (e.g., for blinking effects)
```

### AccumulatedUpdateComponent
```java
new AccumulatedUpdateComponent(Duration.millis(200), this::onAccumulatedUpdate)
// Throttles onUpdate to fire at most once every 200ms
// Good for pathfinding recalculation
```

## HP & Rechargeable

### HPComponent
```java
entity.addComponent(new HPComponent(100));  // max HP = 100

HPComponent hp = entity.getComponent(HPComponent.class);
hp.damage(10);
hp.restore(5);
hp.isZero();          // dead check
hp.hpProperty();      // IntegerProperty for binding
hp.maxHPProperty();   // bind to bar max
hp.setHp(50);
hp.setMaxHp(150);
```

### RechargeableDoubleComponent (stamina, energy)
```java
entity.addComponent(new RechargeableDoubleComponent(100.0, 10.0));
// maxValue=100, rechargeRate=10 per second
entity.getComponent(RechargeableDoubleComponent.class).use(20); // consume 20 units
entity.getComponent(RechargeableDoubleComponent.class).getValue();
```
