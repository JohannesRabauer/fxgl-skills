# GitHub Copilot Instructions for FXGL Skills

Use this repository as a skill catalog for FXGL.

## Preferred workflow

1. Read `skills/index.json` first.
2. Select the most relevant `skills/*/SKILL.md` files using `triggers`, `tags`, and `category`.
3. Use those skill files as the canonical repository guidance.
4. Validate FXGL APIs and behavior against `../core-lib` and `../core-lib/fxgl-samples`.

## Important constraints

- Target Java 17+ and FXGL 21.x unless the repository clearly states otherwise.
- Do not invent DSL methods, services, components, or lifecycle hooks.
- Keep generated solutions aligned with real FXGL samples when possible.
