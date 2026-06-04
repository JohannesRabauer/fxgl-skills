# Use Cases — AI: Pathfinding, GOAP & Sense AI

Covers A* pathfinding, DFS pathfinding, dungeon/maze generation, Goal-Oriented Action Planning,
and sense-based AI.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])
    NPC2([NPC / Enemy])

    Dev --> UC1["UC-AI-1\nSet up A* grid for level"]
    Dev --> UC2["UC-AI-2\nFind path from A to B (A* algorithm)"]
    Dev --> UC3["UC-AI-3\nMake entity follow A* path to player"]
    Dev --> UC4["UC-AI-4\nRandom A* wandering behaviour"]
    Dev --> UC5["UC-AI-5\nDFS pathfinding (simpler/faster for mazes)"]
    Dev --> UC6["UC-AI-6\nGenerate dungeon layout"]
    Dev --> UC7["UC-AI-7\nGenerate maze layout"]
    Dev --> UC8["UC-AI-8\nDefine GOAP world state"]
    Dev --> UC9["UC-AI-9\nDefine GOAP actions with preconditions"]
    Dev --> UC10["UC-AI-10\nRun GOAP planner to achieve goal"]
    Dev --> UC11["UC-AI-11\nSense AI: detect player in range"]
    Dev --> UC12["UC-AI-12\nSense AI: line-of-sight check"]
    Dev --> UC13["UC-AI-13\nWaypoint-based patrol route"]

    NPC2 --> UC3
    NPC2 --> UC4
    NPC2 --> UC10
    NPC2 --> UC11
```

## A* Pathfinding Setup

```mermaid
flowchart TD
    Grid["AStarGrid.fromWorld(gameWorld, cellWidth, cellHeight)"] --> Mark["AStarGrid.getDataGrid()\n.setData(x, y, CellState.NOT_WALKABLE)\n(mark walls/obstacles)"]
    Mark --> Find["AStarPathfinder.findPath(startX, startY, endX, endY, grid)"]
    Find --> Path2["List<AStarCell> path"]
    Path2 --> Move2["entity moves along path\none cell per frame or tween"]
```

## AStarMoveComponent Usage

```mermaid
flowchart LR
    Entity2["enemy entity"] --> AStar["with(new AStarMoveComponent(grid))"]
    AStar --> MoveTo["getComponent(AStarMoveComponent.class)\n.moveToCell(targetX, targetY)"]
    MoveTo --> Auto2["component handles path-following automatically each update"]
```

## Random A* Wandering

```mermaid
flowchart TD
    Entity3["enemy entity"] --> RAMC["with(new RandomAStarMoveComponent(grid))"]
    RAMC --> Auto3["entity wanders to random reachable cells\nautomatically, no explicit path calls needed"]
```

## GOAP Architecture

```mermaid
graph TD
    GOAP["GOAP Planner"] --> WorldState["WorldState\n(Map of String → Boolean)\n'hasAmmo': true\n'enemyDead': false"]
    GOAP --> Goal["Goal WorldState\n'enemyDead': true"]
    GOAP --> Actions["List of GoapAction\neach has:\n• preconditions: Map\n• effects: Map\n• cost: float\n• perform(): execute action"]
    GOAP --> Plan["GoapPlanner.plan(agent, actions, worldState, goal)\n→ Queue<GoapAction> or null if no plan"]
    Plan --> Execute["execute each action in sequence\ncheck preconditions each step"]
```

## GOAP Action Example

```mermaid
flowchart TD
    Action["class AttackAction extends GoapAction"] --> Pre["preconditions:\n'hasAmmo': true\n'inRange': true"]
    Action --> Eff["effects:\n'enemyDead': true\n'hasAmmo': false"]
    Action --> Cost2["cost: 1.0"]
    Action --> Perf["perform(entity, target) → boolean\n• call attack()\n• return true when done"]
```

## GOAP Finite State Machine (FSM) Integration

```mermaid
stateDiagram-v2
    [*] --> Idle2 : agent spawned
    Idle2 --> Planning : new goal set
    Planning --> Acting : plan found
    Acting --> Planning : action complete / replan
    Planning --> Idle2 : no plan found
    Acting --> Idle2 : goal achieved
```

## Sense AI Use Case

```mermaid
graph TD
    Sense["SenseAI"] --> Vision["VisionSensor\n• range radius\n• angle of view\n• detects entities in cone"]
    Sense --> Hearing["HearingSensor\n• range radius\n• detects noise events"]
    Sense --> Memory["SenseMemory\n• remember last seen position\n• forget after timeout"]
    Vision --> Trigger3["onEntityEntered(entity → alert state)"]
    Vision --> Trigger4["onEntityLeft(entity → patrol state)"]
```

## Waypoint Patrol Use Case

```mermaid
flowchart LR
    WMP["WaypointMoveComponent"] --> Points["setWaypoints(List<Point2D>)\nor addWaypoint(x, y)"]
    Points --> Loop2["setLooping(true) — patrol loop"]
    Points --> Auto4["entity walks waypoint to waypoint automatically"]
    WMP --> Speed2["setSpeed(pixelsPerSecond)"]
```

## Dungeon Generation Use Case

```mermaid
flowchart TD
    DG2["DungeonGenerator"] --> Config["DungeonConfig\n• gridWidth / gridHeight\n• minRoomSize / maxRoomSize\n• maxRooms"]
    Config --> Gen["DungeonGenerator.generate(config)\n→ Grid2D<DungeonCell>"]
    Gen --> Render2["iterate cells\n• FLOOR → spawn floor tile\n• WALL → spawn wall entity\n• DOOR → spawn door\n• BOSS_ROOM → mark special"]
```

## Maze Generation Use Case

```mermaid
flowchart TD
    MG["MazeGenerator (Recursive Backtracker)"] --> Grid2["new MazeGenerator(width, height)"]
    Grid2 --> GenMaze["generate() → Grid2D<MazeCell>"]
    GenMaze --> Walls["MazeCell.hasTopWall / hasRightWall etc."]
    Walls --> Render3["render walls as physics STATIC entities"]
    GenMaze --> Solve["AStarPathfinder can solve maze immediately"]
```
