# arc42-lite Outline for FXGL Starter Projects

Use a practical starter subset instead of a full heavyweight architecture document.

## Suggested Sections

```md
# Architecture Overview (arc42-lite)

## 1. Goals and Scope
- one-paragraph product summary
- first milestone scope

## 2. Constraints
- Java version
- FXGL version
- target platform
- delivery constraints

## 3. Context
- player / user
- external tools or services
- runtime environment

## 4. Solution Strategy
- why FXGL
- why this game/app structure
- major selected subsystems

## 5. Building Blocks
- app bootstrap
- gameplay systems
- UI
- persistence
- content pipeline
- testing

## 6. Runtime Flow
- startup sequence
- core gameplay loop
- save/load or progression flow

## 7. Risks and Technical Debt
- biggest unknowns
- deferred decisions
```

## Rule

Every section should stay short and implementation-relevant. If a section would contain only
generic filler, leave it concise rather than padding it.
