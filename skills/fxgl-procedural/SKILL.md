---
name: fxgl-procedural
description: >
  Generate procedural content in FXGL — create random dungeon layouts with
  DungeonGenerator and DungeonConfig (room size, count, grid dimensions), generate perfect
  mazes with MazeGenerator, convert generated Grid2D cells to spawned game entities via
  EntityFactory, seed generation for reproducible levels, mark special rooms (start, boss,
  treasure), solve generated mazes with A*, and integrate procedural levels with
  SaveLoadService for level codes. Use this skill when building a roguelike, endless
  runner, procedurally generated dungeon crawler, or any game where levels are generated
  at runtime rather than hand-crafted.
triggers:
  - procedural
  - dungeon generation
  - DungeonGenerator
  - DungeonConfig
  - MazeGenerator
  - random level
  - Grid2D
  - DungeonCell
  - MazeCell
  - roguelike
  - procedural generation
  - random dungeon
  - level generation
  - seeded
  - level code
compatibility: >
  Java 17+, FXGL 21.x
category: fxgl/procedural
tags:
  - fxgl
  - java
  - javafx
  - procedural
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
# FXGL Procedural Generation

## Dungeon Generation

```java
import com.almasb.fxgl.procedural.dungeon.DungeonConfig;
import com.almasb.fxgl.procedural.dungeon.DungeonGenerator;
import com.almasb.fxgl.procedural.dungeon.DungeonCell;
import com.almasb.fxgl.procedural.dungeon.Room;
import com.almasb.fxgl.core.collection.grid.Grid2D;

// 1. Configure
DungeonConfig config = new DungeonConfig()
        .gridWidth(60)
        .gridHeight(60)
        .minRoomSize(5)
        .maxRoomSize(14)
        .maxRooms(20);

// 2. Generate
DungeonGenerator generator = new DungeonGenerator(config);
Grid2D<DungeonCell> dungeon = generator.generate();

// 3. Spawn entities
int TILE = 32;   // pixels per tile

dungeon.forEach((cell, x, y) -> {
    double wx = x * TILE;
    double wy = y * TILE;

    switch (cell.getType()) {
        case FLOOR      -> spawn("floor",     wx, wy);
        case WALL       -> spawn("wall",      wx, wy);
        case CORRIDOR   -> spawn("floor",     wx, wy);   // corridors use floor tile
        case DOOR       -> spawn("door",      wx, wy);
        case BOSS_ROOM  -> spawn("bossFloor", wx, wy);
        case EMPTY      -> {}                             // outside dungeon — skip
    }
});
```

## Accessing Special Rooms

```java
List<Room> rooms = generator.getRooms();

// Start room — first room placed (guaranteed to exist)
Room startRoom = rooms.get(0);
double startX = startRoom.getCenterX() * TILE;
double startY = startRoom.getCenterY() * TILE;
spawn("player", startX, startY);

// Boss room — last room placed (furthest from start)
Room bossRoom = rooms.get(rooms.size() - 1);
spawn("boss", bossRoom.getCenterX() * TILE, bossRoom.getCenterY() * TILE);

// Treasure rooms — random middle rooms
for (int i = 1; i < rooms.size() - 1; i++) {
    if (FXGLMath.randomBoolean(0.3)) {   // 30% chance per room
        Room r = rooms.get(i);
        spawn("chest", r.getCenterX() * TILE, r.getCenterY() * TILE);
    }
}
```

## Seeded Generation (Reproducible Levels)

```java
// Use a seed so the same number always produces the same dungeon
long seed = 42L;   // or derive from level number, player ID, etc.

DungeonConfig config = new DungeonConfig()
        .gridWidth(50)
        .gridHeight(50)
        .minRoomSize(5)
        .maxRoomSize(12)
        .maxRooms(15)
        .seed(seed);

DungeonGenerator generator = new DungeonGenerator(config);
Grid2D<DungeonCell> dungeon = generator.generate();
// Same config + same seed → identical dungeon every time

// Share as "level code" with players
String levelCode = Long.toString(seed, 36).toUpperCase();  // e.g. "Y" or "1Z4K"
// Reconstruct: long seed = Long.parseLong(levelCode.toLowerCase(), 36);
```

## Maze Generation

```java
import com.almasb.fxgl.procedural.maze.MazeGenerator;
import com.almasb.fxgl.procedural.maze.MazeCell;

// 1. Generate (uses recursive backtracker DFS — perfect maze)
MazeGenerator mazeGen = new MazeGenerator(25, 20);  // columns, rows
Grid2D<MazeCell> maze = mazeGen.generate();

// 2. Render walls as thin static physics bodies
int CELL = 48;   // pixel size per cell
int WALL = 4;    // wall thickness

maze.forEach((cell, x, y) -> {
    double wx = x * CELL;
    double wy = y * CELL;

    // Spawn floor for every cell
    spawn("floor", wx, wy);

    // Spawn walls on the edges that exist
    if (cell.hasTopWall())    spawnWall(wx,           wy,            CELL, WALL);
    if (cell.hasLeftWall())   spawnWall(wx,           wy,            WALL, CELL);
    if (cell.hasRightWall())  spawnWall(wx + CELL - WALL, wy,        WALL, CELL);
    if (cell.hasBottomWall()) spawnWall(wx,           wy + CELL - WALL, CELL, WALL);
});

// Helper
private void spawnWall(double x, double y, double w, double h) {
    entityBuilder()
            .at(x, y)
            .view(new Rectangle(w, h, Color.DARKGRAY))
            .bbox(BoundingShape.box(w, h))
            .with(new PhysicsComponent())
            .buildAndAttach();
}
```

## Solve Generated Maze with A*

```java
// Convert maze Grid2D to AStarGrid for pathfinding
AStarGrid astarGrid = new AStarGrid(mazeGen.getWidth(), mazeGen.getHeight());

maze.forEach((cell, x, y) -> {
    // Mark cell NOT_WALKABLE if all sides are walls (isolated — shouldn't happen in perfect maze)
    // Otherwise WALKABLE — corridors are open cells
    astarGrid.getCell(x, y).setState(CellState.WALKABLE);
});

// Walls are encoded in the cell edges, not as grid cells.
// For A* to respect walls, you need to override AStarGrid movement cost between adjacent cells.
// Simpler approach: convert to a 2x scale grid where walls ARE cells:

// --- Alternative: wall-as-cell approach (2× scale) ---
int W2 = mazeGen.getWidth() * 2 + 1;
int H2 = mazeGen.getHeight() * 2 + 1;
AStarGrid bigGrid = new AStarGrid(W2, H2);

// Default all to NOT_WALKABLE (walls)
bigGrid.forEach(cell -> cell.setState(CellState.NOT_WALKABLE));

// Open cell centers and passages
maze.forEach((cell, x, y) -> {
    int bx = x * 2 + 1;
    int by = y * 2 + 1;
    bigGrid.getCell(bx, by).setState(CellState.WALKABLE);   // cell center

    if (!cell.hasRightWall())  bigGrid.getCell(bx + 1, by).setState(CellState.WALKABLE);
    if (!cell.hasBottomWall()) bigGrid.getCell(bx, by + 1).setState(CellState.WALKABLE);
});

// Now find a path through the maze
List<AStarCell> path = bigGrid.getAStarSearch().findPath(1, 1, W2 - 2, H2 - 2);
```

## Dynamic Level Generation on New Level

```java
// In the game class — regenerate each time the player advances
private int currentLevel = 1;

private void loadNextLevel() {
    getGameWorld().getEntitiesCopy().forEach(Entity::removeFromWorld);

    long seed = (long) currentLevel * 7919L;   // deterministic seed from level number

    DungeonConfig config = new DungeonConfig()
            .gridWidth(40 + currentLevel * 2)    // levels get larger
            .gridHeight(40 + currentLevel * 2)
            .minRoomSize(4)
            .maxRoomSize(10 + currentLevel)
            .maxRooms(8 + currentLevel * 2)
            .seed(seed);

    DungeonGenerator gen = new DungeonGenerator(config);
    Grid2D<DungeonCell> dungeon = gen.generate();

    spawnDungeon(dungeon, gen.getRooms());

    currentLevel++;
    set("level", currentLevel);
}
```

## Saving and Restoring Level Seed

```java
@Override
public void writeSaveState(DataFile data) {
    Bundle b = data.getBundle("world");
    b.put("dungeonSeed", currentSeed);
    b.put("level", geti("level"));
}

@Override
public void readSaveState(DataFile data) {
    Bundle b = data.getBundle("world");
    currentSeed = b.get("dungeonSeed");
    int level = b.get("level");
    set("level", level);

    // Rebuild identical dungeon from saved seed
    DungeonConfig config = new DungeonConfig()
            .gridWidth(50).gridHeight(50)
            .minRoomSize(5).maxRoomSize(12)
            .maxRooms(15)
            .seed(currentSeed);

    Grid2D<DungeonCell> dungeon = new DungeonGenerator(config).generate();
    spawnDungeon(dungeon, new DungeonGenerator(config).generate());
    // Note: call generate() again with same seed to get same rooms list
}
```

## Procedural Content Placement (Rooms Pass)

```java
// After spawning dungeon tiles, place items / enemies based on room positions
private void populateDungeon(List<Room> rooms) {
    Random rng = new Random(currentSeed + 1);   // offset seed so placement differs from layout

    for (int i = 1; i < rooms.size() - 1; i++) {   // skip start and boss rooms
        Room room = rooms.get(i);
        int enemies = rng.nextInt(4) + 1;
        for (int e = 0; e < enemies; e++) {
            double ex = (room.getX() + rng.nextInt(room.getWidth()))  * TILE;
            double ey = (room.getY() + rng.nextInt(room.getHeight())) * TILE;
            spawn("enemy", ex, ey);
        }

        if (rng.nextDouble() < 0.4) {
            spawn("chest",
                  room.getCenterX() * TILE,
                  room.getCenterY() * TILE);
        }
    }
}
```

## Gotchas

- **`generator.getRooms()` is valid only after `generate()`** — the rooms list is populated during
  generation. Accessing it before calling `generate()` returns an empty list.
- **Calling `generate()` twice with the same seed produces identical output** but returns two
  separate `Grid2D` and `Room` list instances — equality is structural, not referential.
- **Maze `MazeCell` walls are edge-based, not cell-based** — there are no "wall entities" in
  the grid. Each cell knows which of its four edges has a wall. Rendering requires spawning wall
  geometry at those edges, not at separate wall cells.
- **`DungeonCell.EMPTY` is outside the dungeon boundary** — spawning a tile for `EMPTY` cells
  fills the unused grid area. Usually you want to skip them or spawn a solid background tile.
- **Level-to-level cleanup** — call `getGameWorld().getEntitiesCopy().forEach(Entity::removeFromWorld)`
  before regenerating. Using `clearLevel()` also works but resets the physics world.
- **A* grid and dungeon grid coordinate spaces differ** — the dungeon grid uses tile coordinates
  (cell 0,0 = pixel 0,0). The A* grid also uses cell coordinates. Multiply by `TILE` only when
  spawning entities or computing world positions, not when pathfinding.
- **Large grids are slow to generate** — a 100×100 grid with 30 rooms is fast (<10ms). A 200×200
  grid with 100 rooms can take >500ms. Generate off the main thread if the grid is large.
- **Seeds must be the same JVM version** — `Random(seed)` behavior is JVM-defined and stable
  across Java 17+ minor versions, but is not guaranteed to match other languages or older JVMs.
