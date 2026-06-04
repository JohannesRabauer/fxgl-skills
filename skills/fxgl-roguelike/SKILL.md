---
name: fxgl-roguelike
description: >
  Build a roguelike or roguelite game in FXGL — structure runs with a full state reset on
  death, save only meta-progression permanently, generate a new procedural dungeon each
  run with DungeonGenerator, implement weighted RNG loot tables, show 3-choice item offer
  screens, track run statistics (kills, gold, floor depth), gate boss fights at milestone
  floors, implement item synergies where items modify each other's effects, add curse
  mechanics as item downsides, and integrate a prestige/unlock system for permanent cross-
  run improvements. Use this skill when building a roguelike, roguelite, dungeon crawler,
  run-based game, or any permadeath game with procedural content.
triggers:
  - roguelike
  - roguelite
  - permadeath
  - run-based
  - procedural dungeon
  - loot table
  - item offer
  - meta-progression
  - prestige
  - run reset
  - floor depth
  - curse mechanic
  - item synergy
compatibility: >
  Java 17+, FXGL 21.x
category: fxgl/game-types
tags:
  - fxgl
  - java
  - javafx
  - game-types
  - roguelike
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
# FXGL Roguelike / Roguelite

## Save Architecture: Two Files

```java
// Run save (wiped on death) — stored in "run_save"
// Meta save (permanent)    — stored in "meta_save"

// Never mix them. On death:
//   1. Update meta save with run stats
//   2. Delete/reset run save
//   3. Show death screen, offer return to main menu
```

## Run Initialization

```java
@Override
protected void initGameVars(Map<String, Object> vars) {
    // Run-scoped (reset on death)
    vars.put("floor",       1);
    vars.put("gold",        0);
    vars.put("kills",       0);
    vars.put("runScore",    0);
    vars.put("playerHP",    100);
    vars.put("playerMaxHP", 100);
    vars.put("playerATK",   10);
    vars.put("playerDEF",   0);

    // Run item flags
    vars.put("hasFireSword",    false);
    vars.put("hasIceShield",    false);
    vars.put("hasVampirism",    false);
}

private void startNewRun() {
    // Reset all run-scoped variables to defaults
    initGameVars(new HashMap<>());   // conceptually — in practice re-init the game
    set("runSeed", System.currentTimeMillis());
    generateFloor(geti("floor"));
}
```

## Procedural Floor Generation

```java
private long runSeed;

private void generateFloor(int floorNumber) {
    // Clear existing entities
    getGameWorld().getEntitiesCopy().forEach(Entity::removeFromWorld);

    // Seed per-floor: deterministic from run seed + floor
    long floorSeed = runSeed + floorNumber * 7919L;

    DungeonConfig config = new DungeonConfig()
            .gridWidth(40 + floorNumber * 2)
            .gridHeight(40 + floorNumber * 2)
            .minRoomSize(4)
            .maxRoomSize(10 + floorNumber)
            .maxRooms(8 + floorNumber * 2)
            .seed(floorSeed);

    DungeonGenerator gen = new DungeonGenerator(config);
    Grid2D<DungeonCell> dungeon = gen.generate();

    spawnDungeonTiles(dungeon);
    placeEntities(gen.getRooms(), floorNumber);

    // Rebuild A* grid after level load
    astarGrid = AStarGrid.fromWorld(getGameWorld(), TILE, TILE);
}

private void placeEntities(List<Room> rooms, int floor) {
    Random rng = new Random(runSeed + floor * 13L);

    // Player starts in room 0
    Room start = rooms.get(0);
    player.setPosition(start.getCenterX() * TILE, start.getCenterY() * TILE);

    // Boss in last room
    Room boss = rooms.get(rooms.size() - 1);
    spawn("boss_" + getBossTypeForFloor(floor),
            boss.getCenterX() * TILE, boss.getCenterY() * TILE);

    // Enemies and items in middle rooms
    for (int i = 1; i < rooms.size() - 1; i++) {
        Room room = rooms.get(i);
        int enemyCount = rng.nextInt(3) + 1 + floor / 2;
        for (int e = 0; e < enemyCount; e++) {
            spawn("enemy_" + getRandomEnemyType(floor, rng),
                    room.getX() * TILE + rng.nextInt(room.getWidth()) * TILE,
                    room.getY() * TILE + rng.nextInt(room.getHeight()) * TILE);
        }
        // 30% chance for a chest
        if (rng.nextDouble() < 0.3) {
            spawn("chest", room.getCenterX() * TILE, room.getCenterY() * TILE);
        }
    }

    // Stairs to next floor in boss room (unlock after boss dies)
    spawn("stairs_locked", boss.getCenterX() * TILE + TILE, boss.getCenterY() * TILE);
}
```

## Weighted Loot Table

```java
public record LootEntry(String itemId, int weight, Rarity rarity) {}

// Rarity system with weights
public enum Rarity { COMMON(60), UNCOMMON(25), RARE(12), LEGENDARY(3);
    public final int baseWeight;
    Rarity(int w) { this.baseWeight = w; }
}

private final List<LootEntry> lootTable = List.of(
    new LootEntry("health_potion",   50, Rarity.COMMON),
    new LootEntry("sword_iron",      30, Rarity.COMMON),
    new LootEntry("shield_wood",     25, Rarity.COMMON),
    new LootEntry("sword_fire",      15, Rarity.UNCOMMON),
    new LootEntry("boots_speed",     12, Rarity.UNCOMMON),
    new LootEntry("vampire_ring",     8, Rarity.RARE),
    new LootEntry("mirror_shield",    5, Rarity.RARE),
    new LootEntry("dragon_heart",     2, Rarity.LEGENDARY),
    new LootEntry("time_stop_watch",  1, Rarity.LEGENDARY)
);

public String rollLoot(Random rng, int luckBonus) {
    int totalWeight = lootTable.stream().mapToInt(e -> e.weight() + luckBonus).sum();
    int roll = rng.nextInt(totalWeight);

    int cumulative = 0;
    for (LootEntry entry : lootTable) {
        cumulative += entry.weight() + luckBonus;
        if (roll < cumulative) return entry.itemId();
    }
    return lootTable.get(0).itemId();  // fallback
}
```

## Item Offer Screen (Choose 1 of 3)

```java
private void showItemOffer() {
    Random rng = new Random();
    String[] offers = {
        rollLoot(rng, getLuckBonus()),
        rollLoot(rng, getLuckBonus()),
        rollLoot(rng, getLuckBonus())
    };
    // Ensure no duplicates
    Set<String> unique = new HashSet<>();
    for (int i = 0; i < offers.length; i++) {
        while (!unique.add(offers[i])) offers[i] = rollLoot(rng, getLuckBonus());
    }

    getSceneService().pushSubScene(new ItemOfferSubScene(offers, this::applyItem));
}

public class ItemOfferSubScene extends GameSubScene {
    private final String[]        offers;
    private final Consumer<String> onPick;

    @Override
    public void onOpen() {
        HBox cards = new HBox(20);
        for (String itemId : offers) {
            ItemData item = getItemData(itemId);
            VBox card = createItemCard(item);
            card.setOnMouseClicked(e -> {
                onPick.accept(itemId);
                getSceneService().popSubScene();
            });
            cards.getChildren().add(card);
        }
        getRoot().getChildren().add(new VBox(20,
            new Label("Choose an Item"),
            cards
        ));
    }
}
```

## Item Synergy System

```java
// Items check for other items to modify their behavior
public void applyItem(String itemId) {
    switch (itemId) {
        case "sword_fire" -> {
            set("hasFireSword", true);
            inc("playerATK", 5);
            // Synergy: fire sword + ice shield = steam explosion on hit
            if (getb("hasIceShield")) {
                set("hasSteamExplosion", true);
                showSynergyMessage("Fire + Ice = Steam Explosion!");
            }
        }
        case "ice_shield" -> {
            set("hasIceShield", true);
            inc("playerDEF", 8);
            if (getb("hasFireSword")) {
                set("hasSteamExplosion", true);
                showSynergyMessage("Fire + Ice = Steam Explosion!");
            }
        }
        case "vampire_ring" -> {
            set("hasVampirism", true);
            // Vampirism lifesteal is handled in combat damage resolution
        }
        case "cursed_blade" -> {
            // Curse: high damage but player takes 10% damage each floor
            set("hasCursedBlade", true);
            inc("playerATK", 20);
            set("curseDamagePerFloor", 10);
            showCurseWarning("Cursed Blade accepted. You will suffer for its power.");
        }
    }
}

// In combat damage resolution:
private void onPlayerDealsHit(int damage) {
    if (getb("hasVampirism")) {
        int heal = Math.max(1, damage / 5);
        inc("playerHP", heal);
        set("playerHP", Math.min(geti("playerHP"), geti("playerMaxHP")));
    }
    if (getb("hasSteamExplosion")) {
        // Splash damage to nearby enemies
        spawnExplosion(player.getCenter(), 80, damage / 2);
    }
}
```

## Permadeath and Run End

```java
private void onPlayerDeath() {
    getGameController().pauseEngine();

    // Record run stats to permanent meta save
    saveRunStats();
    checkMetaUnlocks();

    // Show death screen
    getDialogService().showMessageBox(
        "You died on floor " + geti("floor") + "\n" +
        "Kills: " + geti("kills") + " | Gold: " + geti("gold"),
        () -> returnToMainMenu()
    );
}

private void saveRunStats() {
    // Load existing meta save or create new
    getSaveLoadService().load("meta_save");
    // Update lifetime stats
    inc("totalKills",  geti("kills"));
    inc("totalGold",   geti("gold"));
    inc("totalRuns",   1);
    inc("metaCurrency", geti("floor") * geti("kills"));

    int deepest = Math.max(geti("deepestFloor"), geti("floor"));
    set("deepestFloor", deepest);
    getSaveLoadService().saveAndForget("meta_save");
}

private void checkMetaUnlocks() {
    if (geti("totalKills") >= 100 && !getb("unlocked_knight")) {
        set("unlocked_knight", true);
        showUnlockMessage("New character unlocked: The Knight!");
    }
}
```

## Floor Descent

```java
// Player steps on stairs:
onCollisionBegin(EntityType.PLAYER, EntityType.STAIRS, (player, stairs) -> {
    if (stairs.getString("state").equals("locked")) return;
    inc("floor", 1);
    play("sounds/stairs.wav");
    generateFloor(geti("floor"));
});

// Unlock stairs when boss dies:
private void onBossDeath(Entity boss) {
    getGameWorld().getEntitiesByType(EntityType.STAIRS_LOCKED)
            .forEach(e -> { e.set("state", "unlocked"); /* update view */ });
    inc("kills", 1);
    spawnLoot(boss.getCenter(), 3);  // boss drops 3 items
    showItemOffer();
}
```

## Gotchas

- **Two separate save files** — run state and meta state must never be in the same `DataFile`.
  Losing a run should never affect meta unlocks, and vice versa. Keep them strictly separated.
- **Floor seed derived from run seed + floor number** — this lets the player return to the
  exact same floor layout if they die and replay (for debugging), while still making each run unique.
- **Item offer RNG must be seeded independently** — if item offers use the same RNG as floor
  generation, opening the offer at different times gives different items. Seed item RNG with
  `(runSeed + floor * 13L)` for consistent per-floor offers.
- **Synergy detection runs at item pickup time** — don't check synergies on every frame.
  Check when a new item is applied and set a boolean flag. Combat code reads the flag.
- **`getGameWorld().getEntitiesCopy()`** when clearing between floors — `getEntities()` returns
  a live list; removing from it while iterating throws `ConcurrentModificationException`.
- **Cursor/Blessed items affect loot table weight** — if items give "+luck", apply that bonus
  to all weights in the loot table roll. Don't increase drop chance only for rare items.
- **Permadeath save cleanup** — after death, explicitly call `getSaveLoadService().deleteSave("run_save")`
  so a game crash can't leave a corrupted run save that bypasses permadeath.
