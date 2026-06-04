# FXGL Skills

`fxgl-skills` is a repository of reusable **AI coding skills for FXGL**.

The canonical source of truth is:

- `skills/*/SKILL.md` — one skill per directory, written in Markdown with YAML front matter
- `skills/index.json` — machine-readable manifest for discovery and routing
- `agents.md` / `AGENTS.md` — repository-level instructions for coding agents

## Goal

Make FXGL implementation guidance easy to consume by humans, GitHub Copilot, Claude Code,
Cursor, and generic agent runtimes without locking the content into any single tool format.

## Repository layout

| Path | Purpose |
|---|---|
| `skills/*/SKILL.md` | Canonical skill documents |
| `skills/index.json` | Tool-friendly skill inventory |
| `docs/` | Domain and game-type analysis docs |
| `agents.md` | Main repository guidance for coding agents |
| `AGENTS.md` | Compatibility entry point for agent tools |
| `.github/copilot-instructions.md` | GitHub Copilot-specific adapter |
| `CLAUDE.md` | Claude Code-specific adapter |
| `.cursor/rules/fxgl-skills.mdc` | Cursor-specific adapter |

## Canonical skill format

Every skill lives in `skills/<skill-name>/SKILL.md` and uses YAML front matter with these fields:

- `name`
- `description`
- `triggers`
- `compatibility`
- `category`
- `tags`
- `metadata`
- `allowed-tools`

This keeps the repository readable as plain Markdown while still being easy to index.

## How tools should consume this repo

1. Read `skills/index.json` to discover candidate skills.
2. Select one or more relevant `skills/*/SKILL.md` files by `category`, `tags`, or `triggers`.
3. Use those skills as implementation guidance.
4. When API details matter, verify them against the adjacent FXGL source repository at
   `../core-lib`.

## Compatibility notes

- Baseline target: **Java 17+**
- FXGL baseline: **21.x**
- The skill files are canonical; adapter files should point back to them rather than duplicating
  their content.
