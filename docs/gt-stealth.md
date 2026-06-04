# Game Type — Stealth Game

Covers games where players must avoid detection by guards. Line-of-sight cones, patrol routes, detection state machines, noise mechanics, cover and shadows.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-STEALTH-1\nGuard has conical vision field with range"]
    Dev --> UC2["UC-STEALTH-2\nLine of sight blocked by walls (raycast)"]
    Dev --> UC3["UC-STEALTH-3\nDetection state: unaware → suspicious → alerted"]
    Dev --> UC4["UC-STEALTH-4\nPatrol route (waypoint loop)"]
    Dev --> UC5["UC-STEALTH-5\nPlayer makes noise (move fast = noisy)"]
    Dev --> UC6["UC-STEALTH-6\nGuard hears noise and investigates"]
    Dev --> UC7["UC-STEALTH-7\nHiding spots (shadows, lockers)"]
    Dev --> UC8["UC-STEALTH-8\nAlarm: alerted guard calls for backup"]
    Dev --> UC9["UC-STEALTH-9\nPlayer detection meter (fill before caught)"]
    Dev --> UC10["UC-STEALTH-10\nKnock out guard (non-lethal takedown)"]
```

## Guard Detection State Machine

```mermaid
stateDiagram-v2
    [*] --> Patrolling
    Patrolling --> Suspicious : player partially in FOV or noise heard
    Suspicious --> Alerted : detectionMeter filled (stays 2+ seconds)
    Suspicious --> Patrolling : player left sight and noise subsided
    Alerted --> Searching : player left sight
    Searching --> Alerted : player spotted again
    Searching --> Patrolling : search timer expires (30s), no sighting
    Alerted --> [*] : guard KO'd

    Patrolling : follows waypoint route
    Suspicious : slows, turns toward sound/sight
    Alerted : chases player, alerts others
    Searching : checks last known position
```

## Vision Cone Detection

```mermaid
flowchart TD
    GuardFOV["Guard FOV:\n• range = 300px\n• halfAngle = 60 degrees"] --> InRange["distance(guard, player) <= range"]
    InRange --> InAngle["angle between guard.facing and\ndir to player <= halfAngle"]
    InAngle --> LineOfSight["raycast from guard to player\nif no WALL entity hit: LOS clear"]
    LineOfSight --> |all pass| AddDetection["detectionMeter += detectionRate * tpf\n(faster if player is running)"]
    LineOfSight --> |any fail| DecayDetection["detectionMeter -= decayRate * tpf"]
```

## Noise System

```mermaid
flowchart LR
    PlayerAction["player action"] --> NoiseRadius["emit noise with radius:\n• walking: 80px\n• running: 200px\n• throwing object: 350px\n• combat: 500px"]
    NoiseRadius --> NearbyGuards["find guards within noiseRadius"]
    NearbyGuards --> GuardHears["guard transitions to Suspicious\nfaces noise source position"]
```

## Cover / Hiding Mechanic

```mermaid
flowchart TD
    ShadowZone["shadow/cover entity\n(sensor trigger area)"] --> PlayerInShadow["onCollisionBegin PLAYER + SHADOW\n→ player.isHiding = true"]
    PlayerInShadow --> ReduceDetection["while hiding:\n  guard detectionRate × 0.0 (immune)\n  if guard is SUSPICIOUS: detection decays faster"]
    ShadowZone --> PlayerLeaves["onCollisionEnd:\n  player.isHiding = false"]
```

## Guard Patrol

```mermaid
flowchart LR
    Waypoints["waypoints from Tiled object layer"] --> WaypointComp["WaypointMoveComponent\nwith looping = true"]
    WaypointComp --> AtWaypoint["on reach waypoint:\n  if guard has lookDir: rotate to lookDir\n  wait lookDuration seconds\n  continue to next waypoint"]
    GuardAlerted["guard alerted"] --> PausePatrol["waypointMoveComp.pause()\nswitch to chase behavior"]
    GuardSearching["guard searching"] --> ResumePatrol["after search timer:\n  waypointMoveComp.resume()"]
```
