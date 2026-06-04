# Use Cases — Inventory & Trade / Shop

Covers the Inventory system, InventoryListView, Trade system, Shop, ShopView, and the arcade shop pattern.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])
    Player([Player])
    NPC([NPC / Vendor])

    Dev --> UC1["UC-ECO-1\nCreate inventory and add items"]
    Dev --> UC2["UC-ECO-2\nRemove / consume item"]
    Dev --> UC3["UC-ECO-3\nCheck if item exists in inventory"]
    Dev --> UC4["UC-ECO-4\nDisplay inventory as list view"]
    Dev --> UC5["UC-ECO-5\nCreate shop with items for sale"]
    Dev --> UC6["UC-ECO-6\nOpen trade UI (player ↔ shop)"]
    Dev --> UC7["UC-ECO-7\nBuy item (deduct currency)"]
    Dev --> UC8["UC-ECO-8\nSell item back to shop"]
    Dev --> UC9["UC-ECO-9\nReact to inventory change event"]
    Dev --> UC10["UC-ECO-10\nItem stack management"]

    Player --> UC4
    Player --> UC6
    Player --> UC7
    Player --> UC8
    NPC --> UC5
```

## Inventory System API

```mermaid
flowchart TD
    Create2["new Inventory<Item>()"] --> Add2["inventory.add(item)\nreturns true if added"]
    Create2 --> Remove2["inventory.remove(item)\nreturns true if removed"]
    Create2 --> Contains["inventory.contains(item)"]
    Create2 --> Size["inventory.size()"]
    Create2 --> Items["inventory.getItems() → ObservableList"]
    Items --> Reactive["binds to ListView / InventoryListView automatically"]
```

## InventoryListView Use Case

```mermaid
flowchart LR
    Inv["Inventory<Weapon> playerInv"] --> ILV["new InventoryListView<>(playerInv)"]
    ILV --> Add3["addUINode(inventoryListView, x, y)"]
    ILV --> Select["inventoryListView.getSelectionModel()\n.selectedItemProperty()\n.addListener(...)"]
    ILV --> Cell["inventoryListView.setCellFactory(...)\ncustomise item rendering"]
```

## Trade System Architecture

```mermaid
graph TD
    Trade["Trade System"] --> Shop3["Shop<T>\n• holds TradeItem list\n• manages buy/sell logic"]
    Trade --> TradeItem2["TradeItem<T>\n• item reference\n• buy price\n• sell price"]
    Trade --> ShopView2["ShopView\n• renders available items\n• shows player gold"]
    Trade --> TradeListView["TradeListView\n• list of buyable items"]
    Trade --> TradeView2["TradeView\n• split view: player inv + shop inv"]
```

## Trade / Buy Flow

```mermaid
sequenceDiagram
    participant Player3 as Player
    participant ShopScene
    participant Shop4 as Shop
    participant Inventory2 as Player Inventory

    Player3->>ShopScene: open shop (NPC collision)
    ShopScene->>Shop4: getItems() → display available items
    Player3->>ShopScene: select item "Sword" (price: 50g)
    ShopScene->>Shop4: buy(player, item)
    Shop4->>Shop4: check player gold >= 50
    Shop4->>Inventory2: add("Sword")
    Shop4->>Shop4: deduct 50g from player
    ShopScene-->>Player3: updated inventory displayed
```

## Sell Flow

```mermaid
sequenceDiagram
    participant Player3 as Player
    participant ShopScene
    participant Shop4 as Shop
    participant Inventory2 as Player Inventory

    Player3->>ShopScene: select owned item "Potion" to sell
    ShopScene->>Shop4: sell(player, item)
    Shop4->>Inventory2: remove("Potion")
    Shop4->>Shop4: add sell price gold to player
    ShopScene-->>Player3: updated gold & inventory shown
```

## Item Stack Management

```mermaid
flowchart LR
    Inv2["Inventory with capacity"] --> Max["inventory.setMaxCapacity(20)"]
    Inv2 --> Full["inventory.isFull()"]
    Inv2 --> Stack["TradeItem.quantity for stackable items"]
    Stack --> Add4["inventory.incrementQuantity(item, amount)"]
    Stack --> Remove3["inventory.decrementQuantity(item, amount)"]
```

## Arcade Shop Pattern (special layout)

```mermaid
flowchart TD
    Arcade["ArcadeShopSample pattern"] --> ShopState["ShopState holds\n• available upgrades\n• player credits"]
    ShopState --> ArcadeView["Custom SubScene with\ngrid of purchasable power-ups"] --> Buy2["on buy: deduct credits\napply upgrade to player entity"]
    ArcadeView --> Close2["close SubScene\nresume game"]
```
