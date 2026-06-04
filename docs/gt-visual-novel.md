# Game Type — Visual Novel

Covers story-driven games with backgrounds, character sprites, typewriter dialogue, branching choices, and flags affecting narrative routes.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-VN-1\nFull-screen background image changes"]
    Dev --> UC2["UC-VN-2\nCharacter sprites at Left/Center/Right positions"]
    Dev --> UC3["UC-VN-3\nTypewriter text effect (reveal letter by letter)"]
    Dev --> UC4["UC-VN-4\nDialogue advance on click or key press"]
    Dev --> UC5["UC-VN-5\nChoice buttons pause dialogue for player pick"]
    Dev --> UC6["UC-VN-6\nNarrative flags affect which scenes play"]
    Dev --> UC7["UC-VN-7\nChapter auto-save on scene boundary"]
    Dev --> UC8["UC-VN-8\nSave/load from any chapter"]
    Dev --> UC9["UC-VN-9\nBackground music cross-fade per scene"]
    Dev --> UC10["UC-VN-10\nCG gallery: unlock seen scenes"]
```

## Scene Structure

```mermaid
flowchart TD
    ScriptFile["script file or\nDialogueGraph JSON"] --> SceneNode["Scene node: background + music\ncharacter entries/exits\ndialogue lines"]
    SceneNode --> DialogueLine["each line:\n• speaker name\n• text content\n• optional voice clip\n• character expression change"]
    DialogueLine --> ChoiceNode["choice node:\n• 2-4 options\n• each sets flag + branches to scene"]
    ChoiceNode --> NextScene["load next scene based on choice + flags"]
```

## Typewriter Text Effect

```mermaid
flowchart LR
    StartLine["new dialogue line received"] --> RevealTimer["timer fires every 30ms"]
    RevealTimer --> ShowChar["reveal one more character\ntextLabel.setText(fullText.substring(0, charIndex++))"]
    ShowChar --> Complete["charIndex >= fullText.length()"]
    Complete --> WaitInput["pause, wait for ADVANCE input"]
    AdvanceKey["ADVANCE pressed during reveal"] --> SkipToEnd["instantly show full text\nstop reveal timer"]
```

## Character Sprite Management

```mermaid
flowchart TD
    SpriteSlots["3 sprite positions:\nLEFT (x=200), CENTER (x=640), RIGHT (x=1080)"] --> ShowChar2["showCharacter(name, expression, position):\n  load texture 'name_expression.png'\n  fade in with animationBuilder\n  tint dim if not currently speaking"]
    ShowChar2 --> HideChar["hideCharacter(name):\n  fade out, remove node"]
    ShowChar2 --> HighlightSpeaker["setSpeaker(name):\n  brighten active speaker\n  dim others"]
```

## Narrative Flag System

```mermaid
flowchart LR
    Choice["player makes choice"] --> SetFlag["set('flag_nameHeard', true)\nor inc('affection_alice', 10)"]
    SetFlag --> BranchCheck["at branch node in script:\nif getb('flag_nameHeard'):\n  load 'scene_C'\nelse:\n  load 'scene_D'"]
    BranchCheck --> MergeBack["scenes re-converge\nat common story beats"]
```

## Auto-Save Pattern

```mermaid
flowchart TD
    SceneBoundary["scene transition (chapter start)"] --> AutoSave["getSaveLoadService().saveAndForget('autosave')"]
    SaveSlot["save menu: player picks slot"] --> ManualSave["getSaveLoadService().saveAndForget('slot_' + slotId)"]
    LoadMenu["load menu: list save slots"] --> LoadSave["getSaveLoadService().load('slot_' + slotId)"]
    LoadSave --> RestoreScene["set all flags\nskip to saved scene/chapter\nrestore music + background"]
```

## VN Scene as GameSubScene

```mermaid
flowchart LR
    VNScene["VNSubScene extends GameSubScene"] --> Background["full-screen background ImageView"]
    VNScene --> SpriteLayer["character sprite nodes"]
    VNScene --> DialogueBox["text box at bottom:\n  speakerNameLabel\n  dialogueTextLabel (typewriter)\n  advancePrompt triangle"]
    VNScene --> ChoiceLayer["choice buttons (hidden until needed)"]
```
