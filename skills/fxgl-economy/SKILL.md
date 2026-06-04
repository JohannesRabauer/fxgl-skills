---
name: fxgl-economy
description: >
  Implement inventory and trade/shop systems in FXGL — create typed Inventory objects,
  add/remove/query items, display inventory via InventoryListView, build a Shop with TradeItem
  buy/sell prices, open a ShopView or TradeView UI, implement buy and sell transactions,
  manage item stacks and capacity, and wire the shop to NPC collisions. Use this skill when
  adding an inventory system, item collection, a merchant shop, an upgrade store, or any
  economy mechanic.
  Triggers on: "inventory", "shop", "item", "TradeItem", "buy", "sell", "InventoryListView",
  "ShopView", "trade", "merchant", "store", "collectible item", "economy".
compatibility: Java 17+, FXGL 21.x
metadata:
  author: fxgl-skills
  version: "1.0"
  fxgl-version: "21.1"
  category: fxgl/economy
allowed-tools: Read Write Edit Bash
---

# FXGL Inventory & Trade System

## Define Your Item Type

```java
// Item must implement Serializable for save/load support
public class Item implements Serializable {
    private final String name;
    private final String iconPath;   // assets/textures/items/
    private final String description;
    private int quantity;

    public Item(String name, String iconPath, String description) {
        this.name = name;
        this.iconPath = iconPath;
        this.description = description;
        this.quantity = 1;
    }

    // getters + setters
    public String getName() { return name; }
    public String getIconPath() { return iconPath; }
    public String getDescription() { return description; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int q) { this.quantity = q; }

    @Override public String toString() { return name; }  // used by default list cell
}
```

## Inventory API

```java
// Create
Inventory<Item> playerInventory = new Inventory<>(20);  // capacity = 20 slots

// Add item (returns false if inventory is full)
boolean added = playerInventory.add(new Item("Sword", "sword.png", "A sharp blade."));

// Remove
boolean removed = playerInventory.remove(swordItem);

// Query
boolean hasSword  = playerInventory.contains(swordItem);
int     slotCount = playerInventory.size();
boolean isFull    = playerInventory.isFull();
ObservableList<Item> items = playerInventory.getItems();  // live observable list

// Max capacity
playerInventory.setMaxCapacity(30);
int max = playerInventory.getMaxCapacity();

// Find item by name
Optional<Item> found = playerInventory.getItems().stream()
        .filter(i -> i.getName().equals("Potion"))
        .findFirst();

// Iterate
playerInventory.getItems().forEach(item -> System.out.println(item.getName()));
```

## InventoryListView — Display the Inventory

```java
InventoryListView<Item> listView = new InventoryListView<>(playerInventory);

// Custom cell rendering
listView.setCellFactory(lv -> new ListCell<>() {
    @Override protected void updateItem(Item item, boolean empty) {
        super.updateItem(item, empty);
        if (empty || item == null) {
            setGraphic(null);
            setText(null);
        } else {
            ImageView icon = new ImageView(getAssetLoader().loadTexture(item.getIconPath()).getImage());
            icon.setFitWidth(32); icon.setFitHeight(32);
            Label name = new Label(item.getName() + (item.getQuantity() > 1 ? " x" + item.getQuantity() : ""));
            name.setTextFill(Color.WHITE);
            setGraphic(new HBox(10, icon, name));
        }
    }
});

// Selection listener
listView.getSelectionModel().selectedItemProperty().addListener((obs, old, selected) -> {
    if (selected != null) showItemDetails(selected);
});

// Add to HUD or SubScene
addUINode(listView, 50, 50);
```

## Shop — Define Items for Sale

```java
// Build the shop
Shop<Item> merchantShop = new Shop<>();

// TradeItem(item, buyPrice, sellPrice)
merchantShop.addItem(new TradeItem<>(new Item("Sword",  "sword.png",  "Sharp."), 200, 100));
merchantShop.addItem(new TradeItem<>(new Item("Shield", "shield.png", "Sturdy."), 150,  75));
merchantShop.addItem(new TradeItem<>(new Item("Potion", "potion.png", "Heals."),   50,  20));
```

## Trade Logic — Buy & Sell

```java
// BUY: player purchases from shop
public boolean buyItem(TradeItem<Item> tradeItem) {
    int price = tradeItem.getBuyPrice();
    if (geti("gold") < price) {
        showMessage("Not enough gold!");
        return false;
    }
    if (playerInventory.isFull()) {
        showMessage("Inventory full!");
        return false;
    }
    inc("gold", -price);
    playerInventory.add(tradeItem.getItem());
    play("sounds/purchase.wav");
    return true;
}

// SELL: player sells to shop
public boolean sellItem(Item item) {
    TradeItem<Item> shopEntry = merchantShop.getItems().stream()
            .filter(t -> t.getItem().getName().equals(item.getName()))
            .findFirst().orElse(null);

    int sellPrice = shopEntry != null ? shopEntry.getSellPrice() : 10;  // default sell
    playerInventory.remove(item);
    inc("gold", +sellPrice);
    play("sounds/sell.wav");
    return true;
}
```

## ShopView — Built-in Shop UI

```java
ShopView<Item> shopView = new ShopView<>(merchantShop, playerInventory);
// Displays available items with buy/sell buttons
// Calls the shop's built-in buy/sell logic

// Customise with CSS (place in assets/ui/)
shopView.getStylesheets().add("shop-style.css");

// Open in a SubScene
public class ShopSubScene extends GameSubScene {
    @Override
    public void onOpen() {
        ShopView<Item> view = new ShopView<>(merchantShop, playerInventory);
        Button close = getUIFactoryService().newButton("Close Shop", () ->
                getSceneService().popSubScene());
        VBox root = new VBox(20, view, close);
        root.setPadding(new Insets(20));
        getRoot().getChildren().add(root);
    }
}
```

## Stacking Items (Quantity Management)

```java
// For stackable items, increment quantity instead of adding new Item
public void addOrStack(Item newItem) {
    Optional<Item> existing = playerInventory.getItems().stream()
            .filter(i -> i.getName().equals(newItem.getName()))
            .findFirst();

    if (existing.isPresent()) {
        existing.get().setQuantity(existing.get().getQuantity() + newItem.getQuantity());
        // refresh the list view
        playerInventory.getItems().remove(existing.get());
        playerInventory.getItems().add(existing.get());
    } else {
        playerInventory.add(newItem);
    }
}
```

## Collision-Triggered Shop

```java
// In initPhysics or initGame
onCollisionBegin(EntityType.PLAYER, EntityType.MERCHANT_NPC, (player, merchant) -> {
    if (shopSubScene == null) {
        shopSubScene = new ShopSubScene();
    }
    getSceneService().pushSubScene(shopSubScene);
});
```

## Saving Inventory State

```java
// In writeSaveState — Item must be Serializable
@Override
public void writeSaveState(DataFile data) {
    var inv = data.getBundle("inventory");
    inv.put("items", new ArrayList<>(playerInventory.getItems()));
    inv.put("gold", geti("gold"));
}

@Override
public void readSaveState(DataFile data) {
    var inv = data.getBundle("inventory");
    List<Item> savedItems = inv.get("items");
    savedItems.forEach(item -> playerInventory.add(item));
    set("gold", inv.get("gold"));
}
```

## Gotchas

- **`Item` must implement `Serializable`** if you save/load the inventory. All fields
  (including nested objects like icons) must also be serializable. Avoid storing `Node`
  or `Texture` objects directly on items — store file paths as Strings instead.
- **`ObservableList` from `getItems()`** is live — modifications to it update the
  `InventoryListView` automatically. Do not replace the list; add/remove from it directly.
- **`Inventory` capacity is enforced by `add()`** — it returns false when full.
  Always check the return value before assuming the item was added.
- **`TradeItem.getBuyPrice()` vs `getSellPrice()`** — buy price is what the player pays;
  sell price is what the player receives. The sell price is typically 40-60% of buy price.
- **`ShopView` uses the default `toString()` of your item** for item names in the built-in
  cells. Override `toString()` to return the item name or implement a custom cell factory.
- **InventoryListView does not auto-refresh** when you mutate item properties (like quantity).
  Force a refresh with `listView.refresh()` after mutating items already in the inventory.
