---
name: fxgl-tactical-rpg
description: >
  Build a tactical RPG (TRPG) in FXGL — set up a tile grid where each unit occupies one cell,
  implement BFS movement range highlighting that respects terrain move cost, a turn order queue
  sorted by speed, an action point system limiting moves and actions per turn, ranged line-of-sight
  checking for archers, a combat formula (hitChance = ACC - EVA, damage = ATK - DEF),
  an ability system with AoE splash in a radius, and status effects (poison, sleep, haste)
  applied per turn.
  Use this skill when building a Final Fantasy Tactics style TRPG, grid combat game, turn-based
  strategy RPG, or any game with tile-based unit movement and turn-order combat.
  Triggers on: "tactical rpg", "trpg", "grid combat", "turn order", "action points",
  "movement range", "bfs range", "line of sight ranged", "status effect turn", "hex grid combat".
compatibility: Java 17+, FXGL 21.x
metadata:
  author: fxgl-skills
  version: "1.0"
  fxgl-version: "21.1"
  category: fxgl/game-types
allowed-tools: Read Write Edit Bash
---

# FXGL Tactical RPG

## Grid Setup

```java
private static final int COLS = 12, ROWS = 9;
private static final int TILE = 64;

// Terrain move cost: 1 = plains, 2 = forest, 99 = wall/water
private int[][] moveCost = new int[COLS][ROWS];
// Which entity occupies each cell (null = empty)
private Entity[][] occupant = new Entity[COLS][ROWS];
```

## BFS Movement Range

```java
// Returns all reachable cells within maxAP move points
private Set<Point2D> getReachableCells(int startX, int startY, int maxAP) {
    Set<Point2D> visited = new HashSet<>();
    // BFS: queue entry = (gx, gy, apSpent)
    Queue<int[]> queue = new ArrayDeque<>();
    queue.add(new int[]{startX, startY, 0});
    visited.add(new Point2D(startX, startY));

    int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};

    while (!queue.isEmpty()) {
        int[] cur = queue.poll();
        int cx = cur[0], cy = cur[1], spent = cur[2];

        for (int[] d : dirs) {
            int nx = cx + d[0], ny = cy + d[1];
            if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
            int cost = spent + moveCost[nx][ny];
            if (cost > maxAP) continue;
            Point2D key = new Point2D(nx, ny);
            if (visited.contains(key)) continue;
            if (occupant[nx][ny] != null) continue; // blocked by another unit
            visited.add(key);
            queue.add(new int[]{nx, ny, cost});
        }
    }
    return visited;
}

// Highlight reachable tiles blue
private List<Entity> rangeHighlights = new ArrayList<>();

private void showMovementRange(Entity unit) {
    UnitStats stats = unit.getComponent(UnitStatsComponent.class).getStats();
    int gx = (int)(unit.getX() / TILE), gy = (int)(unit.getY() / TILE);

    getReachableCells(gx, gy, stats.moveAP).forEach(cell -> {
        Entity hl = entityBuilder()
                .at(cell.getX() * TILE, cell.getY() * TILE)
                .view(new Rectangle(TILE, TILE, Color.color(0.2, 0.4, 1.0, 0.35)))
                .buildAndAttach();
        rangeHighlights.add(hl);
    });
}

private void clearRangeHighlights() {
    rangeHighlights.forEach(Entity::removeFromWorld);
    rangeHighlights.clear();
}
```

## Turn Order Queue

```java
private Deque<Entity> turnQueue = new ArrayDeque<>();
private Entity activeUnit = null;

private void buildTurnOrder() {
    List<Entity> all = new ArrayList<>(getGameWorld().getEntitiesByType(EntityType.UNIT, EntityType.ENEMY));
    // Sort descending by SPD
    all.sort(Comparator.comparingInt(e -> -e.getComponent(UnitStatsComponent.class).getStats().spd));
    turnQueue.clear();
    turnQueue.addAll(all);
}

private void startNextTurn() {
    if (turnQueue.isEmpty()) buildTurnOrder();

    activeUnit = turnQueue.poll();
    UnitStatsComponent statsComp = activeUnit.getComponent(UnitStatsComponent.class);

    // Apply start-of-turn status effects
    applyStatusEffects(activeUnit);

    // Restore AP
    statsComp.resetAP();

    if (activeUnit.getType() == EntityType.UNIT) {
        enterPlayerTurn();
    } else {
        runEnemyAI(activeUnit, () -> startNextTurn());
    }
}
```

## Action Point System

```java
public class UnitStatsComponent extends Component {
    private final UnitStats base;
    private int currentHP;
    private int currentAP;

    private static final int MAX_AP = 4;  // 2 move + 1 action + 1 wait

    public void resetAP()    { currentAP = MAX_AP; }
    public int  getAP()      { return currentAP; }
    public void spendAP(int n) { currentAP -= n; }
    public boolean canAct()  { return currentAP > 0; }
}

// Move costs 2 AP, attack costs 2 AP, wait ends turn
private void onPlayerClickedTile(int gx, int gy) {
    UnitStatsComponent sc = activeUnit.getComponent(UnitStatsComponent.class);
    if (sc.getAP() < 2) return;  // not enough AP to move

    Set<Point2D> reachable = getReachableCells(
            (int)(activeUnit.getX() / TILE), (int)(activeUnit.getY() / TILE), sc.getAP() / 2 * 2);

    if (reachable.contains(new Point2D(gx, gy))) {
        sc.spendAP(2);
        moveUnitToCell(activeUnit, gx, gy);
    }
}
```

## Combat Formula

```java
private static final Random rng = new Random();

private void resolveAttack(Entity attacker, Entity target) {
    UnitStats atk = attacker.getComponent(UnitStatsComponent.class).getStats();
    UnitStats def = target.getComponent(UnitStatsComponent.class).getStats();

    // Hit check
    int hitChance = Math.max(5, Math.min(95, atk.acc - def.eva + 70));
    if (rng.nextInt(100) >= hitChance) {
        showFloatingText("MISS", target, Color.GRAY);
        return;
    }

    // Damage
    int variance  = rng.nextInt(5) - 2;
    int damage    = Math.max(1, atk.atk - def.def + variance);
    boolean crit  = rng.nextInt(100) < atk.crit;
    if (crit) {
        damage *= 2;
        showFloatingText("CRIT! -" + damage, target, Color.YELLOW);
    } else {
        showFloatingText("-" + damage, target, Color.WHITE);
    }

    target.getComponent(UnitStatsComponent.class).takeDamage(damage);
    if (target.getComponent(UnitStatsComponent.class).isDead()) onUnitDeath(target);
}
```

## Ranged Line of Sight

```java
// Returns true if attacker has clear LOS to target (no blocking terrain in between)
private boolean hasLineOfSight(Entity attacker, Entity target, int range) {
    int ax = (int)(attacker.getX() / TILE), ay = (int)(attacker.getY() / TILE);
    int tx = (int)(target.getX() / TILE),   ty = (int)(target.getY() / TILE);

    int dist = Math.abs(tx - ax) + Math.abs(ty - ay);
    if (dist > range) return false;

    // Bresenham line — check each cell for blocking terrain
    int dx = Integer.signum(tx - ax), dy = Integer.signum(ty - ay);
    int cx = ax, cy = ay;
    while (cx != tx || cy != ty) {
        if (moveCost[cx][cy] >= 99) return false;  // wall blocks LOS
        if (Math.abs(tx - cx) > Math.abs(ty - cy)) cx += dx;
        else cy += dy;
    }
    return true;
}
```

## AoE Splash Ability

```java
private void castAoE(Entity caster, int targetX, int targetY, int splashRadius, int damage) {
    // Collect all cells within splash radius (Manhattan)
    for (int dx = -splashRadius; dx <= splashRadius; dx++) {
        for (int dy = -splashRadius; dy <= splashRadius; dy++) {
            if (Math.abs(dx) + Math.abs(dy) > splashRadius) continue;
            int cx = targetX + dx, cy = targetY + dy;
            if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) continue;
            Entity hit = occupant[cx][cy];
            if (hit != null && hit != caster) {
                hit.getComponent(UnitStatsComponent.class).takeDamage(damage);
                spawnExplosion(cx * TILE, cy * TILE);
            }
        }
    }
}
```

## Status Effects

```java
public enum StatusEffect { POISON, SLEEP, HASTE, SLOW }

public class StatusState {
    public final StatusEffect type;
    public int turnsRemaining;
    public StatusState(StatusEffect type, int turns) { this.type = type; this.turnsRemaining = turns; }
}

private void applyStatusEffects(Entity unit) {
    UnitStatsComponent sc = unit.getComponent(UnitStatsComponent.class);
    List<StatusState> statuses = sc.getStatuses();
    statuses.removeIf(s -> {
        switch (s.type) {
            case POISON -> sc.takeDamage(5);
            case SLEEP  -> sc.setAP(0);          // skip turn
            case HASTE  -> sc.setAPBonus(2);     // extra AP
            case SLOW   -> sc.setAP(sc.getAP() / 2);
        }
        s.turnsRemaining--;
        return s.turnsRemaining <= 0;
    });
}
```

## Gotchas

- **BFS uses move cost, not just distance** — forest tiles cost 2 AP to enter. Units with low AP
  can reach fewer tiles through forests even if geometrically closer than plains alternatives.
- **Occupant grid must be updated on every move** — set `occupant[old] = null` and `occupant[new] = unit`
  atomically. Stale occupant data causes BFS to block valid destination cells.
- **Turn queue rebuilds every round** — call `buildTurnOrder()` each time the queue empties so that
  newly spawned units and killed units are reflected correctly.
- **LOS uses Bresenham, not range alone** — checking only Manhattan distance misses walls between attacker
  and target. Always walk the line cells before granting a ranged attack.
- **SLEEP must set AP to 0, not skip `startNextTurn`** — skipping the turn entirely bypasses
  start-of-turn duration decrement, causing sleep to last forever.
- **AoE splash: exclude caster** — always add `hit != caster` guard, else self-damage on every AoE.
