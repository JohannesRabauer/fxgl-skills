# Game Type — Shoot 'em Up (Shmup)

Covers vertical and horizontal scrolling shooters, space shooters, and forced-scroll shoot 'em ups. Player ship fires at waves of enemies, collects power-ups, manages lives.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-SHMUP-1\nForce-scroll background (vertical or horizontal)"]
    Dev --> UC2["UC-SHMUP-2\nSpawn enemy formations by wave"]
    Dev --> UC3["UC-SHMUP-3\nPlayer fires bullets toward scroll direction"]
    Dev --> UC4["UC-SHMUP-4\nEnemy fires bullet patterns at player"]
    Dev --> UC5["UC-SHMUP-5\nPower-up pickups (spread, speed, shield)"]
    Dev --> UC6["UC-SHMUP-6\nPlayer has lives and respawn"]
    Dev --> UC7["UC-SHMUP-7\nBoss fight with multiple phases"]
    Dev --> UC8["UC-SHMUP-8\nScore multiplier for chains"]
    Dev --> UC9["UC-SHMUP-9\nEnemy follows sine-wave flight path"]
    Dev --> UC10["UC-SHMUP-10\nBullet pool for performance"]
```

## World Scroll Pattern

```mermaid
flowchart TD
    BG["Large background texture\n(taller than screen for vertical shmup)"] --> AnimateScroll["animationBuilder()\n.duration(Duration.seconds(20))\n.repeatInfinitely()\n.translate(bgEntity)\n.from(0, 0)\n.to(0, -bgHeight + appHeight)\n.buildAndPlay()"]
    AnimateScroll --> Loop["on reaching bottom:\nreset to top position seamlessly"]
```

## Wave Spawner State Machine

```mermaid
stateDiagram-v2
    [*] --> WaitingForWave
    WaitingForWave --> SpawningFormation : wave timer fires
    SpawningFormation --> WaitingForEnemies : all enemies spawned
    WaitingForEnemies --> WaitingForWave : all enemies defeated
    WaitingForWave --> BossPhase : wave count = maxWaves
    BossPhase --> Victory : boss defeated
```

## Enemy Formation Pattern

```mermaid
flowchart LR
    Formation["List of relative offsets\ne.g. V-formation: (-2,0),(-1,1),(0,2),(1,1),(2,0)"] --> SpawnTimer["runOnce() with staggered delay per enemy"]
    SpawnTimer --> SpawnEnemy["spawn('enemy', formationX + offset.x, ...)"]
    SpawnEnemy --> PathFollow["enemy follows\npre-calculated curved path\nor sine wave motion"]
```

## Bullet Pattern (Fan Spread)

```mermaid
flowchart TD
    EnemyShoot["enemy fire timer"] --> CalculateAngles["for each bullet in spread:\n  angle = baseAngle + i * spreadDelta"]
    CalculateAngles --> SpawnBullets["spawn bullet entities\nwith ProjectileComponent\n(direction = angleToVector(angle))"]
    SpawnBullets --> Expire["bullets expire when off-screen\n(ExpireCleanComponent)"]
```

## Lives and Respawn

```mermaid
flowchart LR
    PlayerHit["player hit by bullet"] --> LoseLife["dec('lives', 1)"]
    LoseLife --> CheckLives["geti('lives') > 0 ?"]
    CheckLives --> |yes| Respawn["brief invincibility timer\nflash effect\nre-enable player"]
    CheckLives --> |no| GameOver["show GAME OVER screen"]
```
