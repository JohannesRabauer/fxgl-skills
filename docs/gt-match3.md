# Game Type — Match-3 / Puzzle Grid

Covers Candy Crush-style grid games. Swap gems, detect 3-in-a-row, cascade after clear, special gems from 4+ matches, score multipliers.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-M3-1\nGrid of gem entities (NxM)"]
    Dev --> UC2["UC-M3-2\nSwap two adjacent gems"]
    Dev --> UC3["UC-M3-3\nDetect horizontal/vertical matches (≥3)"]
    Dev --> UC4["UC-M3-4\nClear matched gems with particle burst"]
    Dev --> UC5["UC-M3-5\nGravity: gems fall to fill gaps"]
    Dev --> UC6["UC-M3-6\nNew gems fall from top to refill"]
    Dev --> UC7["UC-M3-7\nCascade: check for new matches after fall"]
    Dev --> UC8["UC-M3-8\nSpecial gems (4-match, 5-match, L-shape)"]
    Dev --> UC9["UC-M3-9\nScore with combo multiplier"]
    Dev --> UC10["UC-M3-10\nLevel goal (clear N of type X before moves run out)"]
```

## Grid Data Structure

```mermaid
flowchart TD
    GridArray["GemType[][] grid\nEntity[][] gemEntities\n(parallel arrays)"] --> Init["for x in 0..cols, y in 0..rows:\n  type = randomType() while would-match\n  gem = spawn('gem_' + type, x*CELL, y*CELL)\n  grid[x][y] = type\n  gemEntities[x][y] = gem"]
```

## Swap Logic

```mermaid
flowchart LR
    Click1["player clicks gem A"] --> Select["highlight A"]
    Select --> Click2["player clicks gem B"]
    Click2 --> Adjacent["abs(ax-bx) + abs(ay-by) == 1"]
    Adjacent --> |yes| DoSwap["swap grid[a] and grid[b]\nanimate entities sliding"]
    DoSwap --> CheckMatch["check matches at A and B positions"]
    CheckMatch --> |no match| UndoSwap["swap back (invalid move)"]
    CheckMatch --> |match found| ClearMatches["proceed to clear phase"]
```

## Match Detection

```mermaid
flowchart TD
    CheckAll["scan all cells"] --> HorizRuns["find runs of 3+ same type in each row"]
    CheckAll --> VertRuns["find runs of 3+ same type in each column"]
    HorizRuns --> UnionMatches["combine into Set of matched cells\n(avoid double-counting T/L shapes)"]
    VertRuns --> UnionMatches
    UnionMatches --> MatchLength["4 match → spawn striped gem\n5 match → spawn bomb gem\nL/T shape → spawn color bomb"]
```

## Cascade Loop

```mermaid
flowchart TD
    ClearPhase["clear matched gems\nspawn particle burst per gem"] --> FallPhase["for each column:\n  shift remaining gems down to fill gaps\n  animate falling"]
    FallPhase --> RefillPhase["spawn new gems from above screen\nanimate falling into place"]
    RefillPhase --> DetectMatches2["scan grid for new matches"]
    DetectMatches2 --> |matches found| ClearPhase
    DetectMatches2 --> |no matches| UpdateScore["add points × comboMultiplier\ncomboMultiplier++\nreset on no cascade"]
    UpdateScore --> CheckGoal["check level goal completion"]
```

## Level Goal Types

```mermaid
graph TD
    Goals["Level Goal Types"] --> ClearGoal["Clear N gems of type X"]
    Goals --> ScoreGoal["Reach target score"]
    Goals --> MoveLimit["Within M moves"]
    Goals --> TimeLimit["Within T seconds"]
    Goals --> BreakBlocks["Break all blocker tiles\n(immovable tiles below gems)"]
    Goals --> OrderGoal["collect specific gem types in order"]
```
