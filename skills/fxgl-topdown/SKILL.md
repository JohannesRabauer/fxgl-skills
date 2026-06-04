---
name: fxgl-topdown
description: >
  Build a top-down 2D game in FXGL — disable gravity for the physics world, implement
  8-direction normalized movement, bind the camera to follow the player with world bounds,
  aim and fire projectiles toward the mouse cursor, spawn a melee attack hitbox in the
  facing direction, trigger NPC interactions on proximity, handle area/room transitions at
  screen edges, display a minimap with entity dots, and load Tiled TMX tile-based worlds.
  Use this skill when building a Zelda-style adventure, twin-stick shooter, top-down RPG,
  arena shooter, or any bird's-eye-view 2D game.
triggers:
  - top-down
  - bird's eye
  - 8-direction
  - twin-stick
  - top-down RPG
  - Zelda-style
  - arena shooter
  - no gravity
  - top-down movement
  - aim at mouse
compatibility: >
  Java 17+, FXGL 21.x
category: fxgl/game-types
tags:
  - fxgl
  - java
  - javafx
  - game-types
  - topdown
metadata:
  author: "fxgl-skills"
  version: "1.0"
  fxgl-version: "21.1"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---
# FXGL Top-Down 2D

## World Without Gravity

```java
@Override
protected void initPhysics() {
    getPhysicsWorld().setGravity(0, 0);
}
```

## Player Entity (8-Direction)

```java
@Spawns("player")
public Entity newPlayer(SpawnData data) {
    PhysicsComponent physics = new PhysicsComponent();
    physics.setBodyType(BodyType.DYNAMIC);
    physics.setFixedRotation(true);   // prevent Box2D rotating the body

    FixtureDef fd = new FixtureDef();
    fd.setFriction(0.0f);
    fd.setDensity(1.0f);
    physics.addFixtureDef(fd);

    return entityBuilder(data)
            .type(EntityType.PLAYER)
            .view("player.png")
            .bbox(BoundingShape.circle(14))   // circle hitbox for smooth wall sliding
            .with(physics)
            .with(new CollidableComponent(true))
            .with(new TopDownPlayerComponent())
            .build();
}
```

## TopDownPlayerComponent — 8-Direction Movement

```java
public class TopDownPlayerComponent extends Component {
    private PhysicsComponent physics;

    private static final double MOVE_SPEED = 180.0;

    @Override
    public void onUpdate(double tpf) {
        double dx = 0, dy = 0;

        if (getInput().isHeld(KeyCode.W) || getInput().isHeld(KeyCode.UP))    dy -= 1;
        if (getInput().isHeld(KeyCode.S) || getInput().isHeld(KeyCode.DOWN))  dy += 1;
        if (getInput().isHeld(KeyCode.A) || getInput().isHeld(KeyCode.LEFT))  dx -= 1;
        if (getInput().isHeld(KeyCode.D) || getInput().isHeld(KeyCode.RIGHT)) dx += 1;

        // Normalize diagonal movement (prevents faster diagonal speed)
        if (dx != 0 && dy != 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }

        physics.setVelocityX(dx * MOVE_SPEED);
        physics.setVelocityY(dy * MOVE_SPEED);

        // Face movement direction
        if (dx != 0 || dy != 0) {
            entity.setRotation(Math.toDegrees(Math.atan2(dy, dx)));
        }
    }
}
```

## Aim at Mouse Cursor

```java
// In TopDownPlayerComponent.onUpdate — face cursor instead of movement direction:
public void faceMouseCursor() {
    Point2D mouseWorld = getInput().getMousePositionWorld();
    Point2D playerPos  = entity.getCenter();
    double  angle      = Math.toDegrees(
            Math.atan2(mouseWorld.getY() - playerPos.getY(),
                       mouseWorld.getX() - playerPos.getX()));
    entity.setRotation(angle);
}
```

## Ranged Attack Toward Mouse

```java
// Fire a projectile in the direction of the mouse cursor
private void fireProjectile() {
    Point2D mousePos  = getInput().getMousePositionWorld();
    Point2D playerPos = player.getCenter();
    Point2D direction = mousePos.subtract(playerPos).normalize();

    spawn("bullet", new SpawnData(playerPos.getX(), playerPos.getY())
            .put("dir", direction));
}

@Spawns("bullet")
public Entity newBullet(SpawnData data) {
    Point2D dir = data.get("dir");
    return entityBuilder(data)
            .type(EntityType.BULLET)
            .view(new Circle(4, Color.YELLOW))
            .bbox(BoundingShape.circle(4))
            .with(new CollidableComponent(true))
            .with(new ProjectileComponent(dir, 500))
            .with(new ExpireCleanComponent(Duration.seconds(2)))
            .build();
}
```

## Melee Attack Arc

```java
private void meleeAttack() {
    // Spawn a hitbox in front of the player based on facing angle
    double angle  = player.getRotation();
    double dist   = 40.0;   // how far in front
    double hitW   = 60.0;
    double hitH   = 40.0;

    double cx = player.getCenter().getX() + Math.cos(Math.toRadians(angle)) * dist;
    double cy = player.getCenter().getY() + Math.sin(Math.toRadians(angle)) * dist;

    entityBuilder()
            .at(cx - hitW / 2, cy - hitH / 2)
            .type(EntityType.PLAYER_HITBOX)
            .bbox(BoundingShape.box(hitW, hitH))
            .with(new CollidableComponent(true))
            .with(new ExpireCleanComponent(Duration.millis(120)))
            .buildAndAttach();
}

// In initPhysics:
onCollisionBegin(EntityType.PLAYER_HITBOX, EntityType.ENEMY, (hitbox, enemy) -> {
    enemy.getComponent(HPComponent.class).damage(25);
    play("sounds/hit.wav");
});
```

## Camera Follow with Bounds

```java
@Override
protected void initGame() {
    setLevelFromMap("world.tmx");
    Viewport vp = getGameScene().getViewport();
    vp.bindToEntity(player, getAppWidth() / 2.0, getAppHeight() / 2.0);
    vp.setBounds(0, 0, WORLD_WIDTH * TILE, WORLD_HEIGHT * TILE);
    vp.setLazy(true);   // slight follow lag for smooth feel
}
```

## NPC Interaction on Proximity

```java
// In initPhysics:
onCollisionBegin(EntityType.PLAYER, EntityType.NPC, (player, npc) -> {
    String npcName = npc.getString("name");
    // Show interaction prompt
    showInteractPrompt(npcName);
    currentNPC = npc;
});

onCollisionEnd(EntityType.PLAYER, EntityType.NPC, (player, npc) -> {
    hideInteractPrompt();
    currentNPC = null;
});

// In initInput:
onKeyDown(KeyCode.E, () -> {
    if (currentNPC != null) {
        String dialogueFile = currentNPC.getString("dialogue");
        DialogueGraph graph = getAssetLoader().loadDialogueGraph(dialogueFile);
        getCutsceneService().startDialogueScene(graph);
    }
});
```

## Room Transition at Screen Edge

```java
// Sensor entities placed at level edges (created in Tiled as objects):
onCollisionBegin(EntityType.PLAYER, EntityType.DOOR_TRIGGER, (player, door) -> {
    String targetRoom = door.getString("targetRoom");
    String entryPoint = door.getString("entryPoint");
    transitionToRoom(targetRoom, entryPoint);
});

private void transitionToRoom(String roomFile, String entryPoint) {
    // Fade out
    animationBuilder()
            .duration(Duration.seconds(0.3))
            .fadeOut(getGameScene().getContentRoot())
            .buildAndPlay();

    runOnce(() -> {
        setLevelFromMap(roomFile + ".tmx");
        // Find entry point object from Tiled and reposition player
        Entity entry = getGameWorld().getEntitiesByType(EntityType.ENTRY_POINT)
                .stream().filter(e -> e.getString("id").equals(entryPoint))
                .findFirst().orElseThrow();
        player.setPosition(entry.getPosition());

        animationBuilder()
                .duration(Duration.seconds(0.3))
                .fadeIn(getGameScene().getContentRoot())
                .buildAndPlay();
    }, Duration.seconds(0.35));
}
```

## Simple Minimap

```java
// Add minimap in initUI
private Canvas minimap;
private static final int MM_SCALE = 4;    // 1 world tile → 4 minimap pixels

@Override
protected void initUI() {
    int mmW = WORLD_WIDTH  * MM_SCALE;
    int mmH = WORLD_HEIGHT * MM_SCALE;
    minimap = new Canvas(mmW, mmH);
    minimap.setTranslateX(getAppWidth()  - mmW - 10);
    minimap.setTranslateY(10);
    addUINode(minimap);
}

@Override
protected void onUpdate(double tpf) {
    GraphicsContext gc = minimap.getGraphicsContext2D();
    gc.setFill(Color.color(0, 0, 0, 0.6));
    gc.fillRect(0, 0, minimap.getWidth(), minimap.getHeight());

    // Draw player dot
    gc.setFill(Color.GREEN);
    gc.fillOval(player.getX() / TILE * MM_SCALE - 2,
                player.getY() / TILE * MM_SCALE - 2, 4, 4);

    // Draw enemy dots
    gc.setFill(Color.RED);
    getGameWorld().getEntitiesByType(EntityType.ENEMY).forEach(e -> {
        gc.fillOval(e.getX() / TILE * MM_SCALE - 1,
                    e.getY() / TILE * MM_SCALE - 1, 3, 3);
    });
}
```

## Gotchas

- **`setGravity(0, 0)` in `initPhysics`, not `initGame`** — `initPhysics` runs before `initGame`.
  Setting gravity in `initGame` may still affect entities spawned in `initPhysics`.
- **`setFixedRotation(true)` on the physics body** — without this, Box2D rotates the player
  body when it slides along walls, causing the entity to visually spin unexpectedly.
- **Circle hitbox for smooth wall sliding** — a box hitbox catches corners when the player
  slides diagonally along a wall. Use `BoundingShape.circle()` for the player body.
- **Diagonal speed normalization is mandatory** — without the 0.7071 factor, diagonal movement
  is 41% faster than cardinal directions, making diagonal movement the optimal strategy.
- **`getMousePositionWorld()`** returns world (game) coordinates, accounting for camera scroll.
  `getMousePositionUI()` returns screen coordinates — use the former for in-game targeting.
- **`ProjectileComponent` entity type must be collidable** — add `CollidableComponent(true)`
  or the bullet won't trigger `onCollisionBegin`.
- **NPC interaction zone as sensor** — if the NPC body is STATIC, it blocks player movement.
  Make the NPC body a sensor (BodyType.STATIC + sensor fixture) or use a separate sensor trigger.
