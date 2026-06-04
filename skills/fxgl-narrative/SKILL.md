---
name: fxgl-narrative
description: >
  Implement cutscenes, dialogue, and video scenes in FXGL — create text cutscenes with
  CutsceneService, load and play branching dialogue graphs from JSON, run the DialogueScriptRunner
  with function nodes, play video cutscene files, trigger narrative scenes from collision or
  game events, and build custom dialogue UI. Use this skill when adding story sequences,
  NPC conversations, intro/outro scenes, branching player choices, or scripted in-game events.
  Triggers on: "cutscene", "dialogue", "DialogueGraph", "CutsceneService", "branching dialogue",
  "NPC conversation", "VideoScene", "narrative", "story", "dialogue tree", "script runner".
compatibility: Java 17+, FXGL 21.x. CutsceneService must be registered. Video requires JavaFX Media.
metadata:
  author: fxgl-skills
  version: "1.0"
  fxgl-version: "21.1"
  category: fxgl/narrative
allowed-tools: Read Write Edit Bash
---

# FXGL Narrative System

## Setup

```java
// Register in initSettings
settings.addEngineService(CutsceneService.class);
```

## Text Cutscene (Line-by-line)

A cutscene is a sequence of spoken lines. The player clicks to advance.
The game loop pauses automatically.

```java
// Build a cutscene programmatically
List<CutsceneLine> lines = new ArrayList<>();
lines.add(new CutsceneLine("Guard",   List.of("Halt! Who goes there?")));
lines.add(new CutsceneLine("Player",  List.of("I am the chosen one.", "Stand aside.")));
lines.add(new CutsceneLine("Guard",   List.of("By the king's order...", "...you may pass.")));

Cutscene scene = new Cutscene(lines);

// Play the cutscene
getCutsceneService().startCutscene(scene, () -> {
    // called when player clicks through all lines
    openGate();
    resumeGame();
});
```

## Dialogue Graph (Branching Dialogue)

The dialogue graph is created in the FXGL Dialogue Editor (or authored as JSON).
Save dialogue files to `src/main/resources/assets/scripts/dialogues/`.

### Loading and playing

```java
// Load graph from asset
DialogueGraph graph = getAssetLoader().loadDialogueGraph("dialogues/merchant.json");

// Play — game pauses during dialogue
getCutsceneService().startDialogueScene(graph, () -> {
    // called when dialogue reaches EndNode
    enableMerchantTrade();
});
```

### Wiring function nodes to game code

Function nodes in the dialogue graph call registered handlers by name:

```java
// Register handlers BEFORE starting dialogue
getCutsceneService().getDialogueHandler().addHandler("startQuest", () -> {
    getQuestService().startQuest(rescueQuest);
});

getCutsceneService().getDialogueHandler().addHandler("giveReward", () -> {
    inc("gold", +500);
    spawn("goldBag", player.getX(), player.getY());
});

getCutsceneService().getDialogueHandler().addHandler("unlockDoor", () -> {
    getGameWorld().getSingleton(e -> e.isType(LOCKED_DOOR))
                 .getComponent(DoorComponent.class)
                 .unlock();
});

// Now start dialogue
getCutsceneService().startDialogueScene(graph, this::afterTrade);
```

### Condition-based dialogue branches

In the Dialogue Editor, set conditions on choice branches. The script runner evaluates
these against world variables automatically. No extra wiring needed:

```
// Condition expression (evaluated by DialogueScriptRunner):
// "score >= 1000"       → true if FXGL variable 'score' >= 1000
// "hasKey == true"      → true if boolean variable 'hasKey' is true
// "playerLevel >= 5"    → branch only shown if player is level 5+
```

## Collision-triggered Dialogue

```java
onCollisionBegin(EntityType.PLAYER, EntityType.NPC, (player, npc) -> {
    // Each NPC entity can carry a dialogue file path as a custom property
    String dialogueFile = npc.getProperties().getString("dialogue");

    // Prevent re-triggering while dialogue is active
    if (getCutsceneService().isActive()) return;

    DialogueGraph graph = getAssetLoader().loadDialogueGraph("dialogues/" + dialogueFile);

    // Disable player input during dialogue
    getInput().setProcessInput(false);

    getCutsceneService().startDialogueScene(graph, () -> {
        getInput().setProcessInput(true);  // re-enable
    });
});
```

## Video Scene

```java
// Play a full-screen video (MP4 or other JavaFX Media format)
// Place video at: src/main/resources/assets/video/intro.mp4
getCutsceneService().startVideo("intro.mp4", () -> {
    // Called after video finishes or player skips
    getGameController().gotoMainMenu();
});

// The VideoScene allows ESC/click to skip
```

## Custom Cutscene Scene (SceneFactory)

For a fully custom look, extend `CutsceneScene`:

```java
public class MyCutsceneScene extends CutsceneScene {

    public MyCutsceneScene(CutsceneService service) {
        // Override the visual layout
        Text speakerLabel = new Text();
        speakerLabel.setFont(Font.font("Serif", 28));
        speakerLabel.setFill(Color.YELLOW);
        speakerLabel.textProperty().bind(currentSpeakerProperty());

        Text lineText = new Text();
        lineText.setFont(Font.font("Serif", 22));
        lineText.setFill(Color.WHITE);
        lineText.textProperty().bind(currentLineProperty());

        // Position in lower third of screen
        VBox box = new VBox(speakerLabel, lineText);
        box.setTranslateX(100);
        box.setTranslateY(500);
        getContentRoot().getChildren().add(box);
    }
}

// Register in SceneFactory
public class MySceneFactory extends SceneFactory {
    @Override
    public CutsceneScene newCutsceneScene() {
        return new MyCutsceneScene(FXGL.getCutsceneService());
    }
}
```

## Dialogue Graph JSON Format

Reference for hand-authoring dialogue files without the editor:

```json
{
  "nodes": [
    {"id": 0, "type": "START", "next": 1},
    {"id": 1, "type": "TEXT",  "owner": "Guard", "text": "Halt! Who goes there?", "next": 2},
    {"id": 2, "type": "CHOICE", "choices": [
      {"text": "I am a traveller.", "condition": "", "next": 3},
      {"text": "None of your business.", "condition": "playerLevel >= 5", "next": 4}
    ]},
    {"id": 3, "type": "TEXT", "owner": "Guard", "text": "Pass, traveller.", "next": 5},
    {"id": 4, "type": "FUNCTION", "functionName": "intimidateGuard", "next": 5},
    {"id": 5, "type": "END"}
  ]
}
```

See [references/dialogue-json-format.md](references/dialogue-json-format.md) for full node type reference.

## Gotchas

- **`CutsceneService` must be registered** in `initSettings` — calling `getCutsceneService()`
  without registration throws `IllegalStateException`.
- **The game loop pauses during dialogue** (by default). If your UI or enemy logic needs to
  run during dialogue, use an `EngineService.onUpdate()` override which runs regardless of pause.
- **`isActive()` check before triggering** — starting a second cutscene while one is playing
  causes undefined behaviour. Always guard with `getCutsceneService().isActive()`.
- **Dialogue JSON nodes must use sequential integer IDs** starting from 0. Non-sequential IDs
  cause the loader to throw `NullPointerException` when resolving `next` references.
- **Function node names are case-sensitive** — `"startQuest"` in JSON must match the exact
  string passed to `addHandler("startQuest", ...)`.
- **`setProcessInput(false)` must be re-enabled** in the completion callback — forgetting this
  locks the player permanently after dialogue ends.
- **Video requires JavaFX Media module** — add `javafx.media` to your module path. Video
  playback may fail on headless/CI environments; guard with a platform check.
- **Dialogue asset path**: `loadDialogueGraph("dialogues/npc.json")` resolves to
  `assets/scripts/dialogues/npc.json` on the classpath.
