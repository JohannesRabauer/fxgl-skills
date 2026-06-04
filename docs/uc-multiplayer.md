# Use Cases — Multiplayer & Networking

Covers MultiplayerService, entity replication, NetworkComponent, WebSocket transport, and TCP/UDP networking.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])
    Server([Game Server])
    Client([Game Client])

    Dev --> UC1["UC-NET-1\nCreate TCP server"]
    Dev --> UC2["UC-NET-2\nConnect TCP client to server"]
    Dev --> UC3["UC-NET-3\nCreate WebSocket server"]
    Dev --> UC4["UC-NET-4\nConnect WebSocket client"]
    Dev --> UC5["UC-NET-5\nReplicate entity spawn to all clients"]
    Dev --> UC6["UC-NET-6\nReplicate entity position each frame"]
    Dev --> UC7["UC-NET-7\nSend / receive custom game events over network"]
    Dev --> UC8["UC-NET-8\nHandle client connect / disconnect"]
    Dev --> UC9["UC-NET-9\nAdd NetworkComponent to entity"]
    Dev --> UC10["UC-NET-10\nDownload file asynchronously"]

    Server --> UC1
    Server --> UC3
    Client --> UC2
    Client --> UC4
```

## Network Service Setup

```mermaid
flowchart TD
    SReg2["FXGL provides NetService built-in"] --> NS["FXGL.getNetService()"]

    NS --> TCP_S["newTCPServer(port)\n→ Server<Connection>"]
    NS --> TCP_C["newTCPClient(host, port)\n→ Client<Connection>"]
    NS --> WS_S["newWebSocketServer(port)\n→ WebSocketServer"]
    NS --> WS_C["newWebSocketClient(uri)\n→ WebSocketClient"]
```

## MultiplayerService Architecture

```mermaid
graph TD
    MPS["MultiplayerService"] --> Spawn2["replicateEntitySpawn(entity, connection)"]
    MPS --> Destroy["replicateEntityDestroy(entity, connection)"]
    MPS --> Input3["replicatePlayerInput(input, connection)"]

    MPS --> NC["NetworkComponent"] --> Replicate["auto-replicates:\n• position (x, y)\n• rotation\n• custom properties"]
```

## Entity Replication Flow

```mermaid
sequenceDiagram
    participant Server2 as Server
    participant MultiplayerService2 as MultiplayerService
    participant Client2 as Client

    Server2->>Server2: spawn("enemy", 100, 200)
    Server2->>MultiplayerService2: replicateEntitySpawn(entity, connection)
    MultiplayerService2->>Client2: send NetworkSpawnData (name, x, y, props)
    Client2->>Client2: spawn("enemy", receivedData)
    Note over Client2: entity appears on client side
    Server2->>MultiplayerService2: entity position updates each frame
    MultiplayerService2->>Client2: send position delta
    Client2->>Client2: update entity position
```

## WebSocket Server Use Case

```mermaid
flowchart TD
    A2["getNetService().newWebSocketServer(55555)"] --> WS2["WebSocketServer"]
    WS2 --> Msg["server.setOnConnected(conn -> ...)\nserver.setOnMessage(conn, msg -> ...)\nserver.setOnDisconnected(conn -> ...)"]
    WS2 --> Send2["conn.send(message)"]
    WS2 --> Broadcast["server.broadcast(message)"]
```

## Input Replication Pattern (authoritative server)

```mermaid
flowchart LR
    C2["Client Input"] --> Send3["send key press event to server"]
    Send3 --> Server3["Server processes input\n→ moves entity\n→ broadcasts new position"]
    Server3 --> Clients["All clients receive position update\napply to entity"]
```

## File Download Use Case

```mermaid
flowchart TD
    Dev([Developer]) --> DL["getNetService().downloadTask(url)\n.onSuccess(bytes -> saveFile(bytes))\n.onFailure(e -> showError(e))\n.runAsyncFX()"]
    DL --> Async["Runs on background thread\nresult delivered on FX thread"]
```

## Connection Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Disconnected
    Disconnected --> Connecting : client.connectTask().run()
    Connecting --> Connected : handshake success
    Connected --> Playing : game started
    Playing --> Connected : game ended
    Connected --> Disconnected : conn.close() / network error
    Disconnected --> [*]
```

## Custom Protocol Message

```mermaid
flowchart LR
    Dev([Developer]) --> Proto["Define message type enum\nor String protocol"]
    Proto --> Send4["conn.send(MessageObject / String)"]
    Send4 --> Receive["onMessage(conn, msg) → parse\n→ update game state"]
```
