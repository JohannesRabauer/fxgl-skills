---
name: fxgl-idle-clicker
description: >
  Build an incremental idle or clicker game in FXGL — click for resources, buy auto-producers,
  scale costs exponentially, show passive income in the HUD, unlock upgrades by milestones,
  calculate capped offline progress on load, format very large numbers, and implement prestige
  resets with permanent bonuses.
triggers:
  - idle game
  - clicker
  - incremental
  - passive income
  - offline progress
  - prestige
  - big number formatting
  - auto producer
compatibility: >
  Java 17+, FXGL 21.x. Pairs naturally with fxgl-save-load, fxgl-progression, and fxgl-ui-scenes.
category: fxgl/game-types
tags:
  - fxgl
  - java
  - javafx
  - game-types
  - idle
  - clicker
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
# FXGL Idle / Clicker Game

## Core Variables

```java
@Override
protected void initGameVars(Map<String, Object> vars) {
    vars.put("coins", 0.0);
    vars.put("clickValue", 1.0);
    vars.put("passivePerSecond", 0.0);
    vars.put("prestigeBonus", 1.0);
}
```

Track producers separately in a model rather than scattering values across many globals.

```java
public record Producer(String id, double baseRate, double baseCost, IntegerProperty owned) {
    public double currentCost() {
        return baseCost * Math.pow(1.15, owned.get());
    }
}
```

## Click Loop

```java
private void onMainClick() {
    double gain = getd("clickValue") * getd("prestigeBonus");
    set("coins", getd("coins") + gain);
}
```

Bind the main click to a large button or main resource sprite in `initUI()`.

## Passive Income

```java
private final List<Producer> producers = List.of(
        new Producer("cursor", 0.2, 15, new SimpleIntegerProperty()),
        new Producer("farm", 3.0, 100, new SimpleIntegerProperty()),
        new Producer("factory", 20.0, 750, new SimpleIntegerProperty())
);

@Override
protected void initGame() {
    run(() -> {
        set("coins", getd("coins") + getd("passivePerSecond"));
    }, Duration.seconds(1));
}

private void recalculatePassiveRate() {
    double rate = producers.stream()
            .mapToDouble(p -> p.owned().get() * p.baseRate())
            .sum();

    set("passivePerSecond", rate * getd("prestigeBonus"));
}
```

## Buying Producers

```java
private boolean tryBuyProducer(Producer p) {
    double cost = p.currentCost();
    if (getd("coins") < cost)
        return false;

    set("coins", getd("coins") - cost);
    p.owned().set(p.owned().get() + 1);
    recalculatePassiveRate();
    return true;
}
```

## Offline Progress

Use save data to store the last save timestamp. On load:

```java
private double calculateOfflineGain(Instant lastSaveTime) {
    long elapsedSeconds = Duration.between(lastSaveTime, Instant.now()).getSeconds();
    long capped = Math.min(elapsedSeconds, 8 * 60 * 60);   // 8-hour cap

    return getd("passivePerSecond") * capped * 0.5;        // 50% offline efficiency
}
```

Show the result in a popup after applying it:

```java
double offlineGain = calculateOfflineGain(lastSaveTime);
set("coins", getd("coins") + offlineGain);
showMessage("You earned " + formatBig(offlineGain) + " while away!");
```

## Big Number Formatting

```java
private String formatBig(double value) {
    if (value < 1_000) return String.format("%.0f", value);
    if (value < 1_000_000) return String.format("%.1fK", value / 1_000.0);
    if (value < 1_000_000_000) return String.format("%.1fM", value / 1_000_000.0);
    if (value < 1_000_000_000_000L) return String.format("%.1fB", value / 1_000_000_000.0);
    return String.format("%.1fT", value / 1_000_000_000_000.0);
}
```

## Prestige Reset

```java
private void doPrestige() {
    double coins = getd("coins");
    if (coins < 1_000_000)
        return;

    double bonus = 1.0 + Math.max(0, Math.floor(Math.log10(coins) - 5) * 0.02);
    set("prestigeBonus", getd("prestigeBonus") * bonus);

    set("coins", 0.0);
    set("clickValue", 1.0);

    producers.forEach(p -> p.owned().set(0));
    recalculatePassiveRate();
}
```

## Unlocks and Upgrades

Use milestone predicates instead of hardcoding UI visibility everywhere.

```java
public record Upgrade(String id, double cost, BooleanSupplier isUnlocked, Runnable effect) {}

Upgrade cursorDouble = new Upgrade(
        "cursor-double",
        250,
        () -> producers.get(0).owned().get() >= 10,
        () -> set("clickValue", getd("clickValue") * 2)
);
```

## HUD Pattern

```java
Text coinsText = getUIFactoryService().newText("", Color.GOLD, 28);
coinsText.textProperty().bind(Bindings.createStringBinding(
        () -> "Coins: " + formatBig(getd("coins")),
        getdp("coins")
));

Text incomeText = getUIFactoryService().newText("", Color.LIGHTGREEN, 20);
incomeText.textProperty().bind(Bindings.createStringBinding(
        () -> "Per second: " + formatBig(getd("passivePerSecond")),
        getdp("passivePerSecond")
));
```

## Gotchas

- **Store progression in model objects** — dozens of separate globals become impossible to balance.
- **Always cap offline progress** — uncapped offline gain breaks progression curves.
- **Recalculate passive rate after every buy, upgrade, and prestige** — stale cached values are
  the most common idle-game bug.
- **Double precision is enough early, not forever** — late-game incremental designs may need
  `BigDecimal` or scientific-notation storage if numbers grow extremely large.
