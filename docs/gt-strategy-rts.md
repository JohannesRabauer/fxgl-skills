# Game Type — Real-Time Strategy (RTS)

Covers games where the player manages units and resources in real time. Unit selection, movement commands, resource gathering, base building.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-RTS-1\nRectangle-drag select multiple units"]
    Dev --> UC2["UC-RTS-2\nRight-click command selected units to move"]
    Dev --> UC3["UC-RTS-3\nUnit pathfinding (A*) to command target"]
    Dev --> UC4["UC-RTS-4\nResource nodes and gathering units"]
    Dev --> UC5["UC-RTS-5\nBase building on grid"]
    Dev --> UC6["UC-RTS-6\nFog of war (unexplored areas hidden)"]
    Dev --> UC7["UC-RTS-7\nUnit production from buildings"]
    Dev --> UC8["UC-RTS-8\nMinimap with all unit positions"]
    Dev --> UC9["UC-RTS-9\nUnit attack-move toward enemies"]
    Dev --> UC10["UC-RTS-10\nFormation movement"]
```

## Unit Selection

```mermaid
flowchart TD
    MouseDrag["LEFT MOUSE drag"] --> DrawRect["draw rubber-band selection rectangle\n(UI overlay)"]
    DrawRect --> Release["mouse released"] --> FindUnits["getGameWorld().getEntitiesByType(UNIT)\n.filter(e -> selectionRect.contains(e.getPosition()))"]
    FindUnits --> MarkSelected["unit.set('selected', true)\nshow selection ring under unit"]
    SingleClick["LEFT CLICK on unit"] --> SelectOne["deselect all, select clicked unit"]
```

## Move Command

```mermaid
flowchart LR
    RightClick["RIGHT CLICK on ground"] --> GetWorldPos["convert screen to world coordinates"]
    GetWorldPos --> ForEachSelected["selectedUnits.forEach(unit ->"]
    ForEachSelected --> Pathfind["unit.getComponent(AStarMoveComponent.class)\n  .moveTo(targetWorldPos)"]
    Pathfind --> Formation["offset target per unit\nto avoid exact overlap"]
```

## Resource Gathering Loop

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> MovingToResource : assigned to resource node
    MovingToResource --> Harvesting : arrived at node
    Harvesting --> MovingToBase : carry capacity full or node depleted
    MovingToBase --> Depositing : arrived at base
    Depositing --> MovingToResource : deposit complete, node still exists
    Depositing --> Idle : node depleted
```

## Fog of War

```mermaid
flowchart TD
    FogOverlay["dark rectangle overlay\n(covers entire map)"] --> UnitVision["for each friendly unit:\n  reveal circle around unit\n  radius = visionRange"]
    UnitVision --> ClipFog["clip fog overlay\nusing union of vision circles"]
    ClipFog --> EnemyVisibility["enemy entities:\n  setVisible(false) if in fog\n  setVisible(true) if in any vision circle"]
```

## Building Placement

```mermaid
flowchart LR
    SelectBuilding["player selects building type"] --> GhostMode["show ghost building\nfollowing mouse (red if invalid, green if valid)"]
    GhostMode --> ValidCheck["cell not occupied\ncells reachable by units\nsufficient resources"]
    ValidCheck --> |click| PlaceBuilding["spawn building entity\nmark cells as occupied\ndeduct resource cost"]
```
