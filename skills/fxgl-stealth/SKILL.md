---
name: fxgl-stealth
description: >
  Build a stealth game in FXGL — implement a conical vision field for guards with
  configurable range and angle, line-of-sight raycasting blocked by wall entities, a
  three-state detection machine (unaware/suspicious/alerted), a detection meter that fills
  while in sight and decays out of sight, waypoint patrol routes that pause on detection,
  a noise system where player actions emit a radius heard by nearby guards, hiding spots
  (shadows/lockers) that suppress detection, non-lethal takedown mechanics, and an alarm
  system where alerted guards call for backup. Use this skill when building a stealth
  game, espionage game, guard-avoidance puzzle, or any game requiring line-of-sight and
  detection mechanics.
triggers:
  - stealth
  - guard
  - line of sight
  - detection
  - FOV cone
  - patrol
  - noise
  - hiding
  - shadow
  - alert
  - suspicious
  - takedown
  - vision cone
compatibility: >
  Java 17+, FXGL 21.x
category: fxgl/game-types
tags:
  - fxgl
  - java
  - javafx
  - game-types
  - stealth
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
# FXGL Stealth Game

## Guard Component

```java
public class GuardComponent extends Component {
    public enum DetectionState { PATROLLING, SUSPICIOUS, ALERTED, SEARCHING }

    private WaypointMoveComponent patrol;
    private DetectionState state = DetectionState.PATROLLING;

    private double detectionMeter  = 0;    // 0-1: fills when player in sight
    private double searchTimer     = 0;
    private Point2D lastKnownPos;

    // Config
    private static final double VISION_RANGE     = 300.0;
    private static final double VISION_HALF_ANGLE = 55.0;  // degrees each side of forward
    private static final double DETECTION_RATE   = 0.5;    // fill rate per second (normal)
    private static final double DECAY_RATE        = 0.3;   // decay rate per second
    private static final double SEARCH_DURATION  = 20.0;   // seconds before giving up

    @Override
    public void onUpdate(double tpf) {
        Entity player = getGameWorld().getSingleton(EntityType.PLAYER);
        boolean canSee = canSeePlayer(player);

        switch (state) {
            case PATROLLING  -> updatePatrolling(tpf, canSee, player);
            case SUSPICIOUS  -> updateSuspicious(tpf, canSee, player);
            case ALERTED     -> updateAlerted(tpf, canSee, player);
            case SEARCHING   -> updateSearching(tpf, canSee, player);
        }

        updateFOVVisual();
    }

    private boolean canSeePlayer(Entity player) {
        // 1. Distance check
        double dist = entity.getCenter().distance(player.getCenter());
        if (dist > VISION_RANGE) return false;

        // 2. Angle check
        Point2D toPlayer = player.getCenter().subtract(entity.getCenter());
        Point2D facing   = angleToVector(entity.getRotation());
        double  dot      = facing.normalize().dotProduct(toPlayer.normalize());
        double  angle    = Math.toDegrees(Math.acos(Math.max(-1, Math.min(1, dot))));
        if (angle > VISION_HALF_ANGLE) return false;

        // 3. Line of sight: check if any WALL entity intersects the ray
        return !wallBlocksLOS(entity.getCenter(), player.getCenter());
    }

    private boolean wallBlocksLOS(Point2D from, Point2D to) {
        // Sample points along the ray at TILE/2 intervals
        int steps = (int)(from.distance(to) / (TILE / 2.0));
        for (int i = 1; i < steps; i++) {
            double t = (double) i / steps;
            double x = from.getX() + (to.getX() - from.getX()) * t;
            double y = from.getY() + (to.getY() - from.getY()) * t;
            Point2D point = new Point2D(x, y);

            boolean wallHit = getGameWorld().getEntitiesByType(EntityType.WALL)
                    .stream()
                    .anyMatch(wall -> wall.getBoundingBoxComponent()
                                         .isWithin(point.getX(), point.getY()));
            if (wallHit) return true;
        }
        return false;
    }

    private void updatePatrolling(double tpf, boolean canSee, Entity player) {
        if (canSee) {
            PlayerComponent pc = player.getComponent(PlayerComponent.class);
            double rate = pc.isRunning() ? DETECTION_RATE * 2 : DETECTION_RATE;
            detectionMeter = Math.min(1, detectionMeter + rate * tpf);
            if (detectionMeter > 0.5) transitionTo(DetectionState.SUSPICIOUS);
        } else {
            detectionMeter = Math.max(0, detectionMeter - DECAY_RATE * tpf);
        }
    }

    private void updateSuspicious(double tpf, boolean canSee, Entity player) {
        if (canSee) {
            detectionMeter = Math.min(1, detectionMeter + DETECTION_RATE * 1.5 * tpf);
            if (detectionMeter >= 1.0) transitionTo(DetectionState.ALERTED);
        } else {
            detectionMeter = Math.max(0, detectionMeter - DECAY_RATE * 0.5 * tpf);
            if (detectionMeter <= 0) transitionTo(DetectionState.PATROLLING);
        }
    }

    private void updateAlerted(double tpf, boolean canSee, Entity player) {
        if (canSee) {
            lastKnownPos = player.getCenter();
            chasePlayer(player);
        } else {
            transitionTo(DetectionState.SEARCHING);
        }
    }

    private void updateSearching(double tpf, boolean canSee, Entity player) {
        if (canSee) { transitionTo(DetectionState.ALERTED); return; }
        searchTimer += tpf;
        if (searchTimer >= SEARCH_DURATION) {
            detectionMeter = 0;
            searchTimer = 0;
            transitionTo(DetectionState.PATROLLING);
        } else {
            // Move to last known position
            patrol.moveTo(lastKnownPos);
        }
    }

    private void transitionTo(DetectionState newState) {
        state = newState;
        switch (newState) {
            case PATROLLING -> patrol.resume();
            case SUSPICIOUS -> patrol.pause();
            case ALERTED    -> {
                patrol.pause();
                alertNearbyGuards();
                play("sounds/alert.wav");
            }
            case SEARCHING  -> {
                searchTimer = 0;
                patrol.moveTo(lastKnownPos);
            }
        }
    }

    private void chasePlayer(Entity player) {
        AStarMoveComponent astar = entity.getComponent(AStarMoveComponent.class);
        astar.moveToCell(
            (int)(player.getX() / TILE),
            (int)(player.getY() / TILE));
    }

    private void alertNearbyGuards() {
        getGameWorld().getEntitiesByType(EntityType.GUARD)
                .stream()
                .filter(g -> g.getCenter().distance(entity.getCenter()) < 300)
                .forEach(g -> g.getComponent(GuardComponent.class)
                               .transitionTo(DetectionState.ALERTED));
    }

    private void updateFOVVisual() {
        // Update the FOV cone arc — see visual section below
    }

    private Point2D angleToVector(double angleDegrees) {
        double rad = Math.toRadians(angleDegrees);
        return new Point2D(Math.cos(rad), Math.sin(rad));
    }
}
```

## FOV Cone Visual

```java
// Draw the cone as a JavaFX Arc or Path node on the guard entity's view
private Arc fovCone;

private void initFOVVisual(Entity guard) {
    fovCone = new Arc();
    fovCone.setType(ArcType.ROUND);
    fovCone.setRadiusX(VISION_RANGE);
    fovCone.setRadiusY(VISION_RANGE);
    fovCone.setLength(VISION_HALF_ANGLE * 2);
    fovCone.setFill(Color.color(1, 1, 0, 0.15));
    fovCone.setStroke(Color.color(1, 1, 0, 0.4));

    guard.getViewComponent().addChild(fovCone);
}

// In GuardComponent.updateFOVVisual():
private void updateFOVVisual() {
    fovCone.setStartAngle(-entity.getRotation() - VISION_HALF_ANGLE);
    // Color shifts red when suspicious/alerted
    fovCone.setFill(switch (state) {
        case PATROLLING -> Color.color(1, 1, 0, 0.12);
        case SUSPICIOUS -> Color.color(1, 0.5, 0, 0.20);
        case ALERTED    -> Color.color(1, 0, 0, 0.30);
        case SEARCHING  -> Color.color(1, 0.3, 0, 0.20);
    });
}
```

## Noise System

```java
public class NoiseEmitter {
    public static void emit(Entity source, double radius) {
        // Find all guards within radius
        getGameWorld().getEntitiesByType(EntityType.GUARD)
                .stream()
                .filter(guard -> guard.getCenter().distance(source.getCenter()) <= radius)
                .forEach(guard -> {
                    GuardComponent gc = guard.getComponent(GuardComponent.class);
                    gc.hearNoise(source.getCenter());
                });
    }
}

// In GuardComponent:
public void hearNoise(Point2D noisePos) {
    if (state == DetectionState.PATROLLING || state == DetectionState.SUSPICIOUS) {
        lastKnownPos = noisePos;
        transitionTo(DetectionState.SUSPICIOUS);
        entity.setRotation(Math.toDegrees(Math.atan2(
            noisePos.getY() - entity.getCenter().getY(),
            noisePos.getX() - entity.getCenter().getX()
        )));
    }
}

// In PlayerComponent.onUpdate — emit noise based on action:
if (isRunning && isMoving) NoiseEmitter.emit(entity, 200);
else if (isMoving)          NoiseEmitter.emit(entity, 60);
// Throw object at position:
public static void throwDistractionObject(Point2D target) {
    NoiseEmitter.emit(target, 300);
}
```

## Hiding Spot Mechanic

```java
// Shadow/locker entities in the level:
@Spawns("hidingSpot")
public Entity newHidingSpot(SpawnData data) {
    return entityBuilder(data)
            .type(EntityType.HIDING_SPOT)
            .bbox(BoundingShape.box(data.get("width"), data.get("height")))
            .with(new PhysicsComponent())   // sensor
            .build();
}

// Player hiding state
private boolean playerIsHiding = false;

@Override
protected void initPhysics() {
    onCollisionBegin(EntityType.PLAYER, EntityType.HIDING_SPOT, (player, spot) -> {
        playerIsHiding = true;
        player.getViewComponent().setOpacity(0.4);  // visual: semi-transparent
        player.getComponent(PlayerComponent.class).setHiding(true);
    });
    onCollisionEnd(EntityType.PLAYER, EntityType.HIDING_SPOT, (player, spot) -> {
        playerIsHiding = false;
        player.getViewComponent().setOpacity(1.0);
        player.getComponent(PlayerComponent.class).setHiding(false);
    });
}

// In GuardComponent.canSeePlayer:
PlayerComponent pc = player.getComponent(PlayerComponent.class);
if (pc.isHiding()) return false;   // can't see player in hiding spot
```

## Takedown Mechanic

```java
// Player can knock out a guard from behind when undetected
onKeyDown(KeyCode.E, () -> {
    if (playerIsHiding) return;
    Entity nearestGuard = getGameWorld()
            .getEntitiesByType(EntityType.GUARD)
            .stream()
            .filter(g -> g.getCenter().distance(player.getCenter()) < 50)
            .filter(g -> isApproachingFromBehind(g))
            .findFirst().orElse(null);

    if (nearestGuard != null) {
        nearestGuard.getComponent(GuardComponent.class).knockout();
    }
});

private boolean isApproachingFromBehind(Entity guard) {
    Point2D toPlayer = player.getCenter().subtract(guard.getCenter());
    Point2D facing   = angleToVector(guard.getRotation());
    return facing.dotProduct(toPlayer.normalize()) < -0.5;  // behind = dot < 0
}

// In GuardComponent:
public void knockout() {
    state = null;  // disable AI
    patrol.pause();
    entity.getViewComponent().setOpacity(0.5);
    // After 30 seconds: guard wakes up
    runOnce(() -> {
        entity.getViewComponent().setOpacity(1.0);
        transitionTo(DetectionState.PATROLLING);
    }, Duration.seconds(30));
}
```

## Player Detection HUD

```java
// Show detection meter bar per guard or global danger level
@Override
protected void initUI() {
    Rectangle detectionBg  = new Rectangle(200, 12, Color.color(0.2, 0.2, 0.2, 0.8));
    Rectangle detectionBar = new Rectangle(0,   12, Color.YELLOW);
    StackPane meter = new StackPane(detectionBg, detectionBar);
    StackPane.setAlignment(detectionBar, Pos.CENTER_LEFT);
    addUINode(meter, 20, 20);

    // Update each frame
    getGameTimer().runAtInterval(() -> {
        double maxDetection = getGameWorld().getEntitiesByType(EntityType.GUARD)
                .stream()
                .mapToDouble(g -> g.getComponent(GuardComponent.class).getDetectionMeter())
                .max().orElse(0);
        detectionBar.setWidth(200 * maxDetection);
        detectionBar.setFill(maxDetection > 0.7 ? Color.RED
                           : maxDetection > 0.3 ? Color.ORANGE
                           : Color.YELLOW);
    }, Duration.millis(50));
}
```

## Gotchas

- **LOS raycasting samples must be fine-grained enough** — sampling at `TILE/2` intervals
  prevents the ray from skipping through thin walls. For very thin walls, decrease the step size.
- **Detection rate modifier for running** — a player running should be spotted 2-3× faster.
  Pass `PlayerComponent.isRunning()` into the detection calculation, not just the state.
- **Alert propagation should only go to nearby guards** — alerting ALL guards globally breaks
  large levels. Use a radius (e.g. 300px) for the initial call-for-backup propagation.
- **Guard rotation must be updated for facing direction** — `patrol.resume()` does NOT update
  `entity.getRotation()`. Update rotation manually in `onUpdate` based on movement direction for LOS.
- **`wallBlocksLOS` is O(walls × steps)** — for large levels with many walls, this can be slow
  if called every frame per guard. Cache per guard per N frames (every 3 frames is imperceptible).
- **Hide the player entity in hiding spots, don't make it invisible** — semi-transparent (opacity 0.4)
  looks better than invisible and makes it clear the player is hiding, not gone.
- **Guard patrol must resume at the next waypoint, not the nearest** — WaypointMoveComponent
  resumes from where it stopped. If you need the guard to return to a specific post, call
  `moveTo(postPosition)` before `resume()`.
