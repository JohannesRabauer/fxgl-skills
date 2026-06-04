# Game Type — Metroidvania

Covers non-linear platformers with interconnected rooms, ability-gated progression (double jump, dash, wall slide), persistent map exploration, and backtracking.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-MV-1\nRoom-by-room map from Tiled files"]
    Dev --> UC2["UC-MV-2\nAbility gates (require item to proceed)"]
    Dev --> UC3["UC-MV-3\nDouble jump, dash, wall slide abilities"]
    Dev --> UC4["UC-MV-4\nPersistent room state (items collected, doors opened)"]
    Dev --> UC5["UC-MV-5\nRoom transition at screen edge"]
    Dev --> UC6["UC-MV-6\nMap overlay showing explored rooms"]
    Dev --> UC7["UC-MV-7\nSave statue (save point) interaction"]
    Dev --> UC8["UC-MV-8\nBoss gates open after boss defeated"]
    Dev --> UC9["UC-MV-9\nFast-travel between save points"]
    Dev --> UC10["UC-MV-10\nMap secrets: hidden rooms behind breakable walls"]
```

## Room Management

```mermaid
flowchart TD
    WorldMap["world map: grid of room coords\n(roomX, roomY) → 'room_X_Y.tmx'"] --> CurrentRoom["currentRoom (roomX, roomY)"]
    CurrentRoom --> TransitionTrigger["player reaches edge sensor\nwith direction: LEFT/RIGHT/UP/DOWN"]
    TransitionTrigger --> CalcNextRoom["nextRoom = currentRoom + directionOffset"]
    CalcNextRoom --> LoadRoom["transition effect (fade out)\nsetLevelFromMap('room_' + next.x + '_' + next.y + '.tmx')\nreposition player at entry point\nfade in"]
```

## Ability System

```mermaid
flowchart TD
    Abilities["boolean flags in save state:\nhasDoubleJump\nhasDash\nhasWallSlide\nhasGrapple"] --> JumpLogic["onJump:\n  if jumpsUsed < (hasDoubleJump ? 2 : 1): jump"]
    Abilities --> DashLogic["on DASH: if hasDash and dashCooldown == 0:\n  apply burst velocity in facing direction\n  start dashCooldown (0.8s)"]
    Abilities --> WallSlideLogic["if pressed into wall while airborne and hasWallSlide:\n  cap downward velocity (slide slowly)"]
    Abilities --> GateCheck["ability gate entities check:\n  if !player.hasAbility: show 'blocked' visual"]
```

## Persistent Room State

```mermaid
flowchart LR
    RoomEvents["item collected, door opened,\nenemy killed (permanent)"] --> RoomStateMap["Map<RoomCoord, RoomState>\nstored in SaveData"]
    RoomStateMap --> OnRoomLoad["when loading a room:\n  apply its RoomState\n  (remove collected items\n   keep doors open\n   remove defeated bosses)"]
    RoomStateMap --> SaveOnTransition["save world state\non every room transition"]
```

## Map Overlay

```mermaid
flowchart TD
    MapOverlay["M key → open map SubScene"] --> RoomGrid["draw grid of explored rooms\n(grey = unexplored, colored = visited)"]
    RoomGrid --> CurrentRoomMarker["highlight current room\nwith blinking player dot"]
    RoomGrid --> RoomTypes["color-code rooms:\n  SAVE POINT: yellow\n  BOSS: red\n  ITEM: blue\n  TRANSITION: white"]
    RoomGrid --> SecretRooms["hidden rooms: not shown until discovered"]
```

## Dash Ability Implementation

```mermaid
flowchart LR
    DashKey["SHIFT pressed\nhasDash = true\ndashedThisAir = false OR on ground"] --> DashEffect["spawn trail particles\nstop gravity for 0.15s\nsetLinearVelocity(facing × dashSpeed, 0)"]
    DashEffect --> DashDuration["after 0.15s: restore gravity\ndashedThisAir = true\nstartCooldown(0.8s)"]
    DashDuration --> ResetOnLand["on land: dashedThisAir = false"]
```
