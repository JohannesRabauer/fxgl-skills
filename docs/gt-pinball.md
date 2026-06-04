# Game Type — Pinball

Covers physics-based pinball with flippers, bumpers, ramps, targets, multi-ball, and score multipliers.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-PIN-1\nFlipper rotates on key press (Box2D joint)"]
    Dev --> UC2["UC-PIN-2\nBall with high restitution bounces off walls"]
    Dev --> UC3["UC-PIN-3\nCircular bumper applies impulse to ball"]
    Dev --> UC4["UC-PIN-4\nTarget sequence (hit all → bonus)"]
    Dev --> UC5["UC-PIN-5\nBall launch via plunger (charge + release)"]
    Dev --> UC6["UC-PIN-6\nScore multiplier progression"]
    Dev --> UC7["UC-PIN-7\nMulti-ball mode"]
    Dev --> UC8["UC-PIN-8\nBall drains past flippers → lose ball"]
    Dev --> UC9["UC-PIN-9\nRamp: divert ball to upper playfield"]
    Dev --> UC10["UC-PIN-10\nHigh score save / display"]
```

## Table Layout

```mermaid
flowchart TD
    Table["STATIC physics bodies\n(table walls, guide rails, ramps)"] --> LeftFlipper["LEFT FLIPPER\nKinematicBody\npivot at left end\nrotates UP (rest) to DOWN (pressed)"]
    Table --> RightFlipper["RIGHT FLIPPER\nKinematicBody\npivot at right end\nrotates UP (rest) to DOWN (pressed)"]
    Table --> Bumpers["BUMPERS: circular STATIC + sensor\napply impulse on contact"]
    Table --> Drain["DRAIN SENSOR at bottom\ntriggers ball loss"]
```

## Flipper Mechanics

```mermaid
flowchart LR
    ZKey["Z pressed"] --> ActivateLeft["left flipper:\nset angular velocity = -flipperSpeed\n(rotate upward quickly)"]
    ZKey --> |released| RetractLeft["left flipper:\nset angular velocity = +flipperRetractSpeed\n(rotate back to rest, slowly)"]
    XKey["X pressed"] --> ActivateRight["right flipper:\nset angular velocity = +flipperSpeed"]
    XKey --> |released| RetractRight["right flipper:\nset angular velocity = -flipperRetractSpeed"]
```

## Bumper Impulse

```mermaid
flowchart TD
    BallHitBumper["onCollisionBegin BALL + BUMPER"] --> CalcDir["direction = ball.getCenter() - bumper.getCenter()"]
    CalcDir --> Normalize["normalize direction"]
    Normalize --> ApplyImpulse["ball.getPhysics().applyLinearImpulse(\n  dir × bumperForce\n)"]
    ApplyImpulse --> Score["inc('score', bumperPoints)\nflash bumper light"]
```

## Plunger Launch

```mermaid
flowchart LR
    PlungerHold["RIGHT ARROW held"] --> ChargeTimer["chargeTime += tpf\nclamp to maxCharge"]
    ChargeTimer --> VisualFeedback["show spring compression\nin plunger lane"]
    PlungerRelease["RIGHT ARROW released"] --> LaunchForce["force = minForce + (chargeTime / maxCharge) * (maxForce - minForce)"]
    LaunchForce --> ApplyUp["ball.getPhysics().applyLinearImpulse(\n  new Point2D(0, -force)\n)"]
```

## Multi-Ball

```mermaid
flowchart LR
    TriggerMultiball["special target hit"] --> SpawnBalls["for i in 1..2:\n  spawn new ball entity\n  at kicker position\n  apply random upward impulse"]
    SpawnBalls --> TrackBalls["balls = getGameWorld().getEntitiesByType(BALL)"]
    TrackBalls --> LastBall["if balls.size() == 0:\n  ball drained → lose ball / game over"]
```
