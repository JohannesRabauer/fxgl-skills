# Test Strategy for New FXGL Projects

Use these three tiers from the first milestone.

## Tier 1 — Pure Unit Tests

Use for:

- scoring rules
- combat calculations
- progression formulas
- save data mappers
- configuration parsing

These should exist for every meaningful gameplay rule that can be tested without launching FXGL.

## Tier 2 — FX / JavaFX Tests

Use `@ExtendWith(RunWithFX.class)` when JavaFX must be initialized.

Typical use cases:

- UI helper creation
- node factories
- JavaFX-dependent rendering helpers
- texture-related helpers

## Tier 3 — Optional Launch Smoke Test

Use only when the environment supports it.

Typical purpose:

- verify the app can launch
- verify core lifecycle hooks are wired

Do not make the whole starter flow depend on a display-backed launch test.
