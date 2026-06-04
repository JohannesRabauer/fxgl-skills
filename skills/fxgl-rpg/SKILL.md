---
name: fxgl-rpg
description: >
  Build an RPG or JRPG in FXGL — define character stats (ATK, DEF, HP, MP, SPD, XP/level),
  implement an experience and leveling system with stat growth, create a turn-based battle
  scene that transitions from overworld exploration, build an equipment system that
  modifies effective stats, implement status effects (poison, stun, burn) that persist
  across turns, define abilities with MP cost and target types, trigger encounters on NPC
  contact or random steps, display a battle menu (Attack/Skill/Item/Run), show loot and XP
  rewards on victory, and save the full party state with SaveLoadService. Use this skill
  when building a classic RPG, JRPG, turn-based adventure, or any game with stats,
  leveling, and structured battle sequences.
triggers:
  - RPG
  - JRPG
  - turn-based battle
  - stats
  - ATK DEF HP MP
  - leveling
  - XP experience
  - equipment
  - status effect
  - ability
  - random encounter
  - battle scene
  - party system
  - overworld
compatibility: >
  Java 17+, FXGL 21.x
category: fxgl/game-types
tags:
  - fxgl
  - java
  - javafx
  - game-types
  - rpg
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
# FXGL RPG / JRPG

## Character Stats Data Class

```java
public class CharacterStats {
    public String name;
    public int level    = 1;
    public int xp       = 0;
    public int xpToNext = 100;

    // Base stats (from level ups + class)
    public int baseHP, maxHP, currentHP;
    public int baseMP, maxMP, currentMP;
    public int baseATK, baseATKBonus;  // bonus from equipment
    public int baseDEF, baseDEFBonus;
    public int baseSPD;

    public int getATK() { return baseATK + baseATKBonus; }
    public int getDEF() { return baseDEF + baseDEFBonus; }

    // Equipment slots
    public Item weapon;
    public Item armor;
    public Item accessory;

    // Active status effects
    public final List<StatusEffect> statusEffects = new ArrayList<>();

    public void gainXP(int amount) {
        xp += amount;
        while (xp >= xpToNext) {
            xp -= xpToNext;
            levelUp();
        }
    }

    private void levelUp() {
        level++;
        xpToNext = (int)(xpToNext * 1.5);
        maxHP    += 15;
        maxMP    += 8;
        baseATK  += 2;
        baseDEF  += 1;
        baseSPD  += 1;
        currentHP = maxHP;   // full heal on level up
        currentMP = maxMP;
    }

    public void equip(Item item) {
        if (item == null) return;
        switch (item.slot) {
            case WEAPON -> {
                if (weapon != null) baseATKBonus -= weapon.atkBonus;
                weapon = item;
                baseATKBonus += item.atkBonus;
            }
            case ARMOR -> {
                if (armor != null) baseDEFBonus -= armor.defBonus;
                armor = item;
                baseDEFBonus += item.defBonus;
            }
        }
    }
}
```

## Status Effect System

```java
public class StatusEffect {
    public final StatusType type;
    public int remainingTurns;
    public final int magnitude;

    public enum StatusType { POISON, BURN, STUN, BLIND, REGEN }

    public StatusEffect(StatusType type, int turns, int magnitude) {
        this.type = type;
        this.remainingTurns = turns;
        this.magnitude = magnitude;
    }

    public void onTurnStart(CharacterStats target) {
        switch (type) {
            case POISON -> target.currentHP = Math.max(1, target.currentHP - magnitude);
            case REGEN  -> target.currentHP = Math.min(target.maxHP, target.currentHP + magnitude);
            case BURN   -> target.currentHP = Math.max(1, target.currentHP - (int)(target.maxHP * 0.08));
        }
        remainingTurns--;
    }

    public boolean isStunned() { return type == StatusType.STUN; }
    public boolean isExpired() { return remainingTurns <= 0; }
}
```

## Turn-Based Battle Scene (GameSubScene)

```java
public class BattleSubScene extends GameSubScene {
    private final CharacterStats player;
    private final List<EnemyStats> enemies;
    private final List<CharacterStats> turnOrder;
    private int turnIndex = 0;

    // Battle UI elements
    private Label statusLabel;
    private VBox  battleMenu;

    @Override
    public void onOpen() {
        buildBattleUI();
        buildTurnOrder();
        processTurn();
    }

    private void buildTurnOrder() {
        // All fighters sorted by SPD (highest goes first)
        turnOrder.clear();
        turnOrder.add(player);
        turnOrder.addAll(enemies);
        turnOrder.sort(Comparator.comparingInt(c -> -c.baseSPD));
    }

    private void processTurn() {
        CharacterStats current = turnOrder.get(turnIndex % turnOrder.size());

        // Apply status effects at start of turn
        current.statusEffects.forEach(se -> se.onTurnStart(current));
        current.statusEffects.removeIf(StatusEffect::isExpired);

        // Check for stun
        boolean stunned = current.statusEffects.stream().anyMatch(StatusEffect::isStunned);

        if (current == player && !stunned) {
            showPlayerMenu();   // player chooses action
        } else if (stunned) {
            statusLabel.setText(current.name + " is stunned and cannot act!");
            advanceTurn();
        } else {
            executeEnemyAI((EnemyStats) current);
        }

        checkBattleEnd();
    }

    private void showPlayerMenu() {
        battleMenu.setVisible(true);
        // Menu: Attack / Skills / Items / Run
    }

    public void onPlayerAttack() {
        battleMenu.setVisible(false);
        EnemyStats target = enemies.get(0);   // or let player pick

        // Damage formula: ATK - DEF (min 1), with random variance
        int damage = Math.max(1,
            player.getATK() - target.baseDEF
            + FXGLMath.random(-player.getATK() / 5, player.getATK() / 5));

        target.currentHP -= damage;
        statusLabel.setText("You dealt " + damage + " damage to " + target.name + "!");
        animateHit(target);

        runOnce(this::advanceTurn, Duration.seconds(1.5));
    }

    public void onPlayerSkill(Skill skill) {
        if (player.currentMP < skill.mpCost) {
            statusLabel.setText("Not enough MP!");
            return;
        }
        player.currentMP -= skill.mpCost;
        skill.execute(player, enemies, this::advanceTurn);
    }

    private void executeEnemyAI(EnemyStats enemy) {
        // Simple AI: attack the player
        int damage = Math.max(1, enemy.baseATK - player.getDEF());
        player.currentHP -= damage;
        statusLabel.setText(enemy.name + " attacks for " + damage + " damage!");
        animateHit(player);
        runOnce(this::advanceTurn, Duration.seconds(1.5));
    }

    private void advanceTurn() {
        turnIndex++;
        processTurn();
    }

    private void checkBattleEnd() {
        if (enemies.stream().allMatch(e -> e.currentHP <= 0)) {
            onVictory();
        } else if (player.currentHP <= 0) {
            onDefeat();
        }
    }

    private void onVictory() {
        int xpGain   = enemies.stream().mapToInt(e -> e.xpReward).sum();
        int goldGain = enemies.stream().mapToInt(e -> e.goldReward).sum();
        player.gainXP(xpGain);
        inc("gold", goldGain);
        // Show victory UI, then close battle scene
        showVictoryScreen(xpGain, goldGain);
        runOnce(() -> getSceneService().popSubScene(), Duration.seconds(3));
    }

    private void onDefeat() {
        showDefeatScreen();
    }

    private void animateHit(CharacterStats target) { /* flash red */ }
    private void buildBattleUI() { /* build JavaFX nodes for battle */ }
}
```

## Encounter Trigger

```java
// Visible enemy contact (overworld):
@Override
protected void initPhysics() {
    onCollisionBegin(EntityType.PLAYER, EntityType.ENEMY_OVERWORLD, (player, enemy) -> {
        String enemyType = enemy.getString("enemyType");
        List<EnemyStats> enemies = createEnemyGroup(enemyType);
        getSceneService().pushSubScene(new BattleSubScene(playerStats, enemies));
    });
}

// Random encounter while walking:
private int stepCount = 0;

@Override
protected void onUpdate(double tpf) {
    // Count steps in overworld
    if (isPlayerMoving()) {
        stepCount++;
        if (stepCount >= 50 && FXGLMath.random() < 0.05) {   // 5% per step after 50 steps
            stepCount = 0;
            triggerRandomEncounter();
        }
    }
}
```

## Ability Definition

```java
public abstract class Skill {
    public final String name;
    public final int    mpCost;
    public final String description;

    public abstract void execute(CharacterStats caster, List<EnemyStats> enemies, Runnable onComplete);
}

public class FireballSkill extends Skill {
    public FireballSkill() {
        super();
        name = "Fireball";
        mpCost = 15;
        description = "Deals fire damage to all enemies.";
    }

    @Override
    public void execute(CharacterStats caster, List<EnemyStats> enemies, Runnable onComplete) {
        int damage = caster.getATK() + 20;
        enemies.forEach(e -> {
            e.currentHP -= Math.max(1, damage - e.baseDEF / 2);
            e.statusEffects.add(new StatusEffect(StatusType.BURN, 3, 5));
        });
        play("sounds/fireball.wav");
        runOnce(onComplete::run, Duration.seconds(1.0));
    }
}
```

## Equipment Shop Integration

```java
// In-town shop (extends economy/shop skill pattern)
Shop<Item> armorShop = new Shop<>();
armorShop.addItem(new TradeItem<>(new Item("Iron Sword",  "icon_sword.png", "+10 ATK") {{
    slot = ItemSlot.WEAPON; atkBonus = 10;
}}, 200, 100));

armorShop.addItem(new TradeItem<>(new Item("Chain Mail", "icon_armor.png", "+15 DEF") {{
    slot = ItemSlot.ARMOR; defBonus = 15;
}}, 300, 150));

// On purchase:
public void buyAndEquip(Item item) {
    playerStats.equip(item);
    updateStatsHUD();
}
```

## Save/Load Full Party State

```java
@Override
public void writeSaveState(DataFile data) {
    Bundle party = data.getBundle("party");
    party.put("playerName",  playerStats.name);
    party.put("level",       playerStats.level);
    party.put("xp",          playerStats.xp);
    party.put("currentHP",   playerStats.currentHP);
    party.put("currentMP",   playerStats.currentMP);
    party.put("gold",        geti("gold"));
    party.put("mapFile",     currentMapFile);
    party.put("playerX",     player.getX());
    party.put("playerY",     player.getY());
    // Serialize equipment as item IDs
    party.put("weaponId",    playerStats.weapon != null ? playerStats.weapon.id : "none");
}

@Override
public void readSaveState(DataFile data) {
    Bundle party = data.getBundle("party");
    playerStats.level     = party.get("level");
    playerStats.xp        = party.get("xp");
    playerStats.currentHP = party.get("currentHP");
    playerStats.currentMP = party.get("currentMP");
    set("gold", party.get("gold"));
    setLevelFromMap(party.get("mapFile"));
    player.setPosition(party.get("playerX"), party.get("playerY"));
    // Re-equip items by ID
    String weaponId = party.get("weaponId");
    if (!weaponId.equals("none")) playerStats.equip(getItemById(weaponId));
}
```

## Gotchas

- **BattleSubScene over the overworld** — use `getSceneService().pushSubScene()` not
  `setLevelFromMap()`. The overworld should resume exactly where it was after the battle ends.
- **`turnOrder` must be rebuilt after enemy deaths** — removing a dead enemy from `turnOrder`
  while iterating throws `ConcurrentModificationException`. Use `removeIf` between turns.
- **Minimum damage of 1** — always `Math.max(1, damage)` after subtracting defense. Zero
  or negative damage from heavy armor frustrates players and stalls fights.
- **Status effect icons in HUD** — display small icons for active status effects per character
  in the battle HUD. Players need to see that poison is ticking.
- **`gainXP` may level up multiple times in one call** — the `while` loop handles this. Don't
  use `if` instead of `while` or the player could lose XP from defeating high-XP enemies.
- **Encounter rate on steps** — check `isPlayerMoving()` not `onUpdate(tpf)` for step counting.
  Ticking encounter rate every frame at 60fps = 60× faster encounter rate than expected.
- **Battle scene must be pausable** — on ALT+TAB or window minimize, the battle should pause.
  Wrap all runOnce timers in a paused check or use `getGameController().pauseEngine()`.
