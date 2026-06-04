---
name: fxgl-strategy-rts
description: >
  Build a real-time strategy game in FXGL — implement rectangle-drag unit selection with a
  rubber-band box overlay, right-click move commands routed to AStarMoveComponent per unit,
  group formation offsets to prevent unit overlap, a resource harvesting state machine
  (idle → gather → deposit), building placement with a ghost preview that turns red/green
  based on cell availability, a fog-of-war dark overlay clipped by unit vision circles,
  and a minimap that mirrors world entity positions.
  Use this skill when building a Command & Conquer style RTS, base-builder, resource
  manager, or any game with multi-unit selection and command-and-control mechanics.
  Triggers on: "rts", "real-time strategy", "unit selection", "right-click move", "fog of war",
  "resource gather", "building placement", "minimap", "formation", "base builder".
compatibility: Java 17+, FXGL 21.x
metadata:
  author: fxgl-skills
  version: "1.0"
  fxgl-version: "21.1"
  category: fxgl/game-types
allowed-tools: Read Write Edit Bash
---

# FXGL Real-Time Strategy

## Unit Selection — Rubber-Band Box

```java
private Point2D dragStart = null;
private Rectangle selectionBox = new Rectangle();

@Override
protected void initInput() {
    selectionBox.setFill(Color.color(0.3, 0.7, 1.0, 0.15));
    selectionBox.setStroke(Color.CYAN);
    selectionBox.setStrokeWidth(1.0);
    selectionBox.setVisible(false);
    getGameScene().addUINode(selectionBox);

    getInput().addMouseEventHandler(MouseEvent.MOUSE_PRESSED, e -> {
        if (e.getButton() == MouseButton.PRIMARY) {
            dragStart = new Point2D(e.getSceneX(), e.getSceneY());
            selectionBox.setVisible(true);
        }
    });

    getInput().addMouseEventHandler(MouseEvent.MOUSE_DRAGGED, e -> {
        if (dragStart != null) {
            double minX = Math.min(dragStart.getX(), e.getSceneX());
            double minY = Math.min(dragStart.getY(), e.getSceneY());
            double w    = Math.abs(e.getSceneX() - dragStart.getX());
            double h    = Math.abs(e.getSceneY() - dragStart.getY());
            selectionBox.setLayoutX(minX);
            selectionBox.setLayoutY(minY);
            selectionBox.setWidth(w);
            selectionBox.setHeight(h);
        }
    });

    getInput().addMouseEventHandler(MouseEvent.MOUSE_RELEASED, e -> {
        if (e.getButton() == MouseButton.PRIMARY && dragStart != null) {
            selectUnitsInBox(dragStart, new Point2D(e.getSceneX(), e.getSceneY()));
            selectionBox.setVisible(false);
            dragStart = null;
        }
    });

    // Right-click move command
    getInput().addMouseEventHandler(MouseEvent.MOUSE_CLICKED, e -> {
        if (e.getButton() == MouseButton.SECONDARY && !selectedUnits.isEmpty()) {
            Point2D worldTarget = screenToWorld(e.getSceneX(), e.getSceneY());
            issueGroupMoveCommand(worldTarget);
        }
    });
}

private void selectUnitsInBox(Point2D a, Point2D b) {
    double minX = Math.min(a.getX(), b.getX());
    double minY = Math.min(a.getY(), b.getY());
    double maxX = Math.max(a.getX(), b.getX());
    double maxY = Math.max(a.getY(), b.getY());

    selectedUnits.forEach(u -> u.getComponent(UnitComponent.class).setSelected(false));
    selectedUnits.clear();

    getGameWorld().getEntitiesByType(EntityType.UNIT).forEach(unit -> {
        Point2D screen = worldToScreen(unit.getCenter());
        if (screen.getX() >= minX && screen.getX() <= maxX
                && screen.getY() >= minY && screen.getY() <= maxY) {
            unit.getComponent(UnitComponent.class).setSelected(true);
            selectedUnits.add(unit);
        }
    });
}
```

## Group Move with Formation Offsets

```java
private final List<Entity> selectedUnits = new ArrayList<>();

private void issueGroupMoveCommand(Point2D targetCenter) {
    int count  = selectedUnits.size();
    int cols   = (int) Math.ceil(Math.sqrt(count));
    int spacing = 40;

    for (int i = 0; i < count; i++) {
        int row = i / cols;
        int col = i % cols;
        double ox = (col - (cols - 1) / 2.0) * spacing;
        double oy = row * spacing;
        Point2D dest = targetCenter.add(ox, oy);

        selectedUnits.get(i)
                .getComponent(UnitComponent.class)
                .moveTo(dest);
    }
}
```

## Unit Component

```java
public class UnitComponent extends Component {
    private AStarMoveComponent astar;
    private boolean selected = false;
    private Circle selectionRing;

    @Override
    public void onAdded() {
        selectionRing = new Circle(18, Color.TRANSPARENT);
        selectionRing.setStroke(Color.LIMEGREEN);
        selectionRing.setStrokeWidth(2);
        selectionRing.setVisible(false);
        entity.getViewComponent().addChild(selectionRing);
    }

    public void moveTo(Point2D worldPos) {
        astar.moveToCell((int)(worldPos.getX() / TILE), (int)(worldPos.getY() / TILE));
    }

    public void setSelected(boolean sel) {
        selected = sel;
        selectionRing.setVisible(sel);
    }
}
```

## Resource Harvesting State Machine

```java
public class HarvesterComponent extends Component {
    private enum State { IDLE, MOVING_TO_RESOURCE, HARVESTING, MOVING_TO_BASE, DEPOSITING }
    private State state = State.IDLE;

    private Entity targetResource;
    private Entity base;
    private AStarMoveComponent astar;
    private double harvestTimer = 0;
    private int    carryAmount  = 0;
    private static final int   CARRY_MAX       = 10;
    private static final double HARVEST_RATE   = 1.5;  // seconds per unit

    @Override
    public void onUpdate(double tpf) {
        switch (state) {
            case IDLE -> findNearestResource();
            case MOVING_TO_RESOURCE -> {
                if (entity.getCenter().distance(targetResource.getCenter()) < 20) {
                    state = State.HARVESTING;
                }
            }
            case HARVESTING -> {
                harvestTimer += tpf;
                if (harvestTimer >= HARVEST_RATE) {
                    harvestTimer = 0;
                    carryAmount++;
                    targetResource.getComponent(ResourceComponent.class).deplete(1);
                    if (carryAmount >= CARRY_MAX || targetResource.getComponent(ResourceComponent.class).isEmpty()) {
                        state = State.MOVING_TO_BASE;
                        astar.moveToCell((int)(base.getX() / TILE), (int)(base.getY() / TILE));
                    }
                }
            }
            case MOVING_TO_BASE -> {
                if (entity.getCenter().distance(base.getCenter()) < 30) {
                    state = State.DEPOSITING;
                }
            }
            case DEPOSITING -> {
                inc("minerals", carryAmount);
                carryAmount = 0;
                state = State.IDLE;
            }
        }
    }

    private void findNearestResource() {
        getGameWorld().getEntitiesByType(EntityType.RESOURCE)
                .stream()
                .min(Comparator.comparingDouble(r -> r.getCenter().distance(entity.getCenter())))
                .ifPresent(r -> {
                    targetResource = r;
                    astar.moveToCell((int)(r.getX() / TILE), (int)(r.getY() / TILE));
                    state = State.MOVING_TO_RESOURCE;
                });
    }
}
```

## Building Placement with Ghost Preview

```java
private Entity placementGhost = null;
private String pendingBuildType = null;

public void startPlacement(String buildingType) {
    pendingBuildType = buildingType;
    placementGhost = entityBuilder()
            .view(new Rectangle(TILE * 2, TILE * 2, Color.color(0, 1, 0, 0.4)))
            .buildAndAttach();
}

@Override
protected void onUpdate(double tpf) {
    if (placementGhost != null) {
        // Snap to grid
        Point2D mouse = getInput().getMousePositionWorld();
        int gx = (int)(mouse.getX() / TILE);
        int gy = (int)(mouse.getY() / TILE);
        placementGhost.setPosition(gx * TILE, gy * TILE);

        boolean canPlace = isCellFree(gx, gy) && isCellFree(gx+1, gy)
                        && isCellFree(gx, gy+1) && isCellFree(gx+1, gy+1);
        Rectangle view = (Rectangle) placementGhost.getViewComponent().getChildren().get(0);
        view.setFill(Color.color(canPlace ? 0 : 1, canPlace ? 1 : 0, 0, 0.4));

        if (getInput().isHeld(MouseButton.PRIMARY) && canPlace) {
            placeBuilding(pendingBuildType, gx, gy);
            placementGhost.removeFromWorld();
            placementGhost = null;
            pendingBuildType = null;
        }
    }
}

private void placeBuilding(String type, int gx, int gy) {
    spawn(type, new SpawnData(gx * TILE, gy * TILE));
    occupied[gx][gy] = true;
    occupied[gx+1][gy] = true;
    occupied[gx][gy+1] = true;
    occupied[gx+1][gy+1] = true;
}
```

## Fog of War

```java
// Dark overlay canvas clipped by unit vision — redrawn each frame
private Canvas fogCanvas;
private GraphicsContext fogGC;

@Override
protected void initGame() {
    fogCanvas = new Canvas(getAppWidth(), getAppHeight());
    fogGC = fogCanvas.getGraphicsContext2D();
    fogCanvas.setMouseTransparent(true);
    getGameScene().addUINode(fogCanvas);
}

@Override
protected void onUpdate(double tpf) {
    fogGC.clearRect(0, 0, getAppWidth(), getAppHeight());

    // Dark fog layer
    fogGC.setFill(Color.color(0, 0, 0, 0.7));
    fogGC.fillRect(0, 0, getAppWidth(), getAppHeight());

    // Cut vision circles for each unit using CLEAR composite
    fogGC.setGlobalCompositeOperation(null);  // use BlendMode
    fogGC.setFill(Color.TRANSPARENT);

    for (Entity unit : getGameWorld().getEntitiesByType(EntityType.UNIT)) {
        Point2D screen = worldToScreen(unit.getCenter());
        double radius = 120;
        fogGC.clearRect(screen.getX() - radius, screen.getY() - radius,
                radius * 2, radius * 2);  // square clear; use clip path for circle
    }
}
```

## Minimap

```java
private Canvas minimapCanvas;
private static final int MAP_W = 150, MAP_H = 100;

@Override
protected void initGame() {
    minimapCanvas = new Canvas(MAP_W, MAP_H);
    minimapCanvas.setLayoutX(getAppWidth() - MAP_W - 10);
    minimapCanvas.setLayoutY(getAppHeight() - MAP_H - 10);
    getGameScene().addUINode(minimapCanvas);
}

private void drawMinimap() {
    GraphicsContext gc = minimapCanvas.getGraphicsContext2D();
    gc.setFill(Color.color(0, 0.1, 0));
    gc.fillRect(0, 0, MAP_W, MAP_H);

    double scaleX = MAP_W / (double)(GRID_W * TILE);
    double scaleY = MAP_H / (double)(GRID_H * TILE);

    for (Entity unit : getGameWorld().getEntitiesByType(EntityType.UNIT)) {
        gc.setFill(Color.LIMEGREEN);
        gc.fillOval(unit.getX() * scaleX - 2, unit.getY() * scaleY - 2, 4, 4);
    }
    for (Entity enemy : getGameWorld().getEntitiesByType(EntityType.ENEMY)) {
        gc.setFill(Color.RED);
        gc.fillOval(enemy.getX() * scaleX - 2, enemy.getY() * scaleY - 2, 4, 4);
    }
}
```

## Gotchas

- **AStarMoveComponent requires a valid AStarGrid** — call `getAStarGrid().setWalkable(x, y, false)` when
  placing buildings. Failing to update the grid after construction means units walk through buildings.
- **Formation offsets prevent unit stacking** — without offsets, all selected units pathfind to the exact
  same cell, causing them to visually overlap and fight over the tile.
- **Selection box is UI space, unit positions are world space** — use `worldToScreen()` to convert unit
  center before comparing against the rubber-band box bounds.
- **Fog-of-war canvas must be `mouseTransparent`** — otherwise mouse events (clicks, drags) are
  swallowed by the fog overlay and never reach the game entities underneath.
- **Harvester state DEPOSITING is one frame** — the deposit is instant. Transition back to IDLE
  immediately so the harvester finds the next resource without delay.
- **Building placement ghost needs a separate entity** — do NOT use the final building entity as a ghost.
  Spawning the real entity early causes physics/collision registration before placement is confirmed.
