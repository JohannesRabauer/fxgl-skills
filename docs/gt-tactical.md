# Game Type — Turn-Based Tactical (Tactics RPG)

Covers grid-based turn-order games like Fire Emblem, XCOM, Chess. Units act on a grid, spend action points, combat is resolved via formulas.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-TAC-1\nGrid-based unit movement with range highlight"]
    Dev --> UC2["UC-TAC-2\nTurn order queue (SPD-based initiative)"]
    Dev --> UC3["UC-TAC-3\nAction points (AP) per turn"]
    Dev --> UC4["UC-TAC-4\nAbility target selection with valid cell highlight"]
    Dev --> UC5["UC-TAC-5\nCombat formula (ATK vs DEF, RNG hit chance)"]
    Dev --> UC6["UC-TAC-6\nLine of sight for ranged attacks"]
    Dev --> UC7["UC-TAC-7\nStatus effects (poison, stun, burning)"]
    Dev --> UC8["UC-TAC-8\nFlanking / height advantage bonuses"]
    Dev --> UC9["UC-TAC-9\nEnd turn and pass initiative to next unit"]
    Dev --> UC10["UC-TAC-10\nVictory/defeat condition check"]
```

## Turn Order State Machine

```mermaid
stateDiagram-v2
    [*] --> BuildInitiative : battle start
    BuildInitiative --> ActiveTurn : next unit in queue
    ActiveTurn --> WaitingInput : it is a player unit
    ActiveTurn --> AIDecision : it is an enemy unit
    WaitingInput --> ExecutingAction : player selects action + target
    AIDecision --> ExecutingAction : AI picks action
    ExecutingAction --> CheckEndCondition : action resolves
    CheckEndCondition --> ActiveTurn : battle continues
    CheckEndCondition --> Victory : all enemies defeated
    CheckEndCondition --> Defeat : all player units defeated
```

## Movement Range Highlight

```mermaid
flowchart TD
    SelectUnit["player clicks unit"] --> BFS["BFS from unit's grid cell\nup to AP / moveCost steps"]
    BFS --> HighlightCells["highlight reachable cells\n(blue overlay per cell)"]
    HighlightCells --> PlayerClick["player clicks highlighted cell"]
    PlayerClick --> MoveUnit["tween unit from current to target cell\ndec(AP, moveCost)"]
```

## Combat Resolution

```mermaid
flowchart LR
    Attack["attacker uses ATTACK action"] --> HitRoll["hitChance = attackerACC - defenderEVA\nroll = random(0..100)"]
    HitRoll --> |roll <= hitChance| HitCalc["damage = ATK - DEF (min 1)"]
    HitRoll --> |roll > hitChance| Miss["Miss! — no damage"]
    HitCalc --> CritCheck["critChance = attackerSKL / 2\ncrit → damage × 2"]
    CritCheck --> ApplyDamage["target.getComponent(HPComponent.class).damage(dmg)"]
```

## Grid Coordinate System

```mermaid
flowchart LR
    TiledMap["Tiled .tmx map\nwith tile size = 48px"] --> GridCoords["grid (cx, cy) = (pixel.x / 48, pixel.y / 48)"]
    GridCoords --> UnitData["unit stores gridX, gridY\n(not pixel position)"]
    UnitData --> SnapToCell["entity.setPosition(\n  gridX * 48 + 24,  // centered\n  gridY * 48 + 24\n)"]
```
