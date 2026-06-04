---
name: fxgl-card-game
description: >
  Build a card game or deckbuilder in FXGL — manage a deck with shuffle and draw, display
  cards in a fanned hand layout with hover effects, implement drag-and-drop or click-to-
  play card interactions, enforce a mana/energy cost system per turn, define card effects
  (damage, heal, draw, buff, shield) with a unified interface, manage discard pile and
  deck reshuffling, implement turn phases (draw/main/end), animate cards flying to the
  play area, handle targeted card plays with enemy selection, and support a deckbuilding
  mode for adding/removing cards. Use this skill when building a card game (Slay the
  Spire, Hearthstone style), deckbuilder, or any game with collectible card mechanics.
triggers:
  - card game
  - deckbuilder
  - deck
  - hand
  - card draw
  - card play
  - mana
  - energy
  - discard pile
  - shuffle
  - card effect
  - turn phases
  - drag card
compatibility: >
  Java 17+, FXGL 21.x
category: fxgl/game-types
tags:
  - fxgl
  - java
  - javafx
  - game-types
  - card
  - game
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
# FXGL Card Game / Deckbuilder

## Card Data Model

```java
public class Card implements Serializable {
    public final String id;
    public final String name;
    public final String description;
    public final String imagePath;        // assets/textures/cards/
    public final int    manaCost;
    public final CardType type;           // ATTACK, SKILL, POWER
    public final TargetType targetType;   // ENEMY, SELF, ALL_ENEMIES, NO_TARGET

    public enum CardType   { ATTACK, SKILL, POWER }
    public enum TargetType { SINGLE_ENEMY, ALL_ENEMIES, SELF, NO_TARGET }

    // Lazy-create card effect via factory method
    public CardEffect createEffect() {
        return switch (id) {
            case "strike"      -> new DamageEffect(6);
            case "bash"        -> new DamageEffect(8, new StatusEffect(VULNERABLE, 2));
            case "defend"      -> new ShieldEffect(5);
            case "fireball"    -> new AoeDamageEffect(10);
            case "draw_two"    -> new DrawEffect(2);
            case "body_slam"   -> new BodySlamEffect();   // damage = current shield
            default            -> new DamageEffect(1);
        };
    }
}
```

## Deck Manager

```java
public class DeckManager {
    private final List<Card> deck    = new ArrayList<>();
    private final List<Card> hand    = new ArrayList<>();
    private final List<Card> discard = new ArrayList<>();

    public DeckManager(List<Card> startingDeck) {
        deck.addAll(startingDeck);
        Collections.shuffle(deck);
    }

    public Card draw() {
        if (deck.isEmpty()) {
            if (discard.isEmpty()) return null;
            deck.addAll(discard);
            discard.clear();
            Collections.shuffle(deck);
            play("sounds/reshuffle.wav");
        }
        Card card = deck.remove(0);
        hand.add(card);
        return card;
    }

    public void drawToMax(int maxHandSize) {
        while (hand.size() < maxHandSize && (!deck.isEmpty() || !discard.isEmpty())) {
            draw();
        }
    }

    public void play(Card card) {
        hand.remove(card);
        discard.add(card);
    }

    public void discardHand() {
        discard.addAll(hand);
        hand.clear();
    }

    public List<Card> getHand() { return Collections.unmodifiableList(hand); }
    public int deckSize()    { return deck.size();    }
    public int discardSize() { return discard.size(); }
}
```

## Hand Display (Fan Layout)

```java
private final List<CardView> cardViews = new ArrayList<>();
private static final double HAND_CENTER_Y = getAppHeight() - 80;
private static final double CARD_SPACING  = 90;
private static final double CARD_FAN_ANGLE = 5;   // degrees tilt per card from center

private void refreshHandDisplay() {
    // Remove old card views
    cardViews.forEach(cv -> removeUINode(cv));
    cardViews.clear();

    List<Card> hand = deckManager.getHand();
    int count = hand.size();
    double startX = getAppWidth() / 2.0 - (count - 1) * CARD_SPACING / 2.0;

    for (int i = 0; i < count; i++) {
        Card card = hand.get(i);
        CardView cv = new CardView(card, i);
        double x     = startX + i * CARD_SPACING;
        double angle = (i - (count - 1) / 2.0) * CARD_FAN_ANGLE;

        cv.setTranslateX(x - 40);  // center card (card width = 80)
        cv.setTranslateY(HAND_CENTER_Y);
        cv.setRotate(angle);

        // Hover: lift card up
        cv.setOnMouseEntered(e -> {
            cv.setTranslateY(HAND_CENTER_Y - 30);
            cv.setScaleX(1.15); cv.setScaleY(1.15);
            cv.toFront();
        });
        cv.setOnMouseExited(e -> {
            cv.setTranslateY(HAND_CENTER_Y);
            cv.setScaleX(1.0); cv.setScaleY(1.0);
        });

        // Click to play
        cv.setOnMouseClicked(e -> onCardClicked(card, cv));

        cardViews.add(cv);
        addUINode(cv);
    }
}

// CardView: a VBox with image, name, cost, description
public class CardView extends VBox {
    public CardView(Card card, int index) {
        setSpacing(4);
        setPrefSize(80, 120);
        setStyle("-fx-background-color: #2a2a3e; -fx-border-color: gold; -fx-border-radius: 5;");

        Label cost = new Label(String.valueOf(card.manaCost));
        cost.setTextFill(Color.CYAN);
        ImageView img = new ImageView(getAssetLoader().loadTexture(card.imagePath).getImage());
        img.setFitWidth(70); img.setFitHeight(60);
        Label name = new Label(card.name);
        name.setTextFill(Color.WHITE);
        name.setFont(Font.font(10));

        getChildren().addAll(cost, img, name);
    }
}
```

## Card Play Logic

```java
private boolean awaitingTarget = false;
private Card    pendingCard;

private void onCardClicked(Card card, CardView cv) {
    if (geti("mana") < card.manaCost) {
        showFloatingText("Not enough energy!", Color.RED, cv.getTranslateX(), HAND_CENTER_Y - 50);
        return;
    }

    if (card.targetType == Card.TargetType.SINGLE_ENEMY) {
        // Enter targeting mode
        awaitingTarget = true;
        pendingCard = card;
        highlightEnemies(true);
    } else {
        // Play immediately
        executeCard(card, null);
    }
}

// In scene mouse handler — enemy click while targeting:
private void onEnemyClicked(Entity enemy) {
    if (!awaitingTarget) return;
    awaitingTarget = false;
    highlightEnemies(false);
    executeCard(pendingCard, enemy);
    pendingCard = null;
}

// Pressing ESC cancels targeting
onKeyDown(KeyCode.ESCAPE, () -> {
    if (awaitingTarget) {
        awaitingTarget = false;
        pendingCard = null;
        highlightEnemies(false);
    }
});

private void executeCard(Card card, Entity target) {
    inc("mana", -card.manaCost);
    card.createEffect().apply(playerStats, target, this);
    deckManager.play(card);

    // Animate card flying toward target
    animateCardPlay(card, target);

    refreshHandDisplay();
    updateManaHUD();
}
```

## Card Effects

```java
public interface CardEffect {
    void apply(CharacterStats caster, Entity target, GameContext ctx);
}

public class DamageEffect implements CardEffect {
    private final int damage;
    private final StatusEffect bonusEffect;  // optional

    public DamageEffect(int damage) { this(damage, null); }
    public DamageEffect(int damage, StatusEffect bonus) {
        this.damage = damage;
        this.bonusEffect = bonus;
    }

    @Override
    public void apply(CharacterStats caster, Entity target, GameContext ctx) {
        EnemyComponent ec = target.getComponent(EnemyComponent.class);
        int finalDamage = damage + caster.getATKBonus();
        // Vulnerable: take 50% more damage
        if (ec.hasStatus(StatusEffect.VULNERABLE)) finalDamage = (int)(finalDamage * 1.5);
        ec.takeDamage(finalDamage);
        if (bonusEffect != null) ec.addStatus(bonusEffect);
    }
}

public class ShieldEffect implements CardEffect {
    private final int shield;
    @Override
    public void apply(CharacterStats caster, Entity target, GameContext ctx) {
        caster.shield += shield + caster.getDefBonus();
        ctx.refreshPlayerHUD();
    }
}

public class DrawEffect implements CardEffect {
    private final int count;
    @Override
    public void apply(CharacterStats caster, Entity target, GameContext ctx) {
        for (int i = 0; i < count; i++) ctx.getDeckManager().draw();
        ctx.refreshHandDisplay();
    }
}
```

## Turn Phases

```java
// PLAYER TURN
private void startPlayerTurn() {
    // Reset shield (Slay the Spire style — shield resets each turn)
    playerStats.shield = 0;

    // Restore mana
    set("mana", MAX_MANA);

    // Draw cards
    deckManager.drawToMax(5);
    refreshHandDisplay();
    updateManaHUD();

    set("playerTurn", true);
}

private void endPlayerTurn() {
    set("playerTurn", false);
    deckManager.discardHand();
    refreshHandDisplay();

    // Enemy turn
    runOnce(this::executeEnemyTurn, Duration.seconds(0.5));
}

private void executeEnemyTurn() {
    enemies.forEach(enemy -> {
        EnemyComponent ec = enemy.getComponent(EnemyComponent.class);
        ec.executeIntent(playerStats);
    });
    // Status effect ticks
    enemies.forEach(e -> e.getComponent(EnemyComponent.class).tickStatusEffects());
    playerStats.statusEffects.forEach(se -> se.onTurnStart(playerStats));
    playerStats.statusEffects.removeIf(StatusEffect::isExpired);

    runOnce(this::startPlayerTurn, Duration.seconds(1.0));
}
```

## Deckbuilding Mode

```java
// Between runs/levels: add/remove cards from master deck
public class DeckBuilderSubScene extends GameSubScene {
    private final List<Card> masterDeck;
    private final List<Card> cardPool;  // available cards

    @Override
    public void onOpen() {
        // Left: current deck, Right: available cards
        ScrollPane deckPane = new ScrollPane(buildDeckGrid(masterDeck));
        ScrollPane poolPane = new ScrollPane(buildCardPool(cardPool));
        HBox layout = new HBox(20, deckPane, poolPane);
        getRoot().getChildren().add(layout);
    }

    private void addCardToDeck(Card card) {
        if (masterDeck.size() >= 30) { showMessage("Deck is full (30 cards max)!"); return; }
        masterDeck.add(card);
        refreshViews();
    }

    private void removeCardFromDeck(Card card) {
        if (masterDeck.size() <= 10) { showMessage("Deck needs at least 10 cards!"); return; }
        masterDeck.remove(card);
        refreshViews();
    }
}
```

## Gotchas

- **Shuffle discard into deck when deck is empty, not before** — shuffling proactively breaks
  deck-cycling strategies that depend on knowing which cards are left. Only shuffle when needed.
- **Card play must remove from hand before executing effect** — a Draw effect adds new cards
  to hand. If the played card is still in hand during execution, it may appear in the draw.
- **Targeting mode must be cancellable** — if a card requiring a target is clicked but no
  valid target exists (all enemies dead), the player must be able to cancel targeting or
  the UI locks up. Always support ESC to cancel.
- **Fan layout recalculates on every hand change** — call `refreshHandDisplay()` after every
  draw, play, or discard operation. The layout is O(n) and fast.
- **Shield (armor) resets per turn** in Slay the Spire style, NOT per combat. Decide this
  upfront — persistent vs per-turn shield dramatically changes card balance.
- **Enemy "intent" display** — show what the enemy plans to do next turn (Attack 12, Buff, Defend).
  This is a core UX feature of the genre. Calculate intent at start of enemy turn.
- **CardView must be added to the UI layer, not the game world** — cards are pure UI elements.
  Do NOT spawn them as game entities; use `addUINode()` / `removeUINode()` for card management.
