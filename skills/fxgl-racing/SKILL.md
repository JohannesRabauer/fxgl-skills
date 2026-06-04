---
name: fxgl-racing
description: >
  Build a top-down racing game in FXGL — implement vehicle physics with forward thrust,
  steering, friction, and drift, create a circuit track with ordered checkpoint gates for
  lap counting, add AI opponents following a predefined racing line with waypoints, handle
  car-wall collisions with bounce-back, add power-up pickups on track (boost, shield,
  attack), track race position (1st/2nd/3rd), display lap timer and best lap, and
  implement a ghost replay system for time trials. Use this skill when building a top-down
  racer, kart racer, circuit racing game, or any vehicle-control game with lap-based
  competition.
triggers:
  - racing
  - top-down racing
  - car physics
  - lap counter
  - checkpoint
  - racing line
  - AI racer
  - drift
  - kart
  - circuit
  - ghost replay
  - race position
compatibility: >
  Java 17+, FXGL 21.x
category: fxgl/game-types
tags:
  - fxgl
  - java
  - javafx
  - game-types
  - racing
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
# FXGL Top-Down Racing

## Vehicle Physics Component

```java
public class VehicleComponent extends Component {
    private PhysicsComponent physics;

    // Tuning parameters
    private static final double ACCELERATION     = 300.0;  // px/s²
    private static final double MAX_SPEED        = 350.0;  // px/s
    private static final double TURN_SPEED       = 3.0;    // radians/s at full speed
    private static final double FRICTION         = 0.85;   // velocity multiplier per frame
    private static final double DRIFT_FRICTION   = 0.95;   // less grip when drifting

    private double speed    = 0;
    private double angle    = 0;   // heading in radians (0 = right)
    private boolean drifting = false;

    @Override
    public void onUpdate(double tpf) {
        boolean throttle = isHeld(KeyCode.W) || isHeld(KeyCode.UP);
        boolean brake    = isHeld(KeyCode.S) || isHeld(KeyCode.DOWN);
        boolean left     = isHeld(KeyCode.A) || isHeld(KeyCode.LEFT);
        boolean right    = isHeld(KeyCode.D) || isHeld(KeyCode.RIGHT);
        drifting         = isHeld(KeyCode.SHIFT) && Math.abs(speed) > 50;

        // Throttle and brake
        if (throttle) speed = Math.min(MAX_SPEED, speed + ACCELERATION * tpf);
        else if (brake) speed = Math.max(-MAX_SPEED * 0.4, speed - ACCELERATION * 1.5 * tpf);

        // Apply friction (stronger when not throttling)
        double friction = drifting ? DRIFT_FRICTION : FRICTION;
        if (!throttle && !brake) speed *= Math.pow(friction, tpf * 60);

        // Steering — only meaningful when moving
        if (Math.abs(speed) > 10) {
            double steerAmount = TURN_SPEED * tpf * (speed / MAX_SPEED);
            if (left)  angle -= steerAmount;
            if (right) angle += steerAmount;
        }

        // Move in facing direction
        double vx = Math.cos(angle) * speed;
        double vy = Math.sin(angle) * speed;

        // Reduce lateral slip (grip)
        double lateralFriction = drifting ? 0.96 : 0.85;
        physics.setVelocityX(vx * (1 - lateralFriction) + physics.getVelocityX() * lateralFriction);
        physics.setVelocityY(vy * (1 - lateralFriction) + physics.getVelocityY() * lateralFriction);

        entity.setRotation(Math.toDegrees(angle));
    }

    public void applyBoost(double duration) {
        double boostSpeed = MAX_SPEED * 1.5;
        speed = boostSpeed;
        runOnce(() -> {}, Duration.seconds(duration));  // speed decays via friction after
    }

    private boolean isHeld(KeyCode key) {
        return getInput().isHeld(key);
    }
}
```

## Checkpoint Lap System

```java
// Checkpoints defined in Tiled as ordered sensor objects
// Each has a custom property "order" (0 = start/finish line)

@Override
protected void initPhysics() {
    onCollisionBegin(EntityType.PLAYER_CAR, EntityType.CHECKPOINT, (car, checkpoint) -> {
        int cpOrder = checkpoint.getInt("order");
        int expected = car.getInt("nextCheckpoint");

        if (cpOrder == expected) {
            int maxCP = getCheckpointCount() - 1;
            if (cpOrder == 0 && expected == 0 && car.getInt("lapProgress") > 0) {
                // Crossed finish line in correct order → complete lap
                completeLap(car);
            } else {
                car.set("nextCheckpoint", (cpOrder + 1) % (maxCP + 1));
                car.set("lapProgress", cpOrder);
            }
        }
    });
}

private void completeLap(Entity car) {
    int lap = car.getInt("laps") + 1;
    car.set("laps", lap);
    car.set("nextCheckpoint", 1);  // 0 = finish line, so next expected is 1
    car.set("lapProgress", 0);

    double lapTime = car.getDouble("lapStartTime") - getCurrentTime();
    // Record best lap
    if (lapTime < car.getDouble("bestLap")) car.set("bestLap", lapTime);
    car.set("lapStartTime", getCurrentTime());

    if (lap >= TOTAL_LAPS) {
        onRaceFinish(car);
    }
}
```

## Race Position Tracking

```java
// Calculate progress score: laps × totalCheckpoints + checkpointsPassed + distToNextCP
private double getRaceProgress(Entity car) {
    int laps     = car.getInt("laps");
    int cpPassed = car.getInt("lapProgress");
    int totalCPs = getCheckpointCount();

    // Find next checkpoint entity
    List<Entity> checkpoints = getGameWorld().getEntitiesByType(EntityType.CHECKPOINT)
            .stream().sorted(Comparator.comparingInt(e -> e.getInt("order"))).toList();
    int nextCP = car.getInt("nextCheckpoint");
    Entity nextCPEntity = checkpoints.get(nextCP % checkpoints.size());
    double distToNext = car.getCenter().distance(nextCPEntity.getCenter());
    double maxDist = 500.0;  // approximate max distance to checkpoint

    return (double)(laps * totalCPs + cpPassed) - (distToNext / maxDist);
}

@Override
protected void onUpdate(double tpf) {
    List<Entity> cars = new ArrayList<>();
    cars.add(playerCar);
    cars.addAll(aiCars);
    cars.sort(Comparator.comparingDouble(e -> -getRaceProgress(e)));

    for (int i = 0; i < cars.size(); i++) {
        cars.get(i).set("position", i + 1);
    }
    updatePositionHUD(playerCar.getInt("position"), cars.size());
}
```

## AI Car Following Racing Line

```java
public class AICarComponent extends Component {
    private VehicleComponent vehicle;
    private final List<Point2D> racingLine;   // predefined waypoints along optimal path
    private int nextWP = 0;
    private static final double WAYPOINT_REACH = 40.0;

    public AICarComponent(List<Point2D> racingLine) {
        this.racingLine = racingLine;
    }

    @Override
    public void onUpdate(double tpf) {
        Point2D target = racingLine.get(nextWP);
        Point2D toTarget = target.subtract(entity.getCenter());
        double dist = toTarget.magnitude();

        if (dist < WAYPOINT_REACH) {
            nextWP = (nextWP + 1) % racingLine.size();
            return;
        }

        // Compute steering: angle difference between car heading and target direction
        double targetAngle = Math.atan2(toTarget.getY(), toTarget.getX());
        double currentAngle = Math.toRadians(entity.getRotation());
        double angleDiff = normalizeAngle(targetAngle - currentAngle);

        // Apply steering via key simulation
        // (AI mimics player input by adjusting the vehicle's heading directly)
        double headingDelta = Math.signum(angleDiff) * Math.min(Math.abs(angleDiff), 2.5 * tpf);
        vehicle.addAngle(headingDelta);

        // Speed: slow down on tight corners
        double cornerSeverity = Math.abs(angleDiff);
        double targetSpeed = cornerSeverity > 0.5 ? 200 : 320;
        vehicle.setTargetSpeed(targetSpeed);
    }

    private double normalizeAngle(double a) {
        while (a >  Math.PI) a -= 2 * Math.PI;
        while (a < -Math.PI) a += 2 * Math.PI;
        return a;
    }
}
```

## Wall Collision

```java
@Override
protected void initPhysics() {
    onCollisionBegin(EntityType.PLAYER_CAR, EntityType.WALL, (car, wall) -> {
        // Reflect velocity off wall normal
        VehicleComponent vc = car.getComponent(VehicleComponent.class);
        vc.bounceOff(0.5);   // 50% speed retained after wall hit
        play("sounds/crash.wav");
    });
}

// In VehicleComponent:
public void bounceOff(double restitution) {
    speed = -speed * restitution;   // reverse direction briefly
}
```

## Ghost Replay (Time Trial)

```java
// Record player positions every 100ms
private final List<Point2D> ghostPositions = new ArrayList<>();
private final List<Double>  ghostAngles    = new ArrayList<>();
private double recordTimer = 0;

@Override
protected void onUpdate(double tpf) {
    if (isRecordingGhost) {
        recordTimer += tpf;
        if (recordTimer >= 0.1) {
            recordTimer = 0;
            ghostPositions.add(player.getPosition());
            ghostAngles.add(player.getRotation());
        }
    }

    if (isPlayingGhost && ghostIndex < ghostPositions.size()) {
        ghostTimer += tpf;
        if (ghostTimer >= 0.1) {
            ghostTimer = 0;
            ghostCar.setPosition(ghostPositions.get(ghostIndex));
            ghostCar.setRotation(ghostAngles.get(ghostIndex));
            ghostIndex++;
        }
    }
}
```

## Gotchas

- **Lateral friction correction is essential** — without damping the perpendicular velocity,
  the car slides like it's on ice. The `lateralFriction` calculation prevents pure sliding while
  allowing controlled drift when `drifting = true`.
- **Checkpoint order validation prevents shortcutting** — always check that the checkpoint hit
  matches the expected next checkpoint. Without validation, players can drive through
  checkpoints in reverse order or skip across the track.
- **`speed` is a scalar, not a vector** — the direction comes from `angle`. When the car hits
  a wall, flip `speed` sign briefly to create bounce-back. Don't try to flip a velocity vector directly.
- **AI tuning is iterative** — the `WAYPOINT_REACH` radius determines how "sharp" corners are.
  Too small = cars over-steer and spin out. Too large = cars cut wide corners.
- **Ghost entity should be semi-transparent** — use `ghostCar.getViewComponent().setOpacity(0.5)`.
  Ghost collisions should be disabled (no physics component, no collidable).
- **Race position updates each frame are cheap** — with 8 cars the sort is negligible. Don't
  be tempted to throttle this to every N frames; gaps in position display feel wrong.
- **Body type for cars must be DYNAMIC** — kinematic bodies ignore forces and won't respond
  to wall collisions naturally. Use DYNAMIC with manually controlled velocity.
