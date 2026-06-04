---
name: fxgl-visual-novel
description: >
  Build a visual novel in FXGL — swap full-screen background images per scene, position
  character sprites at Left/Center/Right with cross-fade transitions, reveal dialogue text
  character-by-character with a typewriter timer, present clickable choice buttons that
  branch the story, store narrative flags to track relationship scores and visited scenes,
  auto-save chapter progress with SaveLoadService, and support a backlog overlay that
  scrolls through past dialogue lines.
  Use this skill when building a visual novel, kinetic novel, dating sim dialogue system,
  or any choice-based narrative game with illustrated scenes.
  Triggers on: "visual novel", "dialogue box", "typewriter effect", "choice button",
  "narrative flags", "character sprite", "scene background swap", "backlog", "vn engine".
compatibility: Java 17+, FXGL 21.x
metadata:
  author: fxgl-skills
  version: "1.0"
  fxgl-version: "21.1"
  category: fxgl/game-types
allowed-tools: Read Write Edit Bash
---

# FXGL Visual Novel

## Scene Data Model

```java
// Script loaded from JSON — each node is a line or branch
public sealed interface ScriptNode permits DialogueLine, ChoiceNode, BackgroundChange, CharacterEnter, CharacterExit {}

public record DialogueLine(String speaker, String text) implements ScriptNode {}
public record ChoiceNode(String prompt, List<Choice> choices) implements ScriptNode {}
public record BackgroundChange(String imageName) implements ScriptNode {}
public record CharacterEnter(String name, String expression, String position) implements ScriptNode {}
public record CharacterExit(String name) implements ScriptNode {}
public record Choice(String label, String targetSceneId, String setFlag) {}
```

## Background Swap with Cross-Fade

```java
private ImageView bgCurrent = new ImageView();
private ImageView bgNext    = new ImageView();

@Override
protected void initGame() {
    bgCurrent.setFitWidth(getAppWidth());
    bgCurrent.setFitHeight(getAppHeight());
    bgNext.setFitWidth(getAppWidth());
    bgNext.setFitHeight(getAppHeight());
    bgNext.setOpacity(0);

    getGameScene().addUINode(bgCurrent);
    getGameScene().addUINode(bgNext);
    // Character layers and dialogue box added on top
}

private void setBackground(String imageName) {
    Image img = getAssetLoader().loadImage(imageName);
    bgNext.setImage(img);
    bgNext.setOpacity(0);

    animationBuilder()
            .duration(Duration.millis(600))
            .interpolator(Interpolators.LINEAR.EASE_IN())
            .fade(bgNext)
            .from(0).to(1)
            .onFinished(() -> {
                bgCurrent.setImage(img);
                bgCurrent.setOpacity(1);
                bgNext.setOpacity(0);
            })
            .buildAndPlay();
}
```

## Character Sprite Positions

```java
private static final double LEFT_X   = 100;
private static final double CENTER_X = 560;
private static final double RIGHT_X  = 900;
private static final double CHAR_Y   = 80;

private final Map<String, ImageView> characterViews = new HashMap<>();

private void enterCharacter(String name, String expression, String position) {
    Image sprite = getAssetLoader().loadImage("characters/" + name + "_" + expression + ".png");
    ImageView view = characterViews.computeIfAbsent(name, k -> {
        ImageView v = new ImageView();
        v.setFitHeight(500);
        v.setPreserveRatio(true);
        v.setOpacity(0);
        getGameScene().addUINode(v);
        return v;
    });

    view.setImage(sprite);
    double targetX = switch (position) {
        case "left"   -> LEFT_X;
        case "right"  -> RIGHT_X;
        default       -> CENTER_X;
    };
    view.setLayoutX(targetX);
    view.setLayoutY(CHAR_Y);

    animationBuilder().duration(Duration.millis(400)).fade(view).from(0).to(1).buildAndPlay();
}

private void exitCharacter(String name) {
    ImageView view = characterViews.get(name);
    if (view == null) return;
    animationBuilder()
            .duration(Duration.millis(350))
            .fade(view)
            .from(view.getOpacity()).to(0)
            .onFinished(() -> characterViews.remove(name))
            .buildAndPlay();
}
```

## Typewriter Text Reveal

```java
private String   fullText       = "";
private int      charIndex      = 0;
private double   typeTimer      = 0;
private boolean  textComplete   = false;
private static final double CHARS_PER_SEC = 40.0;

private Label speakerLabel = new Label();
private Label dialogueLabel = new Label();
private List<String> backlog = new ArrayList<>();

private void startDialogue(String speaker, String text) {
    speakerLabel.setText(speaker);
    dialogueLabel.setText("");
    fullText      = text;
    charIndex     = 0;
    typeTimer     = 0;
    textComplete  = false;
}

@Override
protected void onUpdate(double tpf) {
    if (!textComplete && !fullText.isEmpty()) {
        typeTimer += tpf;
        int targetChar = (int)(typeTimer * CHARS_PER_SEC);
        if (targetChar > charIndex) {
            charIndex = Math.min(targetChar, fullText.length());
            dialogueLabel.setText(fullText.substring(0, charIndex));
            if (charIndex >= fullText.length()) {
                textComplete = true;
                backlog.add(speakerLabel.getText() + ": " + fullText);
            }
        }
    }
}

// Click/space handler
private void onAdvance() {
    if (!textComplete) {
        // Skip to end of text immediately
        charIndex = fullText.length();
        dialogueLabel.setText(fullText);
        textComplete = true;
        backlog.add(speakerLabel.getText() + ": " + fullText);
    } else {
        advanceScript();
    }
}
```

## Choice Buttons

```java
private VBox choiceBox = new VBox(8);

private void showChoices(List<Choice> choices) {
    choiceBox.getChildren().clear();
    for (Choice c : choices) {
        Button btn = new Button(c.label());
        btn.setStyle("-fx-font-size: 16; -fx-background-color: #2a2a2a; -fx-text-fill: white;"
                + "-fx-border-color: #888; -fx-padding: 8 20;");
        btn.setOnAction(e -> {
            if (c.setFlag() != null && !c.setFlag().isEmpty()) {
                narrativeFlags.put(c.setFlag(), true);
            }
            choiceBox.setVisible(false);
            loadScene(c.targetSceneId());
        });
        choiceBox.getChildren().add(btn);
    }
    choiceBox.setLayoutX(getAppWidth() / 2.0 - 150);
    choiceBox.setLayoutY(getAppHeight() / 2.0 - choices.size() * 30);
    choiceBox.setVisible(true);
}
```

## Narrative Flags and Save

```java
private final Map<String, Object> narrativeFlags = new HashMap<>();
private String currentSceneId = "scene_01";

@Override
protected void initGameVars(Map<String, Object> vars) {
    vars.put("affectionAlice",  0);
    vars.put("affectionBob",    0);
    vars.put("chapterReached",  1);
}

private void saveProgress() {
    set("chapterReached", currentChapter);
    // Serialize flags to vars
    getSaveLoadService().saveAndForget("vn_save");
}

private void loadProgress() {
    getSaveLoadService().load("vn_save");
}

// At scene start: check flags for conditional branches
private ScriptNode resolveConditional(ScriptNode node, String flagKey, String trueTarget, String falseTarget) {
    boolean flag = narrativeFlags.getOrDefault(flagKey, false) instanceof Boolean b && b;
    return flag ? new BackgroundChange(trueTarget) : new BackgroundChange(falseTarget);
}
```

## Backlog Overlay

```java
private ScrollPane backlogPane = new ScrollPane();
private VBox backlogContent  = new VBox(4);

private void showBacklog() {
    backlogContent.getChildren().clear();
    backlog.forEach(line -> {
        Label l = new Label(line);
        l.setTextFill(Color.LIGHTGRAY);
        l.setWrapText(true);
        l.setMaxWidth(700);
        backlogContent.getChildren().add(l);
    });
    backlogPane.setContent(backlogContent);
    backlogPane.setVvalue(1.0);  // scroll to bottom
    backlogPane.setVisible(true);
}
```

## Gotchas

- **Skip-to-end on first click** — players should be able to click mid-typewriter to jump to the full
  text immediately. Advancing the script on the SAME click is jarring; only advance on the second click.
- **Background cross-fade needs two ImageViews** — swapping a single ImageView's image causes a flash.
  Fade `bgNext` in over `bgCurrent`, then copy image to `bgCurrent` and reset `bgNext` opacity.
- **Backlog list must not grow unbounded** — cap at 200 entries or the backlog ScrollPane becomes slow.
  `if (backlog.size() > 200) backlog.remove(0);` before adding.
- **Save at scene boundaries, not mid-dialogue** — saving mid-typewriter means loading back puts the
  player at a half-drawn line. Always save after a full scene transition.
- **Choice buttons must be removed before advancing** — set `choiceBox.setVisible(false)` before calling
  `loadScene`, or old buttons remain clickable during the next scene's dialogue.
- **Character sprites are per-expression** — load `name_happy.png` not `name.png`. Changing expression
  swaps the ImageView's image; the view position stays constant.
