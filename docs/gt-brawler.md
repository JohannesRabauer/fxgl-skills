# Game Type — Beat 'em Up / Brawler

Covers side-scrolling brawlers (Streets of Rage, Final Fight style). Player fights multiple melee enemies on a scrolling stage, combo attacks, knockback, co-op.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-BRAWL-1\nSide-scroll stage advances on enemy defeat"]
    Dev --> UC2["UC-BRAWL-2\nMelee hit detection (range in front of player)"]
    Dev --> UC3["UC-BRAWL-3\nKnockback impulse on hit"]
    Dev --> UC4["UC-BRAWL-4\nEnemy crowd AI (surround player)"]
    Dev --> UC5["UC-BRAWL-5\nCombo counter (consecutive hits)"]
    Dev --> UC6["UC-BRAWL-6\nGrapple / throw mechanic"]
    Dev --> UC7["UC-BRAWL-7\nFood/item pickups restore health"]
    Dev --> UC8["UC-BRAWL-8\nBoss fight at end of stage"]
    Dev --> UC9["UC-BRAWL-9\nCo-op: 2 player simultaneous"]
    Dev --> UC10["UC-BRAWL-10\nStage clear bonus score"]
```

## Stage Progression

```mermaid
flowchart TD
    EnemyGroup["current enemy group defined in Tiled\n(spawn when player reaches area)"] --> AllDefeated["getGameWorld().getEntitiesByType(ENEMY).isEmpty()"]
    AllDefeated --> AdvanceScroll["tween camera viewport X\nto next area boundary\n(locked until enemies cleared)"]
    AdvanceScroll --> SpawnNextGroup["spawn next enemy group\nfrom spawn markers in Tiled"]
    SpawnNextGroup --> StageEnd["if no more groups: stage clear!"]
```

## Melee Combat System

```mermaid
flowchart TD
    AttackKey["attack key"] --> SpawnHitbox["spawn hitbox entity:\n  position = player.pos + facingOffset(range)\n  size = attack hitbox dimensions\n  type = PLAYER_HITBOX\n  sensor body"]
    SpawnHitbox --> HitDetect["onCollisionBegin PLAYER_HITBOX + ENEMY"]
    HitDetect --> Damage["enemy.takeDamage(attackDamage)"]
    HitDetect --> Knockback["enemy.getPhysics().applyLinearImpulse(\n  attackDirection × knockbackForce\n)"]
    HitDetect --> HitStop["both entities freeze for 3 frames\n(hitstop — adds impact weight)"]
    SpawnHitbox --> Expire["ExpireCleanComponent(millis(120))"]
```

## Combo Counter

```mermaid
flowchart LR
    HitLands["any enemy hit lands"] --> IncrementCombo["comboCount++\nshow combo text with scale anim\nreset comboTimer"]
    IncrementCombo --> ComboReward["if comboCount >= 10: bonus score multiplier"]
    ComboTimer["comboTimer counts up\n(2 second window)"] --> |timer expires| ResetCombo["comboCount = 0\nhide combo display"]
```

## Enemy Crowd AI

```mermaid
flowchart TD
    EnemyUpdate["enemy onUpdate"] --> ChooseRole["determine role based on proximity to player:\n  APPROACHING: move toward player\n  CIRCLING: orbit player at safe distance\n  WAITING: stop if too many enemies close"]
    ChooseRole --> Approaching["if role = APPROACHING:\n  pathfind to player\n  if in melee range: attack"]
    ChooseRole --> Circling["if role = CIRCLING:\n  strafe around player\n  wait for gap to attack"]
```

## Knockback and Ground Bounce

```mermaid
flowchart LR
    StrongKnockback["heavy attack\nknockback > threshold"] --> AirLaunch["enemy launched into air\napplyLinearImpulse(dir.x * h, -v)"]
    AirLaunch --> Bounce["on land: bounce (restitution = 0.5)\napply hurt state\nplay land dust effect"]
    Bounce --> Recovery["enemy recovers after bounceStun seconds\nor player can juggle again"]
```
