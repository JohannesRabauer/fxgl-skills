# Use Cases — Input Handling

Covers keyboard, mouse, virtual controls, gamepad, input capture/replay, and key sequences.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])
    Player([Player])

    Dev --> UC1["UC-INP-1\nBind keyboard action (held)"]
    Dev --> UC2["UC-INP-2\nBind keyboard action (press/release)"]
    Dev --> UC3["UC-INP-3\nBind mouse button action"]
    Dev --> UC4["UC-INP-4\nRead cursor position"]
    Dev --> UC5["UC-INP-5\nAdd virtual on-screen joystick"]
    Dev --> UC6["UC-INP-6\nAdd virtual controller buttons"]
    Dev --> UC7["UC-INP-7\nHandle gamepad / hardware controller"]
    Dev --> UC8["UC-INP-8\nCapture and replay input recording"]
    Dev --> UC9["UC-INP-9\nDefine input modifier (shift/ctrl)"]
    Dev --> UC10["UC-INP-10\nRegister input sequence (combo)"]
    Dev --> UC11["UC-INP-11\nFluent input builder pattern"]

    Player -->|interacts via| UC1
    Player -->|interacts via| UC3
    Player -->|interacts via| UC5
```

## Keyboard Binding Patterns

```mermaid
flowchart TD
    subgraph Held["Action while key held"]
        A1["onKey(KeyCode.A, () -> move())"]
        A2["getInput().addAction(new UserAction('Left'){onAction()}, KeyCode.A)"]
    end
    subgraph Pressed["Action on key press"]
        B1["onKeyDown(KeyCode.SPACE, () -> jump())"]
        B2["UserAction.onActionBegin()"]
    end
    subgraph Released["Action on key release"]
        C1["onKeyUp(KeyCode.A, () -> stop())"]
        C2["UserAction.onActionEnd()"]
    end
```

## Mouse Binding Patterns

```mermaid
flowchart TD
    M1["onBtnDownPrimary(() -> shoot())"]
    M2["onBtnDown(MouseButton.PRIMARY, name, action)"]
    M3["onBtnPrimary(() -> holdingFire())"]
    M4["onBtnUp(MouseButton.SECONDARY, () -> aim())"]
    M5["getInput().getMousePositionWorld()\ngetInput().getMousePositionUI()"]
```

## Fluent Input Builder

```mermaid
flowchart LR
    Builder["FXGL.onKeyBuilder(KeyCode.W)"] --> Type{Action Type}
    Type --> Held[".onAction(() -> ...)"]
    Type --> Begin[".onActionBegin(() -> ...)"]
    Type --> End[".onActionEnd(() -> ...)"]
    Builder2["FXGL.onKeyBuilder(KeyCode.W, trigger)\n.onAction(...)"]
    Builder2 --> Build[".buildAndEnable()"]
```

## Input Sequence (Combo) Use Case

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant InputSequenceView
    participant Input

    Dev->>Input: register InputSequence [UP, UP, DOWN, DOWN, A, B]
    Input->>Input: track key presses in order
    Input-->>Dev: sequence matched → fire special action
    InputSequenceView->>InputSequenceView: display progress to player
```

## Input Capture & Replay Use Case

```mermaid
flowchart LR
    A["getInput().startCapture()"] --> B["Player plays normally"]
    B --> C["getInput().stopCapture()"]
    C --> D["InputCapture object saved"]
    D --> E["getInput().startPlayback(capture)"]
    E --> F["Input replayed deterministically"]
```

## Virtual Controls Use Case

```mermaid
graph TD
    VirtualInput["Virtual / On-Screen Controls"]
    VirtualInput --> Joystick["VirtualJoystick\n• shows directional pad\n• fires move actions"]
    VirtualInput --> Controller["VirtualController\n• configurable button grid\n• maps to UserActions"]
    VirtualInput --> Dpad["VirtualDpad\n• four-direction pad\n• touch-friendly"]
    VirtualInput --> Usage["getInput().addVirtualJoystick()\ngetInput().addVirtualController()"]
```

## Hardware Controller (Gamepad) Use Case

```mermaid
flowchart TD
    CI["fxgl-controllerinput module"] --> Detect["ControllerInput.detectControllers()"]
    Detect --> Map["map button/axis → UserAction"]
    Map --> Same["same action system as keyboard"]
```

## Input Modifier Use Case

```mermaid
flowchart LR
    Dev([Developer]) --> IM["InputModifier\n(SHIFT, CTRL, ALT)"]
    IM --> Bind["addAction(action, KeyCode.A, InputModifier.SHIFT)"]
    Bind --> Fire["fires only when SHIFT+A held"]
```
