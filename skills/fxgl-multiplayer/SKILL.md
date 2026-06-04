---
name: fxgl-multiplayer
description: >
  Add multiplayer and networking to an FXGL game — create TCP or WebSocket servers and
  clients via NetService, replicate entity spawns/positions/destruction across clients
  using MultiplayerService and NetworkComponent, synchronise player input, send and
  receive custom protocol messages, handle connect/disconnect events, and download files
  asynchronously. Use this skill when building a multiplayer game, a client-server
  architecture, a real-time entity sync system, or any network-connected feature in FXGL.
triggers:
  - multiplayer
  - network
  - NetService
  - MultiplayerService
  - NetworkComponent
  - TCP server
  - WebSocket
  - entity replication
  - server client
  - online game
compatibility: >
  Java 17+, FXGL 21.x. Network requires open ports and matching client/server FXGL
  versions.
category: fxgl/multiplayer
tags:
  - fxgl
  - java
  - javafx
  - multiplayer
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
# FXGL Multiplayer & Networking

## Architecture

FXGL uses an **authoritative server** model:
- The **server** runs the game loop, processes input, and broadcasts world state.
- **Clients** send input events and render received state.
- `MultiplayerService` handles entity spawn/destroy/position replication.

## Setup

```java
// Both server and client need this in initSettings
settings.addEngineService(MultiplayerService.class);
```

## Server Side

```java
// Create TCP server
Server<Bundle> server = getNetService().newTCPServer(55555);

server.setOnConnected(conn -> {
    System.out.println("Client connected: " + conn.getConnectionNum());
    // Sync existing world state to the new client
    getService(MultiplayerService.class).addEntityReplicationSender(server, conn);
});

server.setOnDisconnected(conn -> {
    System.out.println("Client disconnected: " + conn.getConnectionNum());
    // Remove their player entity
});

// Listen for input from clients
server.setOnMessage((conn, bundle) -> {
    String type = bundle.getString("type");
    if ("input".equals(type)) {
        String action = bundle.getString("action");
        boolean active = bundle.getBoolean("active");
        handleClientInput(conn.getConnectionNum(), action, active);
    }
});

// Start listening
server.startAsync();
```

## Client Side

```java
// Connect to server
Client<Bundle> client = getNetService().newTCPClient("localhost", 55555);

client.setOnConnected(conn -> {
    System.out.println("Connected to server");
    getService(MultiplayerService.class).addEntityReplicationReceiver(conn, getGameWorld());
});

client.setOnMessage((conn, bundle) -> {
    // Handle server→client messages (world state, game events, etc.)
});

// Send input to server
public void sendInput(String actionName, boolean isActive) {
    Bundle bundle = new Bundle("input");
    bundle.put("type",   "input");
    bundle.put("action", actionName);
    bundle.put("active", isActive);
    client.getConnection().send(bundle);
}

client.connectAsync();
```

## Entity Replication with MultiplayerService

```java
MultiplayerService mps = getService(MultiplayerService.class);

// SERVER: replicate a spawned entity to all clients
Entity enemy = spawn("enemy", 400, 300);
for (Connection<?> conn : server.getConnections()) {
    mps.replicateEntitySpawn(server, enemy, conn);
}

// SERVER: replicate entity destruction
onCollisionBegin(EntityType.BULLET, EntityType.ENEMY, (bullet, enemy) -> {
    for (Connection<?> conn : server.getConnections()) {
        mps.replicateEntityDestroy(server, enemy, conn);
    }
    enemy.removeFromWorld();
    bullet.removeFromWorld();
});

// Add NetworkComponent to entities that need position sync
entity.addComponent(new NetworkComponent());
// NetworkComponent auto-replicates x, y, rotation each frame to registered connections
```

## WebSocket Server & Client

```java
// Server (WebSocket — useful for browser or JS clients)
WebSocketServer wsServer = getNetService().newWebSocketServer(55556);

wsServer.setOnConnected(conn -> System.out.println("WS client connected"));
wsServer.setOnMessage((conn, message) -> {
    // message is a raw String — parse as JSON/CSV/custom protocol
    JSONObject json = new JSONObject(message);
    handleMessage(json);
});
wsServer.broadcast("Hello clients!");
wsServer.startAsync();

// Client
WebSocketClient wsClient = getNetService().newWebSocketClient("ws://localhost:55556");
wsClient.setOnConnected(conn -> conn.send("{\"type\":\"join\",\"name\":\"Alice\"}"));
wsClient.setOnMessage((conn, message) -> parseServerMessage(message));
wsClient.connectAsync();
```

## Player Input Replication Pattern

Authoritative server pattern — client sends input, server executes it:

```java
// === CLIENT SIDE ===
@Override
protected void initInput() {
    // Instead of moving locally, send input to server
    onKey(KeyCode.A, () -> sendInput("moveLeft", true));
    onKeyUp(KeyCode.A, () -> sendInput("moveLeft", false));
    onKey(KeyCode.D, () -> sendInput("moveRight", true));
    onKeyUp(KeyCode.D, () -> sendInput("moveRight", false));
    onKeyDown(KeyCode.SPACE, () -> sendInput("jump", true));
}

// === SERVER SIDE ===
private Map<Integer, Set<String>> clientInputs = new HashMap<>();

private void handleClientInput(int clientNum, String action, boolean active) {
    clientInputs.computeIfAbsent(clientNum, k -> new HashSet<>());
    if (active) clientInputs.get(clientNum).add(action);
    else        clientInputs.get(clientNum).remove(action);
}

@Override
protected void onUpdate(double tpf) {
    // Apply accumulated input from each client to their player entity
    clientInputs.forEach((clientNum, actions) -> {
        Entity player = getPlayerForClient(clientNum);
        if (player == null) return;
        PlayerComponent pc = player.getComponent(PlayerComponent.class);
        if (actions.contains("moveLeft"))  pc.moveLeft();
        if (actions.contains("moveRight")) pc.moveRight();
    });
}
```

## Broadcast Game Events to All Clients

```java
// Server — send game event to all connected clients
public void broadcastGameEvent(String eventType, Map<String, Object> data) {
    Bundle bundle = new Bundle("gameEvent");
    bundle.put("eventType", eventType);
    data.forEach(bundle::put);
    server.broadcast(bundle);
}

// Call from server game logic
broadcastGameEvent("enemyDied", Map.of("x", 300.0, "y", 200.0, "points", 50));
```

## File Download (Async)

```java
// Download an update or resource from the internet
getNetService().openStreamTask("https://example.com/patch/data.json")
        .onSuccess(inputStream -> {
            // parse JSON on main thread (onSuccess fires on FX thread)
            applyPatch(inputStream);
        })
        .onFailure(e -> showMessage("Download failed: " + e.getMessage()))
        .runAsync();
```

## Connection Lifecycle State Machine

```
DISCONNECTED → connectAsync() → CONNECTING → CONNECTED → PLAYING
PLAYING → conn.close() / timeout → DISCONNECTED
```

## Gotchas

- **Always call `server.startAsync()` or `client.connectAsync()`** — the blocking variants
  (`start()`, `connect()`) freeze the game loop. Never use them on the main thread.
- **`MultiplayerService.replicateEntitySpawn`** sends the entity's `type` string — the
  receiving client must have the same `EntityFactory` registered with a matching `@Spawns`.
- **Entity replication only covers position, rotation, and type** by default. Custom
  component data must be manually serialised and sent as a `Bundle`.
- **Connections are numbered from 1** — `conn.getConnectionNum()` returns 1, 2, 3, etc.
  Use it as a client identifier for server-side player maps.
- **The server and client must use the same FXGL version** — `Bundle` serialisation is not
  forward-compatible across major versions.
- **`server.broadcast(bundle)` sends to ALL connections** — use `conn.send(bundle)` to
  target a specific client.
- **Network latency is not compensated by default** — implement client-side prediction and
  server reconciliation if your game requires smooth movement at high latency.
- **WebSocket messages are raw Strings** — use JSON (e.g., `org.json` or `Gson`) for
  structured data. TCP `Bundle` objects are pre-serialised by FXGL.
