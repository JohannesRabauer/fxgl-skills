# Game Type — Endless Runner

Covers auto-scrolling games (Temple Run 2D, Jetpack Joyride style). Camera moves automatically, player reacts to procedurally generated obstacles, difficulty scales with distance.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-ER-1\nCamera auto-scrolls at increasing speed"]
    Dev --> UC2["UC-ER-2\nPlayer jumps over ground obstacles"]
    Dev --> UC3["UC-ER-3\nPlayer ducks under aerial obstacles"]
    Dev --> UC4["UC-ER-4\nProcedural obstacle generation off right edge"]
    Dev --> UC5["UC-ER-5\nDespawn obstacles past left edge"]
    Dev --> UC6["UC-ER-6\nDistance-based score"]
    Dev --> UC7["UC-ER-7\nCollectable coins on path"]
    Dev --> UC8["UC-ER-8\nDifficulty: obstacle density + speed increases"]
    Dev --> UC9["UC-ER-9\nPower-up: invincibility / magnet / double score"]
    Dev --> UC10["UC-ER-10\nHigh score persistence"]
```

## Auto-Scroll Architecture

```mermaid
flowchart TD
    WorldScroll["camera.getViewport().setX(scrollX)"] --> ScrollUpdate["scrollX += scrollSpeed * tpf"]
    ScrollUpdate --> SpeedIncrease["scrollSpeed = baseSpeed + distance / 1000 * acceleration"]
    SpeedIncrease --> SpawnTrigger["if (scrollX + appWidth + spawnAhead) > lastSpawnX:\n  spawnNextSegment()"]
```

## Ground and Player

```mermaid
flowchart LR
    Ground["STATIC ground entity\nstretches across viewport"] --> PlayerPhysics["DYNAMIC player\ngravity enabled\nfixed X position at 200px\n(only moves vertically)"]
    PlayerPhysics --> Jump["SPACE: if grounded\n  setLinearVelocityY(-jumpForce)"]
    PlayerPhysics --> Crouch["DOWN: reduce hitbox height\nsprite plays crouch anim"]
```

## Procedural Generation

```mermaid
flowchart TD
    SpawnSegment["spawnNextSegment()"] --> PickPattern["pick random pattern from weighted list:\n• gap jump\n• low ceiling\n• triple obstacle\n• coin run\n• power-up platform"]
    PickPattern --> PlaceEntities["place obstacle/coin entities\nat scrollX + appWidth + margin"]
    PlaceEntities --> UpdateLastSpawn["lastSpawnX = rightmost entity X"]
```

## Obstacle Despawning

```mermaid
flowchart LR
    EachFrame["each frame"] --> CheckEntities["for each obstacle/coin entity:\n  if entity.getX() < camera.getViewport().getX() - margin:"]
    CheckEntities --> Remove["entity.removeFromWorld()"]
```

## Difficulty Curve

```mermaid
flowchart TD
    DistanceMilestone["every 500m distance"] --> IncreaseSpeed["scrollSpeed += 20"]
    DistanceMilestone --> IncreaseObstacleDensity["spawnAhead += 100 (obstacles closer together)"]
    DistanceMilestone --> AddNewObstacleType["unlock new obstacle type\n(flying enemy, moving platform, etc.)"]
    DistanceMilestone --> PlayMilestoneEffect["screen flash + sound cue"]
```

## Power-Up System

```mermaid
graph TD
    Powerup["Power-up types"] --> Invincibility["SHIELD\n• 5 seconds\n• ignore obstacle collisions"]
    Powerup --> Magnet["MAGNET\n• 8 seconds\n• nearby coins fly to player"]
    Powerup --> DoubleScore["x2 SCORE\n• 10 seconds\n• all points doubled"]
    Powerup --> Jetpack["JETPACK\n• fly above obstacles for 6 seconds"]
```
