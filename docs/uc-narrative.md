# Use Cases — Cutscenes, Dialogue & Video

Covers the CutsceneService, dialogue graphs, the dialogue script runner, and video scenes.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])
    Player([Player])

    Dev --> UC1["UC-NAR-1\nPlay a text cutscene (line sequence)"]
    Dev --> UC2["UC-NAR-2\nLoad and play a dialogue graph"]
    Dev --> UC3["UC-NAR-3\nBranching dialogue with player choices"]
    Dev --> UC4["UC-NAR-4\nRun dialogue script conditionally"]
    Dev --> UC5["UC-NAR-5\nPlay a video cutscene"]
    Dev --> UC6["UC-NAR-6\nTrigger cutscene on collision"]
    Dev --> UC7["UC-NAR-7\nSkip cutscene"]
    Dev --> UC8["UC-NAR-8\nResume game after cutscene ends"]

    Player --> UC3
    Player --> UC7
```

## CutsceneService API

```mermaid
flowchart LR
    SReg["settings.addEngineService(CutsceneService.class)"] --> CS["CutsceneService"]
    CS --> PlayText["startCutscene(cutscene, onFinished)"]
    CS --> PlayVideo["startVideo(videoPath, onFinished)"]
    CS --> PlayDialogue["startDialogueScene(dialogueGraph, onFinished)"]
```

## Text Cutscene Structure

```mermaid
flowchart TD
    Lines["List of CutsceneLine\n  • talkerName\n  • lines: List of String"] --> Cutscene["Cutscene object"]
    Cutscene --> Start["getCutsceneService().startCutscene(cutscene, () -> resumeGame())"]
    Start --> Scene3["CutsceneScene displayed\n• pauses game loop\n• player clicks to advance\n• onFinished() called at end"]
```

## Dialogue Graph Structure

```mermaid
graph TD
    DG["DialogueGraph (.json file)"] --> Start2["StartNode"]
    Start2 --> Text2["TextNode\n(NPC speaking)"]
    Text2 --> Choice["ChoiceNode\n(player chooses)"]
    Choice --> Branch1["TextNode — Branch A"]
    Choice --> Branch2["TextNode — Branch B"]
    Branch1 --> Func["FunctionNode\n(execute game code)"]
    Branch2 --> End["EndNode"]
    Func --> End
```

## Dialogue Graph Loading & Playback

```mermaid
flowchart LR
    Load3["getAssetLoader().loadDialogueGraph('npc_quest.json')"] --> Graph["DialogueGraph"]
    Graph --> Start3["getCutsceneService().startDialogueScene(graph, () -> afterTalk())"]
    Start3 --> Runner["DialogueScriptRunner\n• advances nodes on player click\n• evaluates conditions on branches\n• fires function nodes as Runnable"]
```

## Branching Dialogue Use Case

```mermaid
sequenceDiagram
    participant NPC
    participant DialogueScene
    participant Player

    NPC->>DialogueScene: TextNode "Greetings traveller!"
    DialogueScene->>Player: display choices ["Help me", "Ignore"]
    Player->>DialogueScene: select "Help me"
    DialogueScene->>NPC: ChoiceNode routes to Branch A
    NPC->>DialogueScene: TextNode "Thank you!"
    DialogueScene->>DialogueScene: FunctionNode → startQuest("Rescue")
    DialogueScene-->>Player: EndNode → dialogue closed
```

## Dialogue Script Conditions

```mermaid
flowchart TD
    Cond["Condition on ChoiceNode branch"] --> Var2["Check world variable\ne.g. geti('gold') >= 100"]
    Var2 --> Show["Branch visible/hidden based on condition"]
    Show --> Dynamic["Dialogue tree is dynamic\nbranches appear/disappear at runtime"]
```

## Video Scene Use Case

```mermaid
flowchart LR
    Dev([Developer]) --> VS["getCutsceneService()\n.startVideo('intro.mp4', () -> gotoMainMenu())"]
    VS --> VideoScene2["VideoScene\n• plays full-screen video\n• ESC or click to skip"]
    VideoScene2 --> Callback["onFinished callback"]
```

## Collision-Triggered Cutscene Pattern

```mermaid
flowchart TD
    CH["onCollisionBegin(PLAYER, NPC_TRIGGER, (player, trigger) -> {"]
    CH --> Remove["trigger.removeFromWorld();"]
    Remove --> Load4["var graph = getAssetLoader().loadDialogueGraph('scene1.json');"]
    Load4 --> Play["getCutsceneService().startDialogueScene(graph, this::onDialogueDone);"]
    Play --> Pause2["game paused during dialogue"]
```
