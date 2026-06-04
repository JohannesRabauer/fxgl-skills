# Game Type — Card Game / Deckbuilder

Covers card-based games (Slay the Spire, Hearthstone style). Deck management, hand display, drag-to-play, mana economy, turn structure, card effects.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-CARD-1\nDeck shuffle and card draw"]
    Dev --> UC2["UC-CARD-2\nHand display (fanned, interactive cards)"]
    Dev --> UC3["UC-CARD-3\nDrag-and-drop or click to play card"]
    Dev --> UC4["UC-CARD-4\nMana/energy system per turn"]
    Dev --> UC5["UC-CARD-5\nCard effects (damage, heal, buff, draw)"]
    Dev --> UC6["UC-CARD-6\nDiscard pile and deck exhaustion"]
    Dev --> UC7["UC-CARD-7\nTurn phases (draw → main → end)"]
    Dev --> UC8["UC-CARD-8\nAnimated card play (fly to field)"]
    Dev --> UC9["UC-CARD-9\nCard targeting (choose enemy or ally)"]
    Dev --> UC10["UC-CARD-10\nDeckbuilding (add/remove cards between runs)"]
```

## Turn Structure State Machine

```mermaid
stateDiagram-v2
    [*] --> PlayerTurn
    PlayerTurn --> DrawPhase : turn starts
    DrawPhase --> MainPhase : cards drawn (default 5)
    MainPhase --> EndPhase : player clicks End Turn
    EndPhase --> EnemyTurn : discard hand, refill mana
    EnemyTurn --> PlayerTurn : enemy actions resolve

    DrawPhase : draw up to hand size from deck
    MainPhase : play cards (costs mana), targeting
    EndPhase : unused mana lost (unless Overflow keyword)
    EnemyTurn : enemies reveal intent, execute actions
```

## Deck and Hand

```mermaid
flowchart TD
    Deck["Collections.shuffle(deck)"] --> DrawCard["card = deck.remove(0)"]
    DrawCard --> Hand["hand.add(card)\ndisplay card in hand HUD"]
    DrawCard --> EmptyDeck["if deck is empty:\n  deck = new ArrayList(discardPile)\n  discardPile.clear()\n  shuffle(deck)"]
    PlayCard["player plays card"] --> Hand2["hand.remove(card)\ndiscardPile.add(card)"]
```

## Hand Display (Fan Layout)

```mermaid
flowchart LR
    HandList["List<Card> hand"] --> SpreadLayout["spread cards across bottom:\n  xStart = center - (hand.size() * cardSpacing / 2)\n  for i: x = xStart + i * cardSpacing\n  angle = (i - hand.size()/2) * 5 degrees"]
    SpreadLayout --> HoverEffect["on mouse hover:\n  card lifts up 30px\n  scale 1.1x\n  bring to front z-order"]
    HoverEffect --> ClickOrDrag["click → auto-play to field\nOR drag → drop on valid target"]
```

## Card Targeting

```mermaid
flowchart TD
    PlayTargetedCard["player plays card\nwith targetType = ENEMY"] --> EnterTargetMode["highlight valid target entities\n(enemies glow red)"]
    EnterTargetMode --> PlayerClicks["player clicks target entity"]
    PlayerClicks --> ExecuteEffect["card.effect.apply(caster, target)\ndiscardPile.add(card)"]
    PlayerClicks --> |right-click or Escape| CancelTarget["cancel targeting\nreturn card to hand"]
```

## Card Effects Pattern

```mermaid
graph TD
    Card["Card"] --> Effect["CardEffect interface\nvoid apply(Entity caster, Entity target)"]
    Effect --> DamageEffect["DamageEffect(amount)\ntarget.getComponent(HPComponent.class).damage(amount)"]
    Effect --> HealEffect["HealEffect(amount)\ncaster.getComponent(HPComponent.class).heal(amount)"]
    Effect --> DrawEffect["DrawEffect(count)\nfor i: drawCard()"]
    Effect --> BuffEffect["BuffEffect(stat, amount, turns)\ntarget status effect for N turns"]
    Effect --> ShieldEffect["ShieldEffect(amount)\ngain armor: blocks next N damage"]
```
