---
name: fxgl-fighting
description: >
  Build a fighting game in FXGL — implement a character state machine
  (idle/walk/jump/attack/ hurt/block/knockdown), separate hitbox and hurtbox entities for
  accurate hit detection, an input buffer for combo and special move recognition, frame-
  window management (startup/ active/recovery frames), health bar HUD with chip-damage
  animation, knockback on hit, block mechanics with chip damage, round timer and round
  structure, and combo counter display. Use this skill when building a 1v1 or 2v2 fighting
  game, a boss fight with frame-data mechanics, or any game requiring precise
  hitbox/hurtbox distinction.
triggers:
  - fighting game
  - hitbox hurtbox
  - combo
  - frame data
  - input buffer
  - knockback
  - block
  - health bar
  - round system
  - startup active recovery
  - FSM fighter
  - character state machine
  - special move
compatibility: >
  Java 17+, FXGL 21.x
category: fxgl/game-types
tags:
  - fxgl
  - java
  - javafx
  - game-types
  - fighting
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
# FXGL Fighting Game

## Fighter State Machine

```java
public enum FighterState {
    IDLE, WALKING_FORWARD, WALKING_BACK,
    JUMPING, FALLING,
    ATTACK_LIGHT, ATTACK_HEAVY, ATTACK_SPECIAL,
    BLOCKING,
    HURT, KNOCKBACK, KNOCKED_DOWN, RISING
}

public class FighterComponent extends Component {
    private PhysicsComponent  physics;
    private FighterState      state    = FighterState.IDLE;
    private double            stateTimer = 0;
    private int               hitPoints;
    private boolean           isGrounded;
    private boolean           facingRight;

    // Input buffer: stores recent inputs with timestamps
    private final Deque<InputEvent> inputBuffer = new ArrayDeque<>();
    private static final double BUFFER_WINDOW = 0.4; // seconds

    public record InputEvent(String key, double timestamp) {}

    @Override
    public void onUpdate(double tpf) {
        stateTimer += tpf;
        pruneInputBuffer();
        processState(tpf);
    }

    private void processState(double tpf) {
        switch (state) {
            case IDLE          -> handleIdle(tpf);
            case WALKING_FORWARD, WALKING_BACK -> handleWalking(tpf);
            case JUMPING       -> handleJumping(tpf);
            case HURT          -> handleHurt(tpf);
            case KNOCKED_DOWN  -> handleKnockedDown(tpf);
            case RISING        -> handleRising(tpf);
            case ATTACK_LIGHT  -> handleAttack("light",  0.08, 0.10, 0.25, tpf);
            case ATTACK_HEAVY  -> handleAttack("heavy",  0.12, 0.18, 0.40, tpf);
            case BLOCKING      -> handleBlocking();
        }
    }

    // Total attack duration = startup + active + recovery
    private void handleAttack(String type, double startup, double active, double recovery, double tpf) {
        if (stateTimer < startup) {
            // Startup: no hitbox yet
        } else if (stateTimer < startup + active) {
            // Active: activate hitbox if not yet done
            activateHitbox(type, startup);
        } else if (stateTimer < startup + active + recovery) {
            // Recovery: deactivate hitbox
            deactivateHitbox();
        } else {
            // Attack complete
            deactivateHitbox();
            transitionTo(FighterState.IDLE);
        }
    }

    public void transitionTo(FighterState newState) {
        state = newState;
        stateTimer = 0;
    }

    private void pruneInputBuffer() {
        double now = System.currentTimeMillis() / 1000.0;
        inputBuffer.removeIf(e -> now - e.timestamp() > BUFFER_WINDOW);
    }

    public void bufferInput(String key) {
        double now = System.currentTimeMillis() / 1000.0;
        inputBuffer.addLast(new InputEvent(key, now));
        checkSpecialMoves();
    }

    // Example: DOWN + DOWN-FORWARD + FORWARD + ATTACK = Hadouken
    private void checkSpecialMoves() {
        List<String> keys = inputBuffer.stream().map(InputEvent::key).toList();
        if (containsSequence(keys, "DOWN", "FORWARD", "ATTACK_LIGHT")) {
            inputBuffer.clear();
            fireProjectile();
        }
    }

    private boolean containsSequence(List<String> buffer, String... sequence) {
        int si = 0;
        for (String key : buffer) {
            if (key.equals(sequence[si])) si++;
            if (si == sequence.length) return true;
        }
        return false;
    }

    private boolean hitboxActive = false;
    private Entity  hitboxEntity;

    private void activateHitbox(String type, double startup) {
        if (hitboxActive) return;
        hitboxActive = true;

        double w = type.equals("heavy") ? 80 : 60;
        double h = type.equals("heavy") ? 50 : 40;
        double offsetX = facingRight ? 48 : -(48 + w);

        hitboxEntity = entityBuilder()
                .type(EntityType.HITBOX)
                .at(entity.getX() + offsetX, entity.getCenter().getY() - h / 2)
                .bbox(BoundingShape.box(w, h))
                .with(new CollidableComponent(true))
                .set("owner",  entity)
                .set("damage", type.equals("heavy") ? 20 : 12)
                .buildAndAttach();
    }

    private void deactivateHitbox() {
        if (!hitboxActive) return;
        hitboxActive = false;
        if (hitboxEntity != null && hitboxEntity.isActive()) {
            hitboxEntity.removeFromWorld();
        }
    }

    public void receiveHit(int damage, boolean isBlocking) {
        if (isBlocking) {
            // Chip damage: 20% of full damage through block
            hitPoints -= (int)(damage * 0.2);
            transitionTo(FighterState.IDLE);
        } else {
            hitPoints -= damage;
            if (hitPoints <= 0) {
                hitPoints = 0;
                transitionTo(FighterState.KNOCKED_DOWN);
            } else {
                transitionTo(FighterState.HURT);
            }
        }
    }

    private void handleIdle(double tpf) { /* check for input, idle animation */ }
    private void handleWalking(double tpf) { /* move forward/back */ }
    private void handleJumping(double tpf) { /* arc physics */ }
    private void handleHurt(double tpf) {
        if (stateTimer >= 0.3) transitionTo(FighterState.IDLE);
    }
    private void handleKnockedDown(double tpf) {
        if (stateTimer >= 1.5) transitionTo(FighterState.RISING);
    }
    private void handleRising(double tpf) {
        if (stateTimer >= 0.5) transitionTo(FighterState.IDLE);
        // Rising is invincible
    }
    private void handleBlocking() { /* hold block state */ }
    private void activateHitbox(String s) {}
    private void fireProjectile() {}
}
```

## Hitbox / Hurtbox Collision

```java
@Override
protected void initPhysics() {
    onCollisionBegin(EntityType.HITBOX, EntityType.HURTBOX, (hitbox, hurtbox) -> {
        Entity attacker = hitbox.getObject("owner");
        Entity defender = hurtbox.getObject("owner");

        // Prevent self-hit
        if (attacker == defender) return;

        int damage   = hitbox.getInt("damage");
        boolean blocking = defender.getComponent(FighterComponent.class).isBlocking();

        defender.getComponent(FighterComponent.class).receiveHit(damage, blocking);

        // Knockback
        FighterComponent ac = attacker.getComponent(FighterComponent.class);
        double kbDir = ac.isFacingRight() ? 1 : -1;
        defender.getComponent(PhysicsComponent.class)
                .setVelocityX(kbDir * (blocking ? 150 : 400));

        // Hit stop: freeze both for 3 frames
        attacker.getComponent(FighterComponent.class).applyHitStop(0.05);
        defender.getComponent(FighterComponent.class).applyHitStop(0.05);

        play("sounds/hit_" + (blocking ? "block" : "flesh") + ".wav");
    });
}
```

## Health Bar HUD with Chip Damage Animation

```java
// Dual-bar system: current HP (red) and chip damage lag (grey)
public class HealthBarComponent extends Component {
    private final int     maxHP;
    private double        displayHP;     // smoothly animated
    private int           currentHP;

    private Rectangle redBar;
    private Rectangle greyBar;

    public HealthBarComponent(int maxHP) {
        this.maxHP = maxHP;
        this.displayHP = maxHP;
        this.currentHP = maxHP;
    }

    public void damage(int amount) {
        currentHP = Math.max(0, currentHP - amount);
    }

    @Override
    public void onUpdate(double tpf) {
        // Instantly snap red bar
        double redWidth = 200.0 * currentHP / maxHP;
        redBar.setWidth(Math.max(0, redWidth));

        // Grey bar smoothly follows (chip damage visual)
        if (displayHP > currentHP) {
            displayHP = Math.max(currentHP, displayHP - maxHP * 0.3 * tpf);
        } else {
            displayHP = currentHP;
        }
        double greyWidth = 200.0 * displayHP / maxHP;
        greyBar.setWidth(Math.max(0, greyWidth));
    }

    public void initUI(HBox container) {
        StackPane bars = new StackPane();
        greyBar = new Rectangle(200, 20, Color.GREY);
        redBar  = new Rectangle(200, 20, Color.RED);
        StackPane.setAlignment(greyBar, javafx.geometry.Pos.CENTER_LEFT);
        StackPane.setAlignment(redBar,  javafx.geometry.Pos.CENTER_LEFT);
        bars.getChildren().addAll(greyBar, redBar);
        container.getChildren().add(bars);
    }
}
```

## Round System

```java
@Override
protected void initGameVars(Map<String, Object> vars) {
    vars.put("roundTimer",  99);
    vars.put("p1Rounds",    0);
    vars.put("p2Rounds",    0);
    vars.put("roundActive", false);
}

private void startRound() {
    // Reset fighters
    p1.getComponent(FighterComponent.class).reset(100);
    p2.getComponent(FighterComponent.class).reset(100);
    set("roundTimer", 99);
    set("roundActive", true);
    showMessage("FIGHT!");
}

private void onRoundEnd(String winner) {
    set("roundActive", false);
    inc(winner + "Rounds", 1);
    showMessage(winner.toUpperCase() + " WINS!");
    if (geti("p1Rounds") >= 2) showGameOver("Player 1 wins the match!");
    else if (geti("p2Rounds") >= 2) showGameOver("Player 2 wins the match!");
    else runOnce(this::startRound, Duration.seconds(2));
}

@Override
protected void onUpdate(double tpf) {
    if (!getb("roundActive")) return;

    // Countdown timer
    if (getd("roundTimer") > 0) {
        inc("roundTimer", -tpf);
        if (getd("roundTimer") <= 0) {
            // Time up — higher HP wins
            String winner = p1HP > p2HP ? "p1" : "p2";
            onRoundEnd(winner);
        }
    }
}
```

## Input Binding (Two Players)

```java
@Override
protected void initInput() {
    // Player 1 — WASD + GH
    onKeyDown(KeyCode.G, () -> p1Fighter.bufferInput("ATTACK_LIGHT"));
    onKeyDown(KeyCode.H, () -> p1Fighter.bufferInput("ATTACK_HEAVY"));
    onKey(KeyCode.A,     () -> p1Fighter.bufferInput("BACK"));
    onKey(KeyCode.D,     () -> p1Fighter.bufferInput("FORWARD"));

    // Player 2 — Arrow keys + numpad
    onKeyDown(KeyCode.NUMPAD1, () -> p2Fighter.bufferInput("ATTACK_LIGHT"));
    onKeyDown(KeyCode.NUMPAD2, () -> p2Fighter.bufferInput("ATTACK_HEAVY"));
}
```

## Gotchas

- **Hitbox / hurtbox must be SEPARATE entities** — you cannot use the fighter entity's own
  bbox for both hitting and being hit. The hitbox entity is owned by the attacker; the hurtbox
  is always active on each fighter.
- **Frame data must be in seconds, not frames** — FXGL uses `tpf` (seconds per frame) not frame
  counts. Convert frame counts at 60fps: 6 frames = 0.1 seconds.
- **Hit stop (freeze) implementation** — set a `hitStopRemaining` timer in the component; in
  `onUpdate`, skip all logic while `hitStopRemaining > 0`. This creates the crucial "impact weight" feel.
- **Input buffer is not the same as key held** — `onKeyDown` fires once per press; `onKey` fires
  every frame held. For fighting game inputs, use `onKeyDown` to buffer single presses.
- **Block must be active before hit** — if the player presses block the same frame a hit lands,
  determine based on state at collision time, not at key press time.
- **Anti-corner-push** — when both fighters reach the screen edge, the pusher should stop moving
  but the pushee still gets knocked back. Check world bounds and apply only the correct velocity.
- **Combo counter timeout** — reset combo counter if a full second passes without another hit.
  This prevents very slow "combos" from inflating the display.
