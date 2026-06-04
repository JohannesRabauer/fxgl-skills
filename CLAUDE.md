# Claude Code Instructions for FXGL Skills

This repository stores canonical FXGL skill documents for AI-assisted coding.

## Use this repository like this

1. Start with `skills/index.json` to find relevant skills by name, category, tags, or triggers.
2. Read the selected `skills/*/SKILL.md` files for the full guidance.
3. Treat those Markdown files as the source of truth for this repository.
4. When working against real FXGL code, verify APIs against `../core-lib` and especially
   `../core-lib/fxgl-samples`.

## Rules

- Prefer FXGL 21.x patterns and Java 17+ examples.
- Do not invent missing APIs.
- Reuse the exact terminology and lifecycle used by FXGL.
- If multiple skills apply, combine them instead of forcing a single-skill answer.
