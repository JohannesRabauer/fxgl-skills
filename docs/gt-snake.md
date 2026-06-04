# Game Type — Snake

Covers classic Snake and modern variants. Grid-based discrete movement, snake grows on food, self-collision, wall collision, direction queueing.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-SNAKE-1\nGrid-based discrete movement (timer step)"]
    Dev --> UC2["UC-SNAKE-2\nSnake body: deque of grid positions"]
    Dev --> UC3["UC-SNAKE-3\nGrow on food: don't remove tail for one step"]
    Dev --> UC4["UC-SNAKE-4\nBuffer direction input (no 180° reversal)"]
    Dev --> UC5["UC-SNAKE-5\nSelf-collision detection (head hits body)"]
    Dev --> UC6["UC-SNAKE-6\nWall collision (wrap-around or death)"]
    Dev --> UC7["UC-SNAKE-7\nFood spawns on random empty cell"]
    Dev --> UC8["UC-SNAKE-8\nScore: length × level multiplier"]
    Dev --> UC9["UC-SNAKE-9\nSpeed increases as snake grows"]
    Dev --> UC10["UC-SNAKE-10\nMultiple food types (speed boost, bonus points)"]
```

## Grid and Data Structures

```mermaid
flowchart TD
    Grid["int COLS = 20, ROWS = 20\nint CELL = 32px"] --> SnakeBody["Deque<Point> body\nhead = body.peekFirst()\ntail = body.peekLast()"]
    SnakeBody --> EntityGrid["Entity[] bodyEntities\n(parallel entity array for rendering)"]
    FoodPos["Point foodPosition"] --> FoodEntity["single food entity\nat foodPosition * CELL"]
```

## Step Logic

```mermaid
flowchart LR
    StepTimer["timer fires\nevery stepInterval seconds"] --> ConsumeDir["direction = directionQueue.poll()\n(apply buffered input)"]
    ConsumeDir --> CalcNewHead["newHead = head + direction"]
    CalcNewHead --> CheckWall["if newHead outside grid:\n  gameOver() OR wrap around"]
    CheckWall --> CheckSelf["if body.contains(newHead): gameOver()"]
    CheckSelf --> CheckFood["if newHead == foodPosition: grow = true"]
    CheckFood --> MoveBody["body.addFirst(newHead)\nif grow: grow=false (tail stays)\nelse: body.removeLast()"]
    MoveBody --> UpdateEntities["update entity positions\nto match body positions"]
```

## Direction Buffer

```mermaid
flowchart LR
    KeyPress2["player presses arrow key"] --> NewDir["newDirection = keyToDirection(key)"]
    NewDir --> OppositeCheck["if newDirection != opposite(currentDirection):\n  directionQueue.offer(newDirection)"]
    OppositeCheck --> |queue size <= 2| AddToQueue["allows 2 pre-queued turns\nfor tight maneuvering"]
```

## Food Placement

```mermaid
flowchart TD
    FoodEaten["head lands on food"] --> CollectFood["score += foodValue\ngrow = true\nplay eat sound"]
    CollectFood --> SpawnNewFood["pick random Point:\n  x = random(0, COLS)\n  y = random(0, ROWS)\n  while body.contains(point): retry"]
    SpawnNewFood --> MoveFoodEntity["move food entity to new position"]
```

## Speed Scaling

```mermaid
flowchart LR
    SnakeLength["snake body length"] --> StepInterval["stepInterval = max(0.05,\n  baseInterval - (length - 3) × 0.01)"]
    StepInterval --> UpdateTimer["cancel and re-schedule step timer\nwith new interval"]
```

## Wrap vs Wall Death

```mermaid
graph TD
    WallCollision["head leaves grid boundary"] --> WrapMode["WRAP MODE:\n  x = (x + COLS) % COLS\n  y = (y + ROWS) % ROWS"]
    WallCollision --> WallDeathMode["WALL DEATH MODE:\n  gameOver()"]
```
