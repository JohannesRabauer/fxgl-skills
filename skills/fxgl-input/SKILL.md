---
name: fxgl-input
description: >
  Handle all input in FXGL — bind keyboard keys (held, press, release), mouse buttons and
  position, virtual on-screen joystick and controller buttons, hardware gamepad via fxgl-
  controllerinput, capture and replay input recordings, register input combos/sequences,
  and use the fluent input builder. Use this skill when wiring player controls,
  implementing key rebinding, adding mobile touch controls, recording demos, or
  implementing fighting-game combo systems.
triggers:
  - keyboard input
  - mouse input
  - onKey
  - onKeyDown
  - UserAction
  - virtual joystick
  - controller
  - input binding
  - key combo
  - input capture
compatibility: >
  Java 17+, FXGL 21.x. Gamepad support requires fxgl-controllerinput module.
category: fxgl/input
tags:
  - fxgl
  - java
  - javafx
  - input
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
# FXGL Input System

## Overview

All input bindings go in `initInput()`. Actions fire on the game thread synchronised with
the game loop — no threading concerns.

## Keyboard — Three Action Phases

```java
@Override
protected void initInput() {

    // ── Phase 1: held (fires every frame while key is held) ──────────────
    onKey(KeyCode.A, () -> player.getComponent(PC.class).moveLeft());
    onKey(KeyCode.D, () -> player.getComponent(PC.class).moveRight());

    // With a name (required for key rebinding)
    onKey(KeyCode.W, "Move Up", () -> player.getComponent(PC.class).moveUp());

    // ── Phase 2: pressed (fires once on key down) ─────────────────────────
    onKeyDown(KeyCode.SPACE, () -> player.getComponent(PC.class).jump());
    onKeyDown(KeyCode.ESCAPE, () -> getGameController().gotoGameMenu());

    // ── Phase 3: released (fires once on key up) ──────────────────────────
    onKeyUp(KeyCode.SHIFT, () -> player.getComponent(PC.class).stopSprint());
}
```

## UserAction — Full Control Over All Three Phases

Use `UserAction` when a single binding needs begin, held, and end logic (e.g., sprint):

```java
getInput().addAction(new UserAction("Sprint") {
    @Override
    protected void onActionBegin() {
        player.getComponent(PC.class).startSprint();
    }
    @Override
    protected void onAction() {
        player.getComponent(PC.class).sprint();  // called every frame while held
    }
    @Override
    protected void onActionEnd() {
        player.getComponent(PC.class).stopSprint();
    }
}, KeyCode.SHIFT);
```

## Mouse Buttons

```java
// Primary (left) button
onBtnDownPrimary(() -> shoot());          // fires on press
onBtnPrimary(()    -> holdFire());        // fires every frame while held
onBtnUp(MouseButton.PRIMARY, () -> stopFire()); // fires on release

// Secondary (right) button
onBtnDownSecondary(() -> aim());

// Any mouse button
onBtnDown(MouseButton.MIDDLE, () -> dropBomb());

// With name (rebindable)
onBtnDown(MouseButton.PRIMARY, "Shoot", () -> shoot());
```

## Mouse Position

```java
// World position (accounts for viewport scroll and zoom)
Point2D worldPos = getInput().getMousePositionWorld();

// Screen/UI position (always relative to window)
Point2D screenPos = getInput().getMousePositionUI();

// In onUpdate — aim entity at mouse cursor
double angle = entity.getCenter().angle(getInput().getMousePositionWorld());
entity.setRotation(angle);
```

## Input Modifiers (Shift, Ctrl, Alt)

```java
// Only fires when CTRL+S is pressed
getInput().addAction(new UserAction("QuickSave") {
    @Override protected void onActionBegin() { quickSave(); }
}, KeyCode.S, InputModifier.CTRL);
```

## Fluent Key Builder (alternative to onKey/onKeyDown)

```java
FXGL.onKeyBuilder(KeyCode.SPACE)
        .onActionBegin(() -> jump())
        .onActionEnd(() -> land())
        .buildAndEnable();

// With trigger type
FXGL.onKeyBuilder(new KeyTrigger(KeyCode.F), TriggerListener.Phase.ONCE)
        .onAction(() -> interact())
        .buildAndEnable();
```

## Input Sequence (Combo System)

```java
// Register a combo — fires when player inputs all keys in order within timeout
InputSequence konami = new InputSequence(
    KeyCode.UP, KeyCode.UP, KeyCode.DOWN, KeyCode.DOWN,
    KeyCode.LEFT, KeyCode.RIGHT, KeyCode.LEFT, KeyCode.RIGHT,
    KeyCode.B, KeyCode.A
);

getInput().registerSequence(konami, () -> activateCheatCode());
```

## Virtual On-screen Controls (Mobile / Touch)

```java
// Joystick — fire directional input as keyboard-equivalent actions
VirtualJoystick joystick = getInput().createVirtualJoystick();
addUINode(joystick.createView(), 40, getAppHeight() - 140);

// Virtual button grid
VirtualController controller = getInput().createVirtualController();
addUINode(controller.createView());
// Map virtual buttons to registered UserActions by name:
controller.getButton(VirtualButton.A).setTrigger("Jump");
controller.getButton(VirtualButton.B).setTrigger("Shoot");
```

## Hardware Gamepad (fxgl-controllerinput)

```java
// Add dependency: com.github.almasb:fxgl-controllerinput
// In initSettings:
settings.addEngineService(ControllerInputService.class);

// In initInput:
getService(ControllerInputService.class).addGameController(new GameController() {
    @Override
    public void onUpdate(GameControllerState state) {
        // state.getAxisValue(GameControllerAxis.LEFT_X)   → -1.0 to 1.0
        // state.isButtonPressed(GameControllerButton.A)   → boolean
        double lx = state.getAxisValue(GameControllerAxis.LEFT_X);
        player.getComponent(PC.class).moveHorizontal(lx * 250);

        if (state.isButtonPressed(GameControllerButton.A)) jump();
    }
});
```

## Input Capture & Replay

```java
// Start recording all input
getInput().startCapture();

// Player plays normally...

// Stop and save capture
InputCapture capture = getInput().stopCapture();
// serialize capture to file if desired

// Later: replay deterministically
getInput().startPlayback(new InputPlayback(capture, () -> {
    System.out.println("Replay finished");
}));
```

## Querying Input State Directly

```java
// In onUpdate or any method — check current state without callbacks
if (getInput().isHeld(KeyCode.A)) moveLeft();
if (getInput().isHeld(MouseButton.PRIMARY)) holdFire();

// Mouse is over a UI element (blocks game input)
if (!getInput().isInsideUI()) processWorldClick();
```

## Key Rebinding

```java
// Get all rebindable actions (those registered with a name)
List<UserAction> rebindable = getInput().getBindings().entrySet().stream()
    .filter(e -> !e.getKey().isEmpty())
    .collect(Collectors.toList());

// Rebind programmatically
getInput().rebind(getInput().getActionByName("Move Left"), KeyCode.LEFT);

// Built-in rebinding UI — opens a dialog
getInput().rebind("Move Left", new RebindDialogHandler());
```

## Gotchas

- **`initInput()` is the only safe place** to register actions. Adding actions in
  `onUpdate()` stacks duplicate bindings every frame.
- **Calling `onKey` without a name** makes the action non-rebindable and not listed
  in the controls screen. Always pass a name for player-facing actions.
- **Keyboard actions do not fire** when a JavaFX dialog (`showMessageBox`, `showConfirmationBox`)
  is open — the dialog grabs focus. Close the dialog first or use `getDialogService().close()`.
- **Mouse world position is (0, 0)** until the mouse moves at least once. Guard with a null
  check or use `getInput().getMousePositionUI()` for UI work.
- **Virtual joystick must be added** to the scene after `initUI()` runs, not in `initGame()`.
- **Input playback is deterministic only** if your game logic is also deterministic (same
  random seed, no wall-clock time). Use `FXGLMath` seeded random for replays.
- **`KeyCode.ESCAPE` is bound to the game menu** by default when
  `settings.setGameMenuEnabled(true)`. Override only if you hide the game menu.
