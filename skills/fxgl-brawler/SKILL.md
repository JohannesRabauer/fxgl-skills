---
name: fxgl-brawler
description: >
  Build a beat 'em up brawler in FXGL — implement a side-scrolling stage that advances when
  all enemies in a section are defeated, melee hit detection using a short-lived hitbox entity
  in front of the player, knockback physics impulse on hit, hitstop (brief freeze on contact),
  an enemy crowd AI that surrounds the player with defined roles (approaching/circling/waiting),
  a combo counter with timeout, grapple and throw mechanics, food/item pickups that restore
  health, a boss fight at end of stage, and optional co-op with two players.
  Use this skill when building a Streets of Rage style brawler, Final Fight clone, beat 'em up,
  or any game with side-scrolling melee combat against enemy crowds.
  Triggers on: "brawler", "beat em up", "streets of rage", "melee crowd", "knockback",
  "combo counter", "hitstop", "grapple", "stage scrolling", "enemy crowd", "beat-em-up".
compatibility: Java 17+, FXGL 21.x
metadata:
  author: fxgl-skills
  version: "1.0"
  fxgl-version: "21.1"
  category: fxgl/game-types
allowed-tools: Read Write Edit Bash
---

# FXGL Beat 'em Up Brawler

## Stage Architecture

```java
// Stage = sequence of "sections", each with enemy spawns.
// Camera scrolls right when section is cleared.
// Next section spawns when camera reaches the new area.

private int currentSection = 0;
private final List<SectionData> sections = List.of(
    new SectionData(List.of("thug", "thug", "thug"), 400),
    new SectionData(List.of("thug", "heavy", "thug"), 800),
    new SectionData(List.of("heavy", "heavy", "archer"), 1200),
    new SectionData(List.of("boss"), 1600)   // boss section
);

private void checkSectionClear() {
    if (getGameWorld().getEntitiesByType(EntityType.ENEMY).isEmpty()) {
        currentSection++;
        if (currentSection < sections.size()) {
            advanceCameraToSection(currentSection);
        } else {
            showStageComplete();
        }
    }
}

private void advanceCameraToSection(int sectionIdx) {
    SectionData section = sections.get(sectionIdx);
    double targetX = section.cameraX();

    // Animate camera scroll to next area
    animationBuilder()
            .duration(Duration.seconds(1.5))
            .onFinished(() -> spawnSectionEnemies(section))
            .animate(getGameScene().getViewport().xProperty())
            .from(getGameScene().getViewport().getX())
            .to(targetX)
            .buildAndPlay();
}

private void spawnSectionEnemies(SectionData section) {
    double camX = getGameScene().getViewport().getX();
    int i = 0;
    for (String type : section.enemyTypes()) {
        spawn(type, new SpawnData(camX + getAppWidth() - 100 + i * 80.0,
                                   GROUND_Y - 40));
        i++;
    }
}
```

## Player Component

```java
public class BrawlerPlayerComponent extends Component {
    private PhysicsComponent physics;

    private static final double MOVE_SPEED  = 180.0;
    private double attackCooldown = 0;

    @Override
    public void onUpdate(double tpf) {
        if (attackCooldown > 0) attackCooldown -= tpf;

        double dx = 0;
        if (getInput().isHeld(KeyCode.A) || getInput().isHeld(KeyCode.LEFT))  dx -= MOVE_SPEED;
        if (getInput().isHeld(KeyCode.D) || getInput().isHeld(KeyCode.RIGHT)) dx += MOVE_SPEED;

        // Limit horizontal movement to camera bounds
        double camLeft  = getGameScene().getViewport().getX();
        double camRight = camLeft + getAppWidth();
        if ((dx < 0 && entity.getX() <= camLeft + 20) ||
            (dx > 0 && entity.getX() >= camRight - 60)) {
            dx = 0;
        }

        physics.setVelocityX(dx);
        if (dx > 0) entity.setScaleX(1);
        else if (dx < 0) entity.setScaleX(-1);

        // Also allow vertical (depth) movement in brawler field
        double dy = 0;
        if (getInput().isHeld(KeyCode.W) || getInput().isHeld(KeyCode.UP))   dy -= MOVE_SPEED * 0.6;
        if (getInput().isHeld(KeyCode.S) || getInput().isHeld(KeyCode.DOWN)) dy += MOVE_SPEED * 0.6;
        physics.setVelocityY(dy);
    }

    public void attack() {
        if (attackCooldown > 0) return;
        attackCooldown = 0.35;
        spawnAttackHitbox();
        play("sounds/punch.wav");
    }

    private void spawnAttackHitbox() {
        double facingDir = entity.getScaleX();
        double hbX = entity.getX() + (facingDir > 0 ? entity.getWidth() : -60);
        double hbY = entity.getY() + 10;

        entityBuilder()
                .type(EntityType.PLAYER_HITBOX)
                .at(hbX, hbY)
                .bbox(BoundingShape.box(60, 40))
                .with(new CollidableComponent(true))
                .set("damage",    15)
                .set("facingDir", facingDir)
                .with(new ExpireCleanComponent(Duration.millis(100)))
                .buildAndAttach();
    }
}
```

## Hit Detection with Hitstop

```java
@Override
protected void initPhysics() {
    onCollisionBegin(EntityType.PLAYER_HITBOX, EntityType.ENEMY, (hitbox, enemy) -> {
        int damage     = hitbox.getInt("damage");
        double kickDir = hitbox.getDouble("facingDir");

        // Apply damage
        enemy.getComponent(HPComponent.class).damage(damage);

        // Knockback
        PhysicsComponent ep = enemy.getComponent(PhysicsComponent.class);
        ep.setVelocityX(kickDir * 350);
        ep.setVelocityY(-150);  // small upward pop

        // Hitstop: freeze both player and enemy for ~5 frames
        applyHitStop(player, Duration.millis(80));
        applyHitStop(enemy, Duration.millis(80));

        // Combo
        incrementCombo();

        // Check death
        if (enemy.getComponent(HPComponent.class).isDead()) {
            onEnemyDeath(enemy);
        }

        play("sounds/hit.wav");
    });

    onCollisionBegin(EntityType.ENEMY_HITBOX, EntityType.PLAYER, (hitbox, pl) -> {
        pl.getComponent(HPComponent.class).damage(hitbox.getInt("damage"));
        applyHitStop(pl, Duration.millis(100));
        resetCombo();
    });
}

private void applyHitStop(Entity e, Duration duration) {
    e.getComponent(PhysicsComponent.class).setVelocityX(0);
    e.getComponent(PhysicsComponent.class).setVelocityY(0);
    // Pause AI/player component for duration
    e.getComponent(Component.class).pause();
    runOnce(() -> e.getComponent(Component.class).resume(), duration);
}

private void onEnemyDeath(Entity enemy) {
    // Random food drop
    if (FXGLMath.random() < 0.25) {
        spawn("food", enemy.getX(), enemy.getY());
    }
    enemy.removeFromWorld();
    checkSectionClear();
}
```

## Combo Counter

```java
private int    comboCount   = 0;
private double comboTimer   = 0;
private static final double COMBO_TIMEOUT = 2.0;

private void incrementCombo() {
    comboCount++;
    comboTimer = COMBO_TIMEOUT;
    showComboText(comboCount);
}

private void resetCombo() {
    if (comboCount >= 5) {
        // Bonus score for ending a 5+ hit combo
        inc("score", comboCount * 20);
    }
    comboCount = 0;
    hideComboText();
}

@Override
protected void onUpdate(double tpf) {
    if (comboCount > 0) {
        comboTimer -= tpf;
        if (comboTimer <= 0) resetCombo();
    }
    // ... stage scrolling updates ...
}
```

## Enemy Crowd AI

```java
public class BrawlerEnemyComponent extends Component {
    private enum Role { APPROACHING, CIRCLING, WAITING }
    private PhysicsComponent physics;
    private Role role = Role.APPROACHING;
    private double attackTimer = 0;
    private double circleAngle = FXGLMath.random(0, 360);

    @Override
    public void onUpdate(double tpf) {
        Entity pl = getGameWorld().getSingleton(EntityType.PLAYER);
        double dist = entity.getCenter().distance(pl.getCenter());

        // Assign role based on how many enemies are already close
        long closeEnemies = getGameWorld().getEntitiesByType(EntityType.ENEMY)
                .stream()
                .filter(e -> e != entity && e.getCenter().distance(pl.getCenter()) < 80)
                .count();

        role = (closeEnemies >= 2) ? Role.CIRCLING
             : (dist > 200)        ? Role.APPROACHING
             :                       Role.APPROACHING;

        switch (role) {
            case APPROACHING -> {
                Point2D dir = pl.getCenter().subtract(entity.getCenter()).normalize();
                physics.setVelocityX(dir.getX() * 100);
                physics.setVelocityY(dir.getY() * 60);

                if (dist < 70) {
                    attackTimer += tpf;
                    if (attackTimer >= 1.5) {
                        attackTimer = 0;
                        performAttack();
                    }
                }
            }
            case CIRCLING -> {
                // Orbit player
                circleAngle += 60 * tpf;
                double rad = Math.toRadians(circleAngle);
                double targetX = pl.getX() + Math.cos(rad) * 100;
                double targetY = pl.getY() + Math.sin(rad) * 60;
                Point2D toTarget = new Point2D(targetX - entity.getX(), targetY - entity.getY()).normalize();
                physics.setVelocityX(toTarget.getX() * 80);
                physics.setVelocityY(toTarget.getY() * 50);
            }
        }
    }

    private void performAttack() {
        entityBuilder()
                .type(EntityType.ENEMY_HITBOX)
                .at(entity.getCenter().getX(), entity.getCenter().getY())
                .bbox(BoundingShape.box(50, 30))
                .with(new CollidableComponent(true))
                .set("damage", 8)
                .with(new ExpireCleanComponent(Duration.millis(120)))
                .buildAndAttach();
        play("sounds/enemy_attack.wav");
    }
}
```

## Food Pickup (Health Restore)

```java
@Spawns("food")
public Entity newFood(SpawnData data) {
    return entityBuilder(data)
            .type(EntityType.FOOD)
            .view("food_apple.png")
            .bbox(BoundingShape.box(32, 32))
            .with(new CollidableComponent(true))
            .build();
}

@Override
protected void initPhysics() {
    onCollisionBegin(EntityType.PLAYER, EntityType.FOOD, (pl, food) -> {
        int heal = 30;
        HPComponent hp = pl.getComponent(HPComponent.class);
        hp.setValue(Math.min(hp.getMaxValue(), hp.getValue() + heal));
        food.removeFromWorld();
        play("sounds/eat.wav");
    });
}
```

## Gotchas

- **Brawler uses both X and Y movement** — unlike top-down games (no gravity), brawlers move
  on a 2D plane: left/right for horizontal and up/down for depth (Y). Gravity is disabled.
  The player can only fall during knockback (brief Y impulse) but returns to the ground plane.
- **Camera lock during enemy wave** — prevent the camera from scrolling past the next section
  boundary until all enemies are cleared. Use viewport bounds clamping.
- **Hitstop via component pause** — `Component.pause()` stops `onUpdate` for that component.
  This is the cleanest way to freeze entity behavior briefly. Resume with `Component.resume()`.
- **`checkSectionClear()` after EACH enemy death** — don't defer to a timer. The last enemy
  in a section often dies mid-animation; check immediately when `removeFromWorld()` is called.
- **Co-op requires 2 hitbox types** — in 2-player, both players need their own hitbox types
  (PLAYER1_HITBOX, PLAYER2_HITBOX) to avoid friendly fire. Enemies share one ENEMY_HITBOX type.
- **Combo reset on player hit** — getting hit resets the combo, which feels punishing but is
  genre-standard. Consider a 0.5-second grace window after the hit before resetting.
- **Food spawns from enemy center** — always spawn food at the dead enemy's center position,
  not at `getX(), getY()` (top-left). Use `enemy.getCenter()` to avoid food appearing off-center.
