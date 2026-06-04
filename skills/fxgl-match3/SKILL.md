---
name: fxgl-match3
description: >
  Build a match-3 puzzle game in FXGL — create an NxM grid of gem entities from a 2D array,
  implement adjacent gem swapping with invalid-swap undo, detect horizontal and vertical
  matches of 3 or more same-type gems, clear matched gems with particle effects, apply gravity
  to fill gaps (gems fall down), spawn new gems from above to refill, cascade-loop to find
  new matches after each fall, award combo multipliers for cascades, create special gems from
  4-match and 5-match patterns, and enforce level goals (clear N gems of type X within M moves).
  Use this skill when building a match-3 game, swap-puzzle, Candy Crush-style game, or any
  grid-based pattern matching puzzle.
  Triggers on: "match-3", "match3", "swap gems", "three in a row", "candy crush", "cascade",
  "gem grid", "puzzle grid", "combo multiplier", "special gem", "match puzzle".
compatibility: Java 17+, FXGL 21.x
metadata:
  author: fxgl-skills
  version: "1.0"
  fxgl-version: "21.1"
  category: fxgl/game-types
allowed-tools: Read Write Edit Bash
---

# FXGL Match-3 Puzzle

## Grid Setup

```java
private static final int COLS    = 8;
private static final int ROWS    = 8;
private static final int CELL    = 64;   // pixels per cell
private static final int GEM_TYPES = 5;

private int[][]    grid    = new int[COLS][ROWS];   // gem type (1-5, 0=empty)
private Entity[][] gems    = new Entity[COLS][ROWS];
private boolean    swapping = false;   // lock during animations

@Override
protected void initGame() {
    initGrid();
}

private void initGrid() {
    for (int x = 0; x < COLS; x++) {
        for (int y = 0; y < ROWS; y++) {
            int type;
            // Prevent initial matches (no 3-in-a-row at start)
            do {
                type = FXGLMath.random(1, GEM_TYPES);
            } while (wouldCreateMatch(x, y, type));
            grid[x][y] = type;
            gems[x][y] = spawnGem(x, y, type);
        }
    }
}

private boolean wouldCreateMatch(int x, int y, int type) {
    // Check left 2
    if (x >= 2 && grid[x-1][y] == type && grid[x-2][y] == type) return true;
    // Check up 2
    if (y >= 2 && grid[x][y-1] == type && grid[x][y-2] == type) return true;
    return false;
}

private Entity spawnGem(int cx, int cy, int type) {
    return spawn("gem", new SpawnData(cx * CELL, cy * CELL).put("type", type));
}
```

## Gem Entity Factory

```java
@Spawns("gem")
public Entity newGem(SpawnData data) {
    int type = data.get("type");
    Color[] colors = {null, Color.RED, Color.BLUE, Color.GREEN, Color.YELLOW, Color.PURPLE};

    return entityBuilder(data)
            .type(EntityType.GEM)
            .view(new Circle(CELL / 2 - 4, colors[type]))
            .bbox(BoundingShape.box(CELL, CELL))
            .set("gemType", type)
            .buildAndAttach();
}
```

## Swap Mechanic

```java
private int[] selectedCell = null;

// Mouse click handler:
getInput().addMouseEventHandler(MouseEvent.MOUSE_CLICKED, e -> {
    if (swapping) return;
    int cx = (int)(e.getSceneX() / CELL);
    int cy = (int)(e.getSceneY() / CELL);
    if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return;

    if (selectedCell == null) {
        selectedCell = new int[]{cx, cy};
        highlightGem(cx, cy, true);
    } else {
        int sx = selectedCell[0], sy = selectedCell[1];
        highlightGem(sx, sy, false);
        selectedCell = null;

        // Check adjacent
        if (Math.abs(cx - sx) + Math.abs(cy - sy) == 1) {
            trySwap(sx, sy, cx, cy);
        }
    }
});

private void trySwap(int ax, int ay, int bx, int by) {
    swapping = true;
    doSwap(ax, ay, bx, by);

    // Animate both gems moving to swapped positions
    animateGemMove(gems[bx][by], ax * CELL, ay * CELL, () -> {});
    animateGemMove(gems[ax][ay], bx * CELL, by * CELL, () -> {
        // After animation: check for matches
        List<int[]> matches = findAllMatches();
        if (matches.isEmpty()) {
            // No match — swap back
            doSwap(ax, ay, bx, by);
            animateGemMove(gems[bx][by], ax * CELL, ay * CELL, () -> {});
            animateGemMove(gems[ax][ay], bx * CELL, by * CELL, () -> swapping = false);
        } else {
            dec("movesLeft", 1);
            startCascadeLoop();
        }
    });
}

private void doSwap(int ax, int ay, int bx, int by) {
    int tmpType = grid[ax][ay];
    grid[ax][ay] = grid[bx][by];
    grid[bx][by] = tmpType;

    Entity tmpEnt = gems[ax][ay];
    gems[ax][ay] = gems[bx][by];
    gems[bx][by] = tmpEnt;
}

private void animateGemMove(Entity gem, double tx, double ty, Runnable onDone) {
    animationBuilder()
            .duration(Duration.millis(200))
            .interpolator(Interpolators.SMOOTH.EASE_BOTH())
            .translate(gem)
            .from(new Point2D(gem.getX(), gem.getY()))
            .to(new Point2D(tx, ty))
            .onFinished(onDone)
            .buildAndPlay();
}
```

## Match Detection

```java
private List<int[]> findAllMatches() {
    Set<String> matchedKeys = new HashSet<>();
    List<int[]> matched = new ArrayList<>();

    // Horizontal runs
    for (int y = 0; y < ROWS; y++) {
        for (int x = 0; x < COLS - 2; ) {
            int type = grid[x][y];
            if (type == 0) { x++; continue; }
            int len = 1;
            while (x + len < COLS && grid[x + len][y] == type) len++;
            if (len >= 3) {
                for (int i = x; i < x + len; i++) {
                    if (matchedKeys.add(i + "," + y))
                        matched.add(new int[]{i, y, len});
                }
            }
            x += len;
        }
    }

    // Vertical runs
    for (int x = 0; x < COLS; x++) {
        for (int y = 0; y < ROWS - 2; ) {
            int type = grid[x][y];
            if (type == 0) { y++; continue; }
            int len = 1;
            while (y + len < ROWS && grid[x][y + len] == type) len++;
            if (len >= 3) {
                for (int i = y; i < y + len; i++) {
                    if (matchedKeys.add(x + "," + i))
                        matched.add(new int[]{x, i, 0});  // 0 = vertical match
                }
            }
            y += len;
        }
    }
    return matched;
}
```

## Cascade Loop

```java
private int comboMultiplier = 1;

private void startCascadeLoop() {
    List<int[]> matches = findAllMatches();
    if (matches.isEmpty()) {
        comboMultiplier = 1;
        swapping = false;
        checkGoalCompletion();
        return;
    }

    clearMatches(matches, () -> {
        applyGravity(() -> {
            refillTop(() -> {
                comboMultiplier++;
                startCascadeLoop();   // recurse until no matches
            });
        });
    });
}

private void clearMatches(List<int[]> matches, Runnable onDone) {
    // Count cleared gems per type for goal tracking
    matches.forEach(m -> {
        int cx = m[0], cy = m[1];
        int type = grid[cx][cy];
        if (type == 0) return;

        inc("score", 10 * comboMultiplier);
        trackGoalProgress(type);

        // Particle burst
        spawn("gemBurst", new SpawnData(cx * CELL + CELL/2.0, cy * CELL + CELL/2.0)
                .put("type", type));

        gems[cx][cy].removeFromWorld();
        gems[cx][cy] = null;
        grid[cx][cy] = 0;
    });

    // Wait for burst animations before falling
    runOnce(onDone, Duration.millis(300));
}
```

## Gravity — Gems Fall Down

```java
private void applyGravity(Runnable onDone) {
    int animCount = 0;
    for (int x = 0; x < COLS; x++) {
        for (int y = ROWS - 1; y >= 0; y--) {
            if (grid[x][y] == 0) {
                // Find the gem above to fall down
                for (int sy = y - 1; sy >= 0; sy--) {
                    if (grid[x][sy] != 0) {
                        // Move gem from (x,sy) to (x,y)
                        grid[x][y] = grid[x][sy];
                        gems[x][y] = gems[x][sy];
                        grid[x][sy] = 0;
                        gems[x][sy] = null;

                        animateGemMove(gems[x][y], x * CELL, y * CELL, () -> {});
                        animCount++;
                        break;
                    }
                }
            }
        }
    }
    runOnce(onDone, Duration.millis(animCount > 0 ? 250 : 50));
}
```

## Refill from Top

```java
private void refillTop(Runnable onDone) {
    int newGems = 0;
    for (int x = 0; x < COLS; x++) {
        for (int y = 0; y < ROWS; y++) {
            if (grid[x][y] == 0) {
                int type = FXGLMath.random(1, GEM_TYPES);
                grid[x][y] = type;
                Entity gem = spawnGem(x, -1, type);  // spawn above screen
                gems[x][y] = gem;
                animateGemMove(gem, x * CELL, y * CELL, () -> {});
                newGems++;
            }
        }
    }
    runOnce(onDone, Duration.millis(newGems > 0 ? 350 : 50));
}
```

## Score and Goal

```java
@Override
protected void initGameVars(Map<String, Object> vars) {
    vars.put("score",      0);
    vars.put("movesLeft",  20);
    vars.put("goalRed",    10);     // clear 10 red gems
    vars.put("goalBlue",   8);      // clear 8 blue gems
    vars.put("clearedRed", 0);
    vars.put("clearedBlue", 0);
}

private void trackGoalProgress(int gemType) {
    if (gemType == 1) inc("clearedRed",  1);
    if (gemType == 2) inc("clearedBlue", 1);
}

private void checkGoalCompletion() {
    boolean goalsComplete = geti("clearedRed")  >= geti("goalRed")
                         && geti("clearedBlue") >= geti("goalBlue");
    if (goalsComplete) showVictory();
    else if (geti("movesLeft") <= 0) showDefeat();
}
```

## Gotchas

- **Prevent initial matches in `initGrid`** — check the 2 cells to the left and 2 above before
  placing a gem. Without this, cascades fire immediately on game start, confusing players.
- **`swapping = true` blocks input during all animations** — the cascade loop is asynchronous
  (using `runOnce`). Without the lock, rapid clicks corrupt the grid state.
- **`new ArrayList<>()` before modifying matched cells** — the match list may contain the same
  cell twice (both horizontal AND vertical match). Use a `Set<String>` keyed by "x,y" to deduplicate.
- **Grid coordinates vs pixel coordinates** — `grid[x][y]` and `gems[x][y]` use grid indices.
  Entity positions use `x * CELL` and `y * CELL`. Never confuse them.
- **`refillTop` spawns gems at y=-1** — spawn above the screen and animate falling down. Without
  this animation, gems just appear, which looks abrupt.
- **Cascade loop termination** — the loop terminates when `findAllMatches()` returns empty.
  If the refill creates a new match, the cascade continues naturally with `comboMultiplier++`.
- **Move counter vs time limit** — `movesLeft` decrements only on successful swaps (ones that
  produce matches). Failed swaps (swapped back) should NOT decrement the counter.
