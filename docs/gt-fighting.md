# Game Type — Fighting Game

Covers 1v1 and 2v2 close-combat games. Character state machines, hitbox/hurtbox distinction, combo systems, frame data windows.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-FIGHT-1\nCharacter FSM (idle/walk/jump/attack/hurt/block)"]
    Dev --> UC2["UC-FIGHT-2\nSeparate hitbox (deals damage) and hurtbox (receives)"]
    Dev --> UC3["UC-FIGHT-3\nInput buffer for combo detection"]
    Dev --> UC4["UC-FIGHT-4\nFrame windows: startup/active/recovery"]
    Dev --> UC5["UC-FIGHT-5\nKnockback on hit"]
    Dev --> UC6["UC-FIGHT-6\nHUD health bars with chip damage animation"]
    Dev --> UC7["UC-FIGHT-7\nSuper/special move execution"]
    Dev --> UC8["UC-FIGHT-8\nBlock reduces damage, chip damage applies"]
    Dev --> UC9["UC-FIGHT-9\nCombo counter (consecutive hits)"]
    Dev --> UC10["UC-FIGHT-10\nRound timer and round structure"]
```

## Character State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Walking : directional input
    Idle --> Jumping : jump input + grounded
    Idle --> Attacking : attack input
    Idle --> Blocking : block held
    Walking --> Idle : no input
    Walking --> Jumping : jump input
    Walking --> Attacking : attack input
    Attacking --> Idle : animation complete
    Attacking --> Hurt : opponent hitbox intersects hurtbox
    Blocking --> Hurt : opponent attack (chip damage only)
    Blocking --> Idle : block released
    Jumping --> Falling : apex of jump
    Falling --> Idle : land
    Hurt --> Idle : hitstun expires
    Hurt --> KnockedDown : damage > threshold
    KnockedDown --> Rising : recovery input or timer
    Rising --> Idle : invincible during rise
```

## Hitbox / Hurtbox Architecture

```mermaid
flowchart TD
    Character["character entity"] --> HurtboxComp["HurtboxComponent\n(active always)\nbody = sensor STATIC\nlayer = HURTBOX"]
    Character --> HitboxComp["HitboxComponent\n(active only during attack active frames)\nbody = sensor STATIC\nlayer = HITBOX"]
    HitboxComp --> Collide["onCollisionBegin HITBOX vs HURTBOX\n→ determine attacker and defender\n→ apply damage if not blocking"]
    HitboxComp --> Deactivate["deactivate hitbox on recovery frame"]
```

## Input Buffer

```mermaid
flowchart LR
    InputPress["player presses button"] --> Buffer["add to circular buffer\nList with timestamps\nmax window = 500ms"]
    Buffer --> CheckCombo["scan buffer for sequences:\n  DOWN, DOWN-FORWARD, FORWARD, PUNCH → Hadouken\n  FORWARD, FORWARD, KICK → Dash"]
    CheckCombo --> |match| ExecuteSpecial["trigger special move\nclear matched inputs from buffer"]
```

## Frame Data Pattern

```mermaid
flowchart TD
    AttackStart["attack input"] --> StartupFrames["frames 1-5: startup\nno hitbox active\ncharacter commits to attack"]
    StartupFrames --> ActiveFrames["frames 6-10: active\nhitbox spawned\ncan deal damage"]
    ActiveFrames --> RecoveryFrames["frames 11-25: recovery\nhitbox removed\ncharacter vulnerable"]
    RecoveryFrames --> Idle
```

## Health Bar Animation

```mermaid
flowchart LR
    TakeDamage["player takes damage"] --> InstantReduce["red HP bar snaps to new value instantly"]
    InstantReduce --> DelayedReduce["grey 'chip' segment\nanimates to new value\nover 0.5 seconds (tweened)"]
    DelayedReduce --> KO["if HP = 0: KO sequence"]
```
