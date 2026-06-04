---
name: fxgl-project-starter
description: >
  Start a new FXGL project through a bounded Socratic discovery flow, then turn the answers into
  a docs-first starter specification with ADRs, an arc42-lite architecture summary, and Mermaid
  use-case diagrams before scaffolding the project itself. Continue using the same questioning
  approach for initialization choices, and require documentation updates plus automated tests for
  every implemented step.
triggers:
  - start fxgl project
  - bootstrap new game
  - fxgl starter
  - project inception
  - socratic questions
  - arc42
  - adr
  - docs first
  - architecture brief
  - scaffold fxgl
compatibility: >
  Java 17+, FXGL 21.x. Works best when combined with fxgl-game-lifecycle and the relevant
  game-type skills chosen during project discovery.
category: fxgl/workflow
tags:
  - fxgl
  - java
  - javafx
  - workflow
  - starter
  - documentation
  - testing
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
# FXGL Project Starter

## Purpose

Use this skill when the goal is not just "write some FXGL code", but to **start a project
correctly**:

1. discover what the user actually wants to build
2. turn that into a reviewable project specification
3. scaffold the project only after the documentation is agreed
4. keep docs, implementation, and tests synchronized from the first commit

This is a **workflow/orchestration skill**. It should usually invoke more specialized skills
after the starter specification is complete.

## Execution Modes

This skill must support two modes.

### 1. Interactive Socratic Mode

Ask one focused question at a time. Use the bounded question flow from
[references/question-flow.md](references/question-flow.md).

### 2. Default Mode

If no interactive user is available, proceed with conservative defaults:

- Java
- Maven
- 2D game
- local single-player
- desktop target
- no networking
- no save/load unless explicitly requested
- no AI/ML features unless explicitly requested

Never block indefinitely waiting for answers if the runtime is non-interactive.

## Bounded Socratic Rule

Do **not** ask unbounded exploratory questions forever. Ask just enough to unlock project
decisions, then move to documentation.

Minimum topics to resolve:

1. game/app type
2. target platform
3. 2D or 3D
4. input model
5. progression / save expectations
6. technical baseline (Java, build tool, modules)

If the answers remain partial after the bounded flow, document the assumptions and proceed.

## Docs-First Checkpoint

Before generating any Java source files, verify that the starter specification exists and is
populated. The minimum documentation set is:

- `docs/project-brief.md`
- `docs/use-cases/core-use-cases.md`
- `docs/architecture/arc42-lite.md`
- at least one ADR under `docs/architecture/adr/`

If these files do not exist yet, create them first.

## Required Documentation Outputs

### Project Brief

A short, easy-to-scan summary for humans:

- one-paragraph game / app summary
- core player loop or primary workflow
- success criteria
- top risks
- current scope and out-of-scope items

### ADRs

Use ADRs only for **important, hard-to-reverse decisions**:

- 2D vs 3D
- Maven vs Gradle
- single scene vs room/level-based structure
- physics-heavy vs non-physics design
- multiplayer or not

Use the template in [references/adr-template.md](references/adr-template.md).

### arc42-lite

Use a practical starter subset, not a bloated architecture book. Follow
[references/arc42-lite-outline.md](references/arc42-lite-outline.md).

Include:

1. goals and scope
2. constraints
3. context
4. solution strategy
5. building blocks
6. runtime flow
7. risks / technical debt

### Mermaid Use-Case Diagrams

At minimum, create:

- actor + main use cases
- core runtime flow
- one system decomposition diagram if the project already has clear subsystems

## Suggested Output Layout in the Created Project

```text
docs/
├── project-brief.md
├── implementation-plan.md
├── use-cases/
│   └── core-use-cases.md
└── architecture/
    ├── arc42-lite.md
    └── adr/
        ├── 0001-project-shape.md
        └── 0002-build-and-runtime-baseline.md
```

## Project Initialization Step

After the starter specification is approved:

1. choose Java vs Kotlin
2. choose Maven vs Gradle
3. choose package name
4. choose app name and main class
5. choose minimal FXGL feature set
6. create the project skeleton
7. add the initial `GameApplication` scaffold

For lifecycle hook implementation, load **fxgl-game-lifecycle**.

For game-specific behavior, load the chosen game-type skill(s).

## Minimal Scaffold Expectations

The initialized project should include:

- build file (`pom.xml` or `build.gradle`)
- main app class extending `GameApplication`
- initial `initSettings()`
- placeholder lifecycle hooks as needed
- `src/main/resources/assets/` structure
- `docs/` starter specification files
- `src/test/` with initial automated test scaffold

## Testing Rule

"Every step is tested" means:

### Tier 1 — pure unit tests

Use standard JUnit tests for:

- rules
- calculations
- save data transformations
- progression logic
- non-FXGL domain models

### Tier 2 — FX / JavaFX tests

Use `@ExtendWith(RunWithFX.class)` for:

- JavaFX node creation
- FXGL texture / UI related helpers
- logic that requires JavaFX initialization

### Tier 3 — launch smoke tests

Only when the environment supports it, add an optional FXGL application boot test.

Do **not** pretend every environment can run a full display-backed game launch.

See [references/test-strategy.md](references/test-strategy.md).

## Synchronization Rule

For each implemented project step:

1. update the relevant documentation first
2. implement code
3. add or update automated tests
4. verify docs still describe the actual behavior

If implementation changes invalidate the current ADR or architecture summary, update the docs in
the same change set.

## Recommended Skill Composition

This skill is the entry point. After the project brief is approved, combine it with:

- `fxgl-game-lifecycle` for application bootstrap
- the selected game-type skill such as `fxgl-platformer`, `fxgl-topdown`, `fxgl-rpg`, etc.
- `fxgl-ui-scenes`, `fxgl-save-load`, `fxgl-level-assets`, or other subsystem skills as needed

## Gotchas

- **Socratic questioning must be bounded** — endless discovery loops are not progress.
- **Do not generate code before the minimum docs exist** — this skill is explicitly docs-first.
- **Full arc42 is too heavy at project start** — use the practical arc42-lite subset, then expand
  only if the project truly needs it.
- **ADRs are for major decisions only** — do not create one ADR per tiny implementation choice.
- **Automated tests must match the environment** — pure unit tests are mandatory; display-backed
  launch tests may need to be gated.
- **This skill should not replace specialized FXGL skills** — it selects and sequences them.
