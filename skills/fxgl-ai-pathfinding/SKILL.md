---
name: fxgl-ai-pathfinding
description: >
  Implement AI movement and pathfinding in FXGL — set up an AStarGrid, find paths using
  AStarPathfinder, attach AStarMoveComponent or RandomAStarMoveComponent to entities,
  implement GOAP (Goal-Oriented Action Planning) with world state and action
  preconditions, add SenseAI for vision and hearing, set up waypoint patrol routes,
  generate dungeons and mazes procedurally. Use this skill when making enemies chase the
  player, implementing patrol behaviours, building GOAP NPC AI, adding pathfinding to a
  tile-based game, or generating procedural levels.
triggers:
  - A*
  - pathfinding
  - AStarGrid
  - AStarMoveComponent
  - GOAP
  - enemy AI
  - patrol
  - chase
  - SenseAI
  - dungeon generation
  - maze
  - waypoint
  - enemy movement
compatibility: >
  Java 17+, FXGL 21.x
category: fxgl/ai
tags:
  - fxgl
  - java
  - javafx
  - ai
  - pathfinding
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
# FXGL AI — Pathfinding, GOAP & Sense AI

## A* Pathfinding Setup

### Build the grid from the world

```java
// Create grid after level is loaded (in initGame, after setLevelFromMap)
private AStarGrid grid;

@Override
protected void initGame() {
    setLevelFromMap("level1.tmx");

    // Build grid: tile size must match Tiled tile width/height
    grid = AStarGrid.fromWorld(getGameWorld(), 32, 32);
    // Cells corresponding to WALL-type entities are automatically NOT_WALKABLE
    // Mark additional non-walkable cells:
    getGameWorld().getEntitiesByType(EntityType.OBSTACLE).forEach(e -> {
        int cx = (int)(e.getX() / 32);
        int cy = (int)(e.getY() / 32);
        grid.getCell(cx, cy).setState(CellState.NOT_WALKABLE);
    });
}
```

### Find a path manually

```java
// Returns null if no path exists
List<AStarCell> path = grid.getAStarSearch().findPath(
        (int)(startX / 32),   // cell X of start
        (int)(startY / 32),   // cell Y of start
        (int)(goalX  / 32),   // cell X of goal
        (int)(goalY  / 32)    // cell Y of goal
);

if (path != null) {
    path.forEach(cell -> {
        double worldX = cell.getX() * 32;
        double worldY = cell.getY() * 32;
        System.out.println("Step: " + worldX + ", " + worldY);
    });
}
```

### AStarMoveComponent (enemy follows player)

```java
// In enemy factory
@Spawns("enemy")
public Entity newEnemy(SpawnData data) {
    AStarMoveComponent astar = new AStarMoveComponent(new AStarGridView(grid));

    return entityBuilder(data)
            .type(EntityType.ENEMY)
            .view("enemy.png")
            .bbox(BoundingShape.box(32, 32))
            .with(astar)
            .with(new EnemyAIComponent())
            .build();
}

// In EnemyAIComponent.onUpdate — periodically recalculate path
public class EnemyAIComponent extends Component {
    private AStarMoveComponent astar;
    private double recalcTimer = 0;

    @Override
    public void onUpdate(double tpf) {
        recalcTimer += tpf;
        if (recalcTimer >= 0.5) {  // recalc every 0.5s (not every frame — expensive)
            recalcTimer = 0;
            Entity player = getGameWorld().getSingleton(e -> e.isType(EntityType.PLAYER));
            astar.moveToCell(
                    (int)(player.getX() / 32),
                    (int)(player.getY() / 32)
            );
        }
    }
}
```

### RandomAStarMoveComponent (wandering)

```java
RandomAStarMoveComponent wander = new RandomAStarMoveComponent(new AStarGridView(grid));
wander.setMoveSpeed(120);        // pixels per second
wander.setMinWanderDistance(3);  // min distance in cells between waypoints
wander.setMaxWanderDistance(8);  // max distance
entity.addComponent(wander);
// Entity wanders autonomously — no further code needed
```

## Waypoint Patrol

```java
WaypointMoveComponent patrol = new WaypointMoveComponent();
patrol.setSpeed(100);
patrol.setLooping(true);
patrol.addWaypoint(new Point2D(100, 200));
patrol.addWaypoint(new Point2D(500, 200));
patrol.addWaypoint(new Point2D(500, 400));
patrol.addWaypoint(new Point2D(100, 400));

entity.addComponent(patrol);

// Pause patrol on player detection, resume when player leaves
patrol.pause();
patrol.resume();
```

## GOAP (Goal-Oriented Action Planning)

### Define world state

```java
// World state is a Map<String, Boolean>
Map<String, Boolean> worldState = new HashMap<>();
worldState.put("hasAmmo",    true);
worldState.put("hasWeapon",  false);
worldState.put("enemyDead",  false);
worldState.put("inRange",    false);

// Goal: what we want to achieve
Map<String, Boolean> goal = new HashMap<>();
goal.put("enemyDead", true);
```

### Define actions

```java
// Each action: preconditions + effects + cost + perform logic
public class FindWeaponAction extends GoapAction {
    public FindWeaponAction() {
        // Preconditions: none (always possible if weapon exists in world)
        // Effects: hasWeapon = true
        addEffect("hasWeapon", true);
        setCost(2.0f);
    }

    @Override
    public boolean checkProceduralPrecondition(Entity agent) {
        // Return true only if a weapon entity exists in the world
        return !getGameWorld().getEntitiesByType(EntityType.WEAPON).isEmpty();
    }

    @Override
    public boolean perform(Entity agent) {
        // Move toward nearest weapon and pick it up
        Entity weapon = getGameWorld().getClosestEntity(agent,
                e -> e.isType(EntityType.WEAPON));
        agent.getComponent(AStarMoveComponent.class).moveTo(weapon.getPosition());
        if (agent.getPosition().distance(weapon.getPosition()) < 20) {
            weapon.removeFromWorld();
            return true; // action complete
        }
        return false; // still in progress
    }
}

public class AttackAction extends GoapAction {
    public AttackAction() {
        addPrecondition("hasWeapon", true);
        addPrecondition("inRange",   true);
        addEffect("enemyDead", true);
        addEffect("hasAmmo",   false);
        setCost(1.0f);
    }

    @Override
    public boolean perform(Entity agent) {
        agent.getComponent(AttackComponent.class).attack();
        return true;
    }
}

public class MoveInRangeAction extends GoapAction {
    public MoveInRangeAction() {
        addPrecondition("hasWeapon", true);
        addEffect("inRange", true);
        setCost(1.5f);
    }

    @Override
    public boolean perform(Entity agent) {
        Entity player = getGameWorld().getSingleton(e -> e.isType(EntityType.PLAYER));
        if (agent.getPosition().distance(player.getPosition()) < 100) {
            return true;
        }
        agent.getComponent(AStarMoveComponent.class).moveTo(player.getPosition());
        return false;
    }
}
```

### Run the planner

```java
List<GoapAction> availableActions = List.of(
    new FindWeaponAction(),
    new MoveInRangeAction(),
    new AttackAction()
);

Queue<GoapAction> plan = GoapPlanner.plan(agentEntity, availableActions, worldState, goal);

if (plan != null) {
    // Execute plan in sequence
    GoapAction current = plan.poll();
    // In onUpdate: execute current action, advance to next when complete
}
```

## Sense AI (Vision + Hearing)

```java
// Add SenseAIComponent to enemy entity
SenseComponent sense = new SenseComponent(250.0, 120.0); // range=250, fov=120 degrees

sense.setOnEntered(other -> {
    if (other.isType(EntityType.PLAYER)) {
        isPlayerDetected = true;
        getComponent(AStarMoveComponent.class).moveTo(other.getPosition());
    }
});

sense.setOnLeft(other -> {
    if (other.isType(EntityType.PLAYER)) {
        isPlayerDetected = false;
        getComponent(WaypointMoveComponent.class).resume();
    }
});

entity.addComponent(sense);
```

## Dungeon Generation

```java
// Config
DungeonConfig config = new DungeonConfig()
        .gridWidth(40)
        .gridHeight(40)
        .minRoomSize(5)
        .maxRoomSize(12)
        .maxRooms(15);

// Generate
DungeonGenerator generator = new DungeonGenerator(config);
Grid2D<DungeonCell> dungeon = generator.generate();

// Render
dungeon.forEach((cell, x, y) -> {
    int worldX = x * TILE_SIZE;
    int worldY = y * TILE_SIZE;
    switch (cell.getType()) {
        case FLOOR     -> spawn("floor",    worldX, worldY);
        case WALL      -> spawn("wall",     worldX, worldY);
        case CORRIDOR  -> spawn("floor",    worldX, worldY);  // treat corridor as floor
        case DOOR      -> spawn("door",     worldX, worldY);
        case BOSS_ROOM -> spawn("bossFloor",worldX, worldY);
    }
});

// Player starts in first room
Room startRoom = generator.getRooms().get(0);
spawn("player", startRoom.getCenterX() * TILE_SIZE, startRoom.getCenterY() * TILE_SIZE);

// Boss in last room
Room bossRoom = generator.getRooms().get(generator.getRooms().size() - 1);
spawn("boss", bossRoom.getCenterX() * TILE_SIZE, bossRoom.getCenterY() * TILE_SIZE);
```

## Maze Generation

```java
MazeGenerator mazeGen = new MazeGenerator(20, 15); // width, height in cells
Grid2D<MazeCell> maze = mazeGen.generate();

maze.forEach((cell, x, y) -> {
    if (cell.hasTopWall())    spawnWall(x, y, "top");
    if (cell.hasLeftWall())   spawnWall(x, y, "left");
    if (cell.hasRightWall())  spawnWall(x, y, "right");
    if (cell.hasBottomWall()) spawnWall(x, y, "bottom");
});
```

## Gotchas

- **Rebuild `AStarGrid` after every level load** — the grid caches cell states from the
  world; stale grids cause enemies to walk through walls spawned in the new level.
- **Recalculate paths at intervals, not every frame** — A* on a 40×40 grid costs ~0.5ms.
  At 60fps with 10 enemies, that's 300ms/s wasted. Recalc every 0.5s max.
- **`AStarGrid.fromWorld` marks only `STATIC` physics bodies as NOT_WALKABLE** — dynamic
  entities (other enemies) are ignored. Handle entity-entity avoidance separately.
- **GOAP planner returns `null`** when no plan is possible with the given actions. Always
  null-check and handle with a default behaviour (idle, wander, alert).
- **`WaypointMoveComponent` requires exact world coordinates** (pixels) not grid coordinates.
  Multiply grid cell indices by tile size.
- **Dungeon generation is random** — use `DungeonConfig.seed(long)` for reproducible layouts
  (e.g., seeded from the current level number for consistent procedural content).
- **SenseAI field-of-view is from the entity's forward direction** — make sure your enemy
  entity faces the direction of travel (update `entity.setRotation(angle)` each frame).
