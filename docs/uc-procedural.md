# Use Cases — Procedural Generation

Covers dungeon generation, maze generation, map generation, and procedural level assembly.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-PROC-1\nGenerate random dungeon room layout"]
    Dev --> UC2["UC-PROC-2\nGenerate perfect maze (all cells connected)"]
    Dev --> UC3["UC-PROC-3\nGenerate map with rivers / roads"]
    Dev --> UC4["UC-PROC-4\nConvert generated grid to game entities"]
    Dev --> UC5["UC-PROC-5\nSeed generation for reproducible levels"]
    Dev --> UC6["UC-PROC-6\nMark special rooms (boss, treasure, start)"]
    Dev --> UC7["UC-PROC-7\nCarve corridors between dungeon rooms"]
    Dev --> UC8["UC-PROC-8\nSolve generated maze with A*"]
```

## Dungeon Generation Flow

```mermaid
flowchart TD
    Config2["DungeonConfig\n• gridWidth / gridHeight\n• minRoomSize / maxRoomSize\n• maxRooms\n• random seed (optional)"] --> Generator["DungeonGenerator.generate(config)"]
    Generator --> DungeonGrid["Grid2D<DungeonCell>"]
    DungeonGrid --> Cells["DungeonCell types:\n• FLOOR\n• WALL\n• CORRIDOR\n• DOOR\n• BOSS_ROOM\n• TREASURE_ROOM\n• EMPTY (outside dungeon)"]
    Cells --> Render4["iterate cells\nspawn corresponding entities\nvia EntityFactory"]
```

## Dungeon Generation State Machine

```mermaid
stateDiagram-v2
    [*] --> PlacingRooms : start generation
    PlacingRooms --> PlacingRooms : try add random room
    PlacingRooms --> CarveCorridors : maxRooms reached or space full
    CarveCorridors --> AddDoors : corridors complete
    AddDoors --> MarkSpecial : doors placed
    MarkSpecial --> Done : first room = start, last = boss
    Done --> [*]
```

## Maze Generation Flow

```mermaid
flowchart TD
    MazeGen["MazeGenerator(cols, rows)"] --> Generate2["generate()\nRecursive Backtracker DFS"]
    Generate2 --> MazeGrid["Grid2D<MazeCell>"]
    MazeGrid --> Walls2["MazeCell\n• hasTopWall: boolean\n• hasRightWall: boolean\n• hasBottomWall: boolean\n• hasLeftWall: boolean"]
    Walls2 --> Render5["render walls as thin physics STATIC entities\nor tile-based textures"]
```

## Map Generation (Terrain-style)

```mermaid
flowchart TD
    MapGen["MapGenerator (fxgl-core procedural package)"] --> Noise["Perlin/simplex noise layer"]
    Noise --> Threshold["apply thresholds:\n• noise < 0.3 → water\n• noise 0.3-0.6 → grass\n• noise 0.6-0.8 → forest\n• noise > 0.8 → mountain"]
    Threshold --> Grid3["Grid2D<MapCell> with biome data"]
    Grid3 --> Spawn3["spawn tile entities per cell type"]
```

## Grid-to-Entity Conversion Pattern

```mermaid
flowchart LR
    Grid4["Grid2D<T>"] --> Iterate["grid.forEach((cell, x, y) -> {\n  if(cell.isWall())\n    spawn('wall', x * tileSize, y * tileSize);\n  else if(cell.isFloor())\n    spawn('floor', x * tileSize, y * tileSize);\n})"]
    Iterate --> Entities2["entities created at pixel positions\nbased on tile size"]
```

## Reproducible Generation with Seed

```mermaid
flowchart LR
    Seed["long seed = 12345L"] --> RNG["FXGLMath.getRandom()\nor new Random(seed)"]
    RNG --> Config3["pass to DungeonConfig / MazeGenerator"]
    Config3 --> Same["same seed → same dungeon every time\n(share level codes with players)"]
```

## A* on Generated Maze

```mermaid
flowchart TD
    Maze["Generated Maze Grid"] --> AStarGrid2["convert to AStarGrid:\n• WALL cells → NOT_WALKABLE\n• FLOOR cells → WALKABLE"]
    AStarGrid2 --> Pathfind["AStarPathfinder.findPath(\n  startX, startY, endX, endY, grid\n)"]
    Pathfind --> Solution["List<AStarCell> — solution path\nor null if no path exists"]
```

## Special Room Placement

```mermaid
graph TD
    Rooms["Room list after generation"] --> Start5["rooms[0] → START room\n(player spawn point)"]
    Rooms --> Boss2["rooms[last] → BOSS room\n(furthest from start)"]
    Rooms --> Treasure["random middle rooms\n→ TREASURE rooms\n(marked by DungeonGenerator)"]
    Rooms --> Connectivity["all rooms connected\nvia corridors (guaranteed)"]
```
