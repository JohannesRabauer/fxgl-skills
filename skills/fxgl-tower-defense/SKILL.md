---
name: fxgl-tower-defense
description: >
  Build a tower defense game in FXGL — implement waypoint-following enemies with
  WaypointMoveComponent, create a boolean grid for tower placement that excludes path
  cells, implement tower targeting logic (nearest/strongest/first enemy in range), fire
  projectiles from towers at enemies, build a wave-based enemy spawning system with
  configurable intervals, add gold rewards on enemy kills, deduct player lives when
  enemies reach the exit, implement tower sell/upgrade mechanics, preview tower range with
  a circle overlay, and support multiple tower types (basic, slow, splash, chain). Use
  this skill when building a tower defense game, lane defense, or any game where the
  player places defensive structures against waves of path-following enemies.
triggers:
  - tower defense
  - waypoint enemy
  - tower placement
  - wave system
  - tower range
  - enemy path
  - tower targeting
  - splash tower
  - slow tower
  - buy tower
  - sell tower
compatibility: >
  Java 17+, FXGL 21.x
category: fxgl/game-types
tags:
  - fxgl
  - java
  - javafx
  - game-types
  - tower
  - defense
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
# FXGL Tower Defense

## Grid Setup

```java
private static final int TILE = 48;
private static final int COLS = 20;
private static final int ROWS = 12;

// Grid: true = occupied (path or tower), false = buildable
private boolean[][] occupied = new boolean[COLS][ROWS];

// Mark path cells as occupied (read from Tiled or define manually)
private List<Point2D> waypointPixels;

@Override
protected void initGame() {
    setLevelFromMap("td_level.tmx");
    // Read waypoints from Tiled object layer
    waypointPixels = getGameWorld()
            .getEntitiesByType(EntityType.WAYPOINT)
            .stream()
            .sorted(Comparator.comparingInt(e -> e.getInt("order")))
            .map(Entity::getPosition)
            .toList();

    // Mark path tiles as occupied using Tiled tile type
    getGameWorld().getEntitiesByType(EntityType.PATH).forEach(e -> {
        occupied[(int)(e.getX() / TILE)][(int)(e.getY() / TILE)] = true;
    });
}
```

## Enemy with WaypointMoveComponent

```java
@Spawns("enemy")
public Entity newEnemy(SpawnData data) {
    WaypointMoveComponent waypointMove = new WaypointMoveComponent();
    waypointMove.setSpeed(data.getOrDefault("speed", 80.0));
    waypointMove.setLooping(false);
    waypointPixels.forEach(waypointMove::addWaypoint);

    // On reaching final waypoint — lose a life
    waypointMove.setOnLastWaypointReached(() -> {
        entity.removeFromWorld();
        inc("lives", -1);
        if (geti("lives") <= 0) showGameOver();
    });

    return entityBuilder(data)
            .type(EntityType.ENEMY)
            .view("enemy.png")
            .bbox(BoundingShape.circle(16))
            .with(waypointMove)
            .with(new HPComponent(data.getOrDefault("hp", 100)))
            .with(new EnemyProgressComponent())
            .build();
}
```

## Tower Placement

```java
// In initInput or mouse handler:
getInput().addMouseEventHandler(MouseEvent.MOUSE_CLICKED, e -> {
    if (selectedTowerType == null || e.getButton() != MouseButton.PRIMARY) return;

    int cx = (int)(e.getSceneX() / TILE);
    int cy = (int)(e.getSceneY() / TILE);

    if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return;
    if (occupied[cx][cy]) return;

    TowerConfig cfg = selectedTowerType;
    if (geti("gold") < cfg.cost()) { showMessage("Not enough gold!"); return; }

    occupied[cx][cy] = true;
    inc("gold", -cfg.cost());

    Entity tower = spawn(cfg.entityName(),
            new SpawnData(cx * TILE + TILE / 2.0, cy * TILE + TILE / 2.0));
    tower.set("gridX", cx);
    tower.set("gridY", cy);
    selectedTowerType = null;
}
);
```

## Tower Range Preview

```java
// Show range circle while hovering and tower type is selected
private Circle rangePreview = new Circle();

@Override
protected void initUI() {
    rangePreview.setFill(Color.TRANSPARENT);
    rangePreview.setStroke(Color.color(1, 1, 1, 0.4));
    rangePreview.setStrokeWidth(1.5);
    rangePreview.setVisible(false);
    addUINode(rangePreview);
}

// In mouse move handler:
getInput().addMouseEventHandler(MouseEvent.MOUSE_MOVED, e -> {
    if (selectedTowerType == null) { rangePreview.setVisible(false); return; }
    rangePreview.setVisible(true);
    rangePreview.setRadius(selectedTowerType.range());
    rangePreview.setCenterX(Math.floor(e.getSceneX() / TILE) * TILE + TILE / 2.0);
    rangePreview.setCenterY(Math.floor(e.getSceneY() / TILE) * TILE + TILE / 2.0);
});
```

## Tower Component — Target and Fire

```java
public class TowerComponent extends Component {
    private final double range;
    private final int    damage;
    private final double fireInterval;
    private double       fireTimer = 0;
    private Entity       target;

    public TowerComponent(double range, int damage, double fireInterval) {
        this.range = range;
        this.damage = damage;
        this.fireInterval = fireInterval;
    }

    @Override
    public void onUpdate(double tpf) {
        // Find or validate target
        if (target == null || !target.isActive() || distanceTo(target) > range) {
            target = findTarget();
        }
        if (target == null) return;

        // Rotate toward target
        Point2D dir = target.getCenter().subtract(entity.getCenter());
        entity.setRotation(Math.toDegrees(Math.atan2(dir.getY(), dir.getX())));

        // Fire
        fireTimer += tpf;
        if (fireTimer >= fireInterval) {
            fireTimer = 0;
            fireBullet();
        }
    }

    private Entity findTarget() {
        // Target: first (furthest along path = highest progress value)
        return getGameWorld().getEntitiesByType(EntityType.ENEMY)
                .stream()
                .filter(e -> distanceTo(e) <= range)
                .max(Comparator.comparingDouble(e ->
                        e.getComponent(EnemyProgressComponent.class).getProgress()))
                .orElse(null);
    }

    private void fireBullet() {
        spawn("towerBullet", new SpawnData(entity.getCenter().getX(), entity.getCenter().getY())
                .put("target", target)
                .put("damage", damage));
    }

    private double distanceTo(Entity e) {
        return entity.getCenter().distance(e.getCenter());
    }
}
```

## Tracking Bullet (Homes on Target)

```java
@Spawns("towerBullet")
public Entity newTowerBullet(SpawnData data) {
    return entityBuilder(data)
            .type(EntityType.TOWER_BULLET)
            .view(new Circle(4, Color.YELLOW))
            .bbox(BoundingShape.circle(4))
            .with(new CollidableComponent(true))
            .with(new TrackingBulletComponent(data.get("target"), data.get("damage")))
            .with(new ExpireCleanComponent(Duration.seconds(3)))
            .build();
}

public class TrackingBulletComponent extends Component {
    private Entity target;
    private final int damage;
    private static final double SPEED = 300;

    @Override
    public void onUpdate(double tpf) {
        if (!target.isActive()) { entity.removeFromWorld(); return; }

        Point2D dir = target.getCenter().subtract(entity.getCenter()).normalize();
        entity.translate(dir.getX() * SPEED * tpf, dir.getY() * SPEED * tpf);

        // Hit detection (manual — no Box2D needed for small circle vs circle)
        if (entity.getCenter().distance(target.getCenter()) < 12) {
            target.getComponent(HPComponent.class).damage(damage);
            if (target.getComponent(HPComponent.class).isDead()) {
                inc("gold", target.getInt("goldReward"));
                inc("score", target.getInt("goldReward") * 10);
                target.removeFromWorld();
            }
            entity.removeFromWorld();
        }
    }
}
```

## Wave System

```java
private final List<WaveConfig> waveConfigs = List.of(
    new WaveConfig(List.of(new EnemySpawn("basic", 5, 0.8))),
    new WaveConfig(List.of(new EnemySpawn("basic", 8, 0.6), new EnemySpawn("fast", 3, 1.0))),
    new WaveConfig(List.of(new EnemySpawn("tank", 2, 2.0), new EnemySpawn("fast", 10, 0.4)))
);

private int currentWave = 0;

private void startWave() {
    if (currentWave >= waveConfigs.size()) { showVictory(); return; }
    WaveConfig wave = waveConfigs.get(currentWave++);
    int totalEnemies = wave.spawns().stream().mapToInt(EnemySpawn::count).sum();
    set("enemiesThisWave", totalEnemies);

    double delay = 0;
    for (EnemySpawn spawn : wave.spawns()) {
        for (int i = 0; i < spawn.count(); i++) {
            String type = spawn.type();
            runOnce(() -> {
                spawn(type, waypointPixels.get(0).getX(), waypointPixels.get(0).getY());
            }, Duration.seconds(delay));
            delay += spawn.interval();
        }
    }
}

// Check for wave clear in onUpdate:
@Override
protected void onUpdate(double tpf) {
    if (geti("enemiesThisWave") == 0
            && getGameWorld().getEntitiesByType(EntityType.ENEMY).isEmpty()) {
        set("enemiesThisWave", -1);   // sentinel to avoid repeat trigger
        runOnce(this::startWave, Duration.seconds(3));  // grace period between waves
    }
}
```

## Tower Upgrade and Sell

```java
// On clicking an existing tower:
public void upgradeTower(Entity tower) {
    TowerComponent tc = tower.getComponent(TowerComponent.class);
    int upgradeCost = 75;
    if (geti("gold") < upgradeCost) { showMessage("Not enough gold!"); return; }
    inc("gold", -upgradeCost);
    tc.upgrade();   // increase damage, reduce fire interval, increase range
}

public void sellTower(Entity tower) {
    int sellValue = tower.getInt("cost") / 2;
    inc("gold", sellValue);

    int cx = tower.getInt("gridX");
    int cy = tower.getInt("gridY");
    occupied[cx][cy] = false;
    tower.removeFromWorld();
}
```

## Gotchas

- **Mark path cells occupied during `initGame`** — if you forget, players can place towers
  ON the enemy path, blocking movement. The enemy `WaypointMoveComponent` ignores obstacles;
  towers physically sitting on the path would be invisible but towers would still target.
- **`WaypointMoveComponent.setOnLastWaypointReached`** is called on the game thread — safe to
  call `removeFromWorld()` directly from this callback.
- **Enemy progress tracking** — for "target furthest along path" logic, track a `progress` value
  (which waypoint the enemy is heading toward) rather than computing distance-to-start, because
  enemies can back-slide on curved paths.
- **Tracking bullets become stale** — always check `target.isActive()` in the bullet's `onUpdate`.
  An enemy can be killed by another tower between the bullet's creation and its arrival.
- **`spawn()` inside `runOnce()` inside a loop** — closures capture the loop variable by reference
  in Java lambdas if `delay` is a double field. Use a local `final double d = delay` inside the loop.
- **Range preview should use UI coordinates, not world coordinates** — the range circle is drawn
  in the UI layer which uses screen coordinates. If the camera scrolls, convert world-to-screen first.
- **Sell/upgrade UI** — show a small popup overlay on tower click, not a permanent panel. Use
  `getSceneService().pushSubScene()` for a non-blocking upgrade panel.
