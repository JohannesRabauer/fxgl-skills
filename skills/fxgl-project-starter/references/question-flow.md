# Project Starter Question Flow

Use a bounded question sequence. Ask **one question at a time** and stop asking once the minimum
starter specification is unblocked.

## Recommended Flow

```mermaid
flowchart TD
    Q1["Q1: What kind of project is this?\n(game type / app type / core fantasy)"] --> Q2["Q2: Is it 2D or 3D?"]
    Q2 --> Q3["Q3: Who is the player / primary user and what is the core loop?"]
    Q3 --> Q4["Q4: What platform(s) matter first?\ndesktop / mobile / web"]
    Q4 --> Q5["Q5: Single-player, local multiplayer, or online?"]
    Q5 --> Q6["Q6: What input model is primary?\nkeyboard, mouse, controller, touch"]
    Q6 --> Q7["Q7: Is save/load needed in the first milestone?"]
    Q7 --> Q8["Q8: Which build baseline?\nJava vs Kotlin, Maven vs Gradle"]
    Q8 --> Q9["Q9: Which features are explicitly out of scope for v1?"]
    Q9 --> Ready["Enough information to write starter specification"]
```

## Stop Conditions

Stop asking more questions once you can fill:

- project brief
- one ADR for project shape
- one ADR for technical baseline
- core use-case diagram
- initial scaffold choices

## Default Answers if No User Reply

- project type: 2D single-player prototype
- platform: desktop
- input: keyboard
- save/load: no
- language: Java
- build tool: Maven
