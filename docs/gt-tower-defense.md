# Game Type — Tower Defense

Covers games where enemies follow a fixed path and the player places defensive towers along the path to stop them.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-TD2-1\nFixed path enemies follow via waypoints"]
    Dev --> UC2["UC-TD2-2\nGrid-based tower placement"]
    Dev --> UC3["UC-TD2-3\nTower targets nearest enemy in range"]
    Dev --> UC4["UC-TD2-4\nTower fires projectile at target"]
    Dev --> UC5["UC-TD2-5\nWave-based enemy spawning"]
    Dev --> UC6["UC-TD2-6\nEconomy: kill enemies to earn gold"]
    Dev --> UC7["UC-TD2-7\nEnemy reaches end: lose lives"]
    Dev --> UC8["UC-TD2-8\nSell and upgrade towers"]
    Dev --> UC9["UC-TD2-9\nSlow / splash / chain tower types"]
    Dev --> UC10["UC-TD2-10\nPreview tower range circle on hover"]
```

## Enemy Path System

```mermaid
flowchart TD
    WaypointList["List of Point2D waypoints\ndefined in Tiled map or code"] --> EnemySpawn["enemy entity:\nWaypointMoveComponent(waypoints)\nspeed = baseSpeed * waveSpeedMultiplier"]
    EnemySpawn --> ReachEnd["WaypointMoveComponent.setOnLastWaypointReached\n→ enemy.removeFromWorld()\n   dec('lives', 1)"]
```

## Tower Placement Grid

```mermaid
flowchart LR
    Grid["boolean[][] occupiedGrid\n(initialized from path cells = true)"] --> MouseClick["player clicks world position"]
    MouseClick --> SnapToGrid["cell = (clickX / TILE, clickY / TILE)"]
    SnapToGrid --> CheckOccupied["if !occupied[cx][cy] and gold >= cost"]
    CheckOccupied --> PlaceTower["spawn tower entity at cell center\noccupied[cx][cy] = true\ndec('gold', cost)"]
```

## Tower Targeting

```mermaid
flowchart TD
    TowerUpdate["tower.onUpdate(tpf)"] --> FindEnemies["getGameWorld().getEntitiesByType(ENEMY)\n.filter(e -> distance(tower, e) <= tower.range)"]
    FindEnemies --> SelectTarget["min by progressAlongPath\n(target furthest-progressed enemy)"]
    SelectTarget --> FireTimer["fireTimer += tpf\nif fireTimer >= fireInterval:"]
    FireTimer --> SpawnProjectile["spawn projectile\ntargeting enemy.getPosition()"]
```

## Wave System

```mermaid
stateDiagram-v2
    [*] --> Preparation : game start
    Preparation --> Spawning : player clicks Start Wave
    Spawning --> Active : all enemies spawned
    Active --> Preparation : all enemies defeated or reached end
    Preparation --> Victory : wavesRemaining = 0 and enemies = 0
    Active --> Defeat : lives = 0
```

## Tower Types Pattern

```mermaid
graph TD
    TowerType["Tower types"] --> Basic["BasicTower\n• single target\n• medium damage\n• medium fire rate"]
    TowerType --> Slow["SlowTower\n• applies SlowEffect on hit\n• no damage\n• AOE range"]
    TowerType --> Splash["SplashTower\n• damages all enemies\n  within explosion radius\n• slow fire rate"]
    TowerType --> Chain["ChainTower\n• hits 1 enemy\n• chains to N nearest\n• each chain: half damage"]
```
