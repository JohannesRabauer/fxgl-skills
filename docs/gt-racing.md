# Game Type — Racing Game

Covers top-down and 3D racing games with circuit tracks, lap counting, vehicle physics, AI opponents, and checkpoint systems.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-RACE-1\nVehicle acceleration/braking/turning physics"]
    Dev --> UC2["UC-RACE-2\nTrack with lap-counting checkpoints"]
    Dev --> UC3["UC-RACE-3\nAI opponent follows racing line"]
    Dev --> UC4["UC-RACE-4\nCollision with track walls (bounce/friction)"]
    Dev --> UC5["UC-RACE-5\nPower-ups on track (boost, shield, attack)"]
    Dev --> UC6["UC-RACE-6\nRace position tracking (1st/2nd/...)"]
    Dev --> UC7["UC-RACE-7\nLap timer and best lap record"]
    Dev --> UC8["UC-RACE-8\nGhost replay of best lap"]
    Dev --> UC9["UC-RACE-9\nDrift mechanic (reduce traction)"]
    Dev --> UC10["UC-RACE-10\nFinish line detection and results screen"]
```

## Vehicle Physics

```mermaid
flowchart TD
    CarEntity["car entity\nBodyType.DYNAMIC\nlinearDamping = 0.95\nangularDamping = 0.95"] --> Throttle["ACCELERATE:\nforceAlongFacing = acceleration * tpf\napplyForce(forward * force)"]
    CarEntity --> Steer["STEER:\nif speed > minSteerSpeed:\n  body.setAngularVelocity(steerInput * turnSpeed)"]
    CarEntity --> Brake["BRAKE:\napplyForce(-forward * brakeForce * tpf)"]
    CarEntity --> SlipFactor["lateral velocity damping:\nreduces sliding sideways\n(simulates tire grip)"]
```

## Checkpoint Lap System

```mermaid
flowchart TD
    Checkpoints["ordered list of checkpoint sensor entities"] --> PassCheck["onCollisionBegin PLAYER + CHECKPOINT"]
    PassCheck --> ValidOrder["check: checkpoint.id == nextExpectedCheckpoint"]
    ValidOrder --> |correct order| Advance["nextExpectedCheckpoint++"]
    Advance --> AllPassed["if nextExpectedCheckpoint > maxCheckpoint"]
    AllPassed --> CompleteLap["lap++\nnextExpectedCheckpoint = 0\nrecord lap time"]
    CompleteLap --> FinishCheck["if lap >= totalLaps: FINISH"]
```

## AI Racing Line

```mermaid
flowchart LR
    RacingLine["predefined list of\nPoint2D waypoints along\noptimal racing path"] --> AIUpdate["AI car onUpdate:"]
    AIUpdate --> TargetNext["targetWaypoint = racingLine[nextWP]"]
    TargetNext --> SteerToward["angle = atan2(target - carPos)\nsteer car toward that angle"]
    SteerToward --> AdvanceWP["if distance to waypoint < threshold:\n  nextWP++"]
    AdvanceWP --> VariableSpeed["reduce speed on tight corners\nfull throttle on straights"]
```

## Race Position Tracking

```mermaid
flowchart TD
    PositionCalc["each frame: sort all racers by progress"] --> ProgressFormula["progress = (lapsDone × totalCheckpoints) + nextCheckpointId\n+ distanceToNextCheckpoint / checkpointDistance"]
    ProgressFormula --> SortDesc["sort all cars by progress descending"]
    SortDesc --> AssignPos["cars.get(0) = 1st place\ncars.get(1) = 2nd place, etc."]
```

## Drift Mechanic

```mermaid
flowchart LR
    DriftInput["DRIFT key held\n+ steering input"] --> ReduceTraction["temporarily increase\nlateral velocity allowed\n(reduce grip damping factor)"]
    ReduceTraction --> SideSlide["car slides sideways\n(lateral velocity preserved)"]
    SideSlide --> BoostOnRelease["if drift >= 1.0 second:\n  apply boost on release"]
    BoostOnRelease --> RestoreGrip["restore normal lateral damping"]
```
