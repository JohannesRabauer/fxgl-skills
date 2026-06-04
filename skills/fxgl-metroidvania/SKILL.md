---
name: fxgl-metroidvania
description: >
  Build a Metroidvania in FXGL — connect multiple platforming rooms, transition between Tiled
  maps at screen edges, gate progression behind movement abilities, persist room state and item
  pickups, add a map overlay for explored rooms, support save points and fast travel, and handle
  backtracking through an interconnected world.
triggers:
  - metroidvania
  - ability gate
  - room transition
  - save statue
  - map overlay
  - double jump
  - wall slide
  - dash
  - backtracking
compatibility: >
  Java 17+, FXGL 21.x. Combines patterns from fxgl-platformer, fxgl-level-assets, fxgl-ui-scenes,
  and fxgl-save-load.
category: fxgl/game-types
tags:
  - fxgl
  - java
  - javafx
  - game-types
  - metroidvania
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
# FXGL Metroidvania

## World Structure

Model the world as room coordinates rather than one giant map.

```java
public record RoomCoord(int x, int y) {}

private final Map<RoomCoord, String> worldMap = Map.of(
        new RoomCoord(0, 0), "rooms/room_0_0.tmx",
        new RoomCoord(1, 0), "rooms/room_1_0.tmx",
        new RoomCoord(1, 1), "rooms/room_1_1.tmx"
);

private RoomCoord currentRoom = new RoomCoord(0, 0);
```

## Room Transition

```java
private void loadRoom(RoomCoord room, String entryPoint) {
    currentRoom = room;

    getGameWorld().clearLevel();
    setLevelFromMap(worldMap.get(room));

    Entity spawn = getGameWorld().getSingleton(e -> e.isType(EntityType.SPAWN_POINT)
            && e.getString("name").equals(entryPoint));

    player.setPosition(spawn.getX(), spawn.getY());
    applyRoomState(room);
}
```

Use edge triggers or named exits in Tiled to move to adjacent rooms.

## Ability Flags

```java
public final class PlayerAbilities {
    public boolean hasDoubleJump;
    public boolean hasDash;
    public boolean hasWallSlide;
    public boolean hasGrapple;
}

private final PlayerAbilities abilities = new PlayerAbilities();
```

Ability-gated doors and passages should read these flags instead of checking inventory strings.

## Double Jump / Dash / Wall Slide

```java
public class HeroComponent extends Component {
    private int jumpsUsed = 0;
    private boolean dashedThisAir = false;

    public void jump() {
        int maxJumps = abilities.hasDoubleJump ? 2 : 1;
        if (jumpsUsed >= maxJumps)
            return;

        physics.setVelocityY(-14);
        jumpsUsed++;
    }

    public void dash() {
        if (!abilities.hasDash || dashedThisAir)
            return;

        physics.setVelocityX(entity.getScaleX() > 0 ? 500 : -500);
        dashedThisAir = true;
    }

    public void onLanded() {
        jumpsUsed = 0;
        dashedThisAir = false;
    }
}
```

## Persistent Room State

Track changes per room so revisiting feels persistent.

```java
public final class RoomState {
    public final Set<String> collectedItems = new HashSet<>();
    public final Set<String> openedDoors = new HashSet<>();
    public final Set<String> defeatedBosses = new HashSet<>();
}

private final Map<RoomCoord, RoomState> roomStates = new HashMap<>();
```

When loading a room, remove entities already collected or defeated.

## Save Points and Fast Travel

```java
onCollisionBegin(EntityType.PLAYER, EntityType.SAVE_POINT, (player, save) -> {
    set("lastSaveRoomX", currentRoom.x());
    set("lastSaveRoomY", currentRoom.y());
    set("lastSaveSpawn", save.getString("id"));
    // persist via SaveLoadService
});
```

Fast travel should unlock only between visited save points, not every room.

## Map Overlay

Use a `SubScene` to draw discovered rooms.

```java
private final Set<RoomCoord> exploredRooms = new HashSet<>();

private void markExplored(RoomCoord room) {
    exploredRooms.add(room);
}
```

Color-code rooms:

- normal room
- save point
- boss room
- item room
- hidden room revealed later

## Breakable Walls and Secrets

Mark breakable walls in Tiled or via entity properties.

```java
onCollisionBegin(EntityType.PLAYER_ATTACK, EntityType.BREAKABLE_WALL, (attack, wall) -> {
    wall.removeFromWorld();
    roomStates.computeIfAbsent(currentRoom, key -> new RoomState())
            .openedDoors.add(wall.getString("id"));
});
```

## Recommended Composition

- use **fxgl-platformer** for movement feel
- use **fxgl-level-assets** for Tiled room loading
- use **fxgl-save-load** for persistent progression
- use **fxgl-ui-scenes** for the world map overlay

This skill is the game-structure layer above those systems.

## Gotchas

- **Room transitions must preserve persistent state** — otherwise backtracking feels broken.
- **Ability gates should be boolean progression flags** — using raw item names for everything
  becomes brittle once several upgrades unlock the same movement mechanic.
- **Fast travel should not bypass unfinished progression accidentally** — unlock nodes
  intentionally and test sequence breaks.
- **Map overlays should reveal secrets only when discovered** — hidden rooms lose their purpose
  if drawn from the start.
