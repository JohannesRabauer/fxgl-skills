# Dialogue Graph JSON Format Reference

Load this file when creating or editing `.json` dialogue graph files used by `CutsceneService.startDialogueScene()`.

## File Location

```
assets/dialogues/my_dialogue.json
```

Loaded via:
```java
DialogueGraph graph = getAssetLoader().loadDialogueGraph("my_dialogue.json");
```

## Top-Level Structure

```json
{
  "nodes": [ ... ],
  "edges": [ ... ]
}
```

---

## Node Types

### START Node

Exactly one per graph. The entry point — no inbound edges allowed.

```json
{
  "id": 0,
  "type": "START",
  "text": ""
}
```

### END Node

At least one per graph (can have multiple for branching endings).

```json
{
  "id": 99,
  "type": "END",
  "text": ""
}
```

### TEXT Node

Displays a line of dialogue. The NPC/narrator speaks `text`.

```json
{
  "id": 1,
  "type": "TEXT",
  "text": "Welcome, traveller. What brings you to our village?"
}
```

### CHOICE Node

Presents the player with labelled options. Each option maps to an outbound edge.
The `text` is the NPC prompt displayed above the options.

```json
{
  "id": 2,
  "type": "CHOICE",
  "text": "How can I help you?",
  "options": [
    "Tell me about the dungeon.",
    "I need supplies.",
    "Never mind."
  ]
}
```

Edges from a CHOICE node must match the number of options (one edge per option, ordered).

### FUNCTION Node

Executes a named function in Java when traversed. No visible dialogue is shown.

```json
{
  "id": 3,
  "type": "FUNCTION",
  "text": "giveQuestItem"
}
```

Register the handler in Java:
```java
graph.addFunctionHandler("giveQuestItem", () -> {
    spawn("questItem", player.getX(), player.getY());
    inc("questItems", 1);
});
```

### BRANCH Node

Evaluates a named boolean condition. Follows the `true` or `false` outbound edge automatically.

```json
{
  "id": 4,
  "type": "BRANCH",
  "text": "hasQuestItem"
}
```

Register the condition in Java:
```java
graph.addConditionHandler("hasQuestItem", () -> geti("questItems") > 0);
```

Edges from a BRANCH node: first edge = `true` path, second edge = `false` path.

---

## Edge Structure

```json
{
  "sourceID": 0,
  "targetID": 1
}
```

For CHOICE nodes — edges must be ordered to match option indices:
```json
{ "sourceID": 2, "targetID": 10 },   // option 0 → node 10
{ "sourceID": 2, "targetID": 11 },   // option 1 → node 11
{ "sourceID": 2, "targetID": 12 }    // option 2 → node 12
```

For BRANCH nodes — edges must be ordered: first = `true`, second = `false`:
```json
{ "sourceID": 4, "targetID": 20 },   // true path
{ "sourceID": 4, "targetID": 21 }    // false path
```

---

## Complete Example

```json
{
  "nodes": [
    { "id": 0,  "type": "START",    "text": "" },
    { "id": 1,  "type": "TEXT",     "text": "Greetings, adventurer!" },
    { "id": 2,  "type": "CHOICE",   "text": "What do you seek?",
      "options": ["The dungeon key.", "Nothing."] },
    { "id": 3,  "type": "BRANCH",   "text": "hasKey" },
    { "id": 4,  "type": "TEXT",     "text": "You already have the key. Go forth!" },
    { "id": 5,  "type": "FUNCTION", "text": "giveKey" },
    { "id": 6,  "type": "TEXT",     "text": "Here, take this key." },
    { "id": 7,  "type": "TEXT",     "text": "Safe travels." },
    { "id": 8,  "type": "END",      "text": "" },
    { "id": 9,  "type": "END",      "text": "" }
  ],
  "edges": [
    { "sourceID": 0, "targetID": 1 },
    { "sourceID": 1, "targetID": 2 },
    { "sourceID": 2, "targetID": 3 },   // "The dungeon key." → branch
    { "sourceID": 2, "targetID": 7 },   // "Nothing." → farewell
    { "sourceID": 3, "targetID": 4 },   // hasKey = true
    { "sourceID": 3, "targetID": 5 },   // hasKey = false → give key
    { "sourceID": 4, "targetID": 8 },
    { "sourceID": 5, "targetID": 6 },
    { "sourceID": 6, "targetID": 8 },
    { "sourceID": 7, "targetID": 9 }
  ]
}
```

---

## Node ID Rules

- IDs must be unique integers within the file.
- IDs have no required ordering — use any numbering scheme.
- The START node ID is typically `0` by convention but can be any value.
- FXGL resolves the START node by type, not by ID.

## Text Formatting

- `text` fields support plain UTF-8 strings.
- Newlines (`\n`) in text strings are rendered as line breaks in the dialogue box.
- FXGL does not support rich text (bold, italic, color) in dialogue text by default.
  Override `DialogueScene` CSS to style the text node.

## Localisation

Store one JSON file per locale:
```
assets/dialogues/intro_en.json
assets/dialogues/intro_de.json
assets/dialogues/intro_ja.json
```

Select at load time:
```java
String locale = getSettings().getLanguage().getName().toLowerCase().substring(0, 2);
DialogueGraph graph = getAssetLoader().loadDialogueGraph("intro_" + locale + ".json");
```
