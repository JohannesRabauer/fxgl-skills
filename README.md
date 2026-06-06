# FXGL Skills

Canonical, tool-agnostic coding skills for AI-assisted FXGL game development (Java 17+, FXGL 21.x).
Compatible with Claude Code, GitHub Copilot, Cursor, and any MCP-capable AI tool.

**[Browse skills →](https://johannesrabauer.github.io/fxgl-skills/)**  &nbsp;|&nbsp;  **[MCP Server →](https://smithery.ai/servers/rabauer-dev/fxgl-skills)**

---

## Install

### Claude Code — MCP server (recommended)

Gives your AI assistant direct access to all skills via `list_skills`, `get_skill`, and `search_skills` tools:

```bash
claude mcp add fxgl-skills -- npx --package=fxgl-skills -y fxgl-skills-mcp
```

Or install from [smithery.ai](https://smithery.ai/servers/rabauer-dev/fxgl-skills) with one click.

### Any MCP client

Point your client at the hosted endpoint:

```
https://fxgl-skills-mcp.onrender.com/mcp
```

### npm — programmatic access

```bash
npm install fxgl-skills
```

```js
import { skills, getSkill, getSkillContent } from 'fxgl-skills';

const skill = getSkill('fxgl-platformer'); // metadata + full SKILL.md content
const all   = skills;                       // array of all skill metadata
```

### Manual — copy into your project

Download [fxgl-skills.zip](https://github.com/JohannesRabauer/fxgl-skills/releases/latest/download/fxgl-skills.zip)
and drop the `skills/` folder wherever your AI tool can read it, then point your tool at
`skills/index.json` to start.

---

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

## Game-type skill groups

Game-type skills are grouped in two ways:

- human-facing lists in this README
- machine-readable groups in `skills/index.json` under `skillGroups`

### 2D game-type skills

`fxgl-brawler`, `fxgl-breakout`, `fxgl-bullet-hell`, `fxgl-card-game`, `fxgl-endless-runner`,
`fxgl-fighting`, `fxgl-idle-clicker`, `fxgl-match3`, `fxgl-metroidvania`, `fxgl-pinball`,
`fxgl-platformer`, `fxgl-racing`, `fxgl-rhythm`, `fxgl-roguelike`, `fxgl-rpg`, `fxgl-shmup`,
`fxgl-snake`, `fxgl-stealth`, `fxgl-strategy-rts`, `fxgl-tactical-rpg`, `fxgl-topdown`,
`fxgl-tower-defense`, `fxgl-visual-novel`

### 3D game-type skills

`fxgl-fps-3d`, `fxgl-third-person-3d`, `fxgl-voxel`

For generic 3D primitives, models, and camera setup, use `fxgl-scene3d` alongside the 3D
game-type skill.

## Workflow skills

`fxgl-project-starter`

Use workflow skills to orchestrate discovery, documentation, scaffolding, and coordination across
multiple FXGL subsystem skills.

### Coverage notes

- `docs/uc-overview.md` is a catalog / index document, not a single skill target.
- `docs/gt-tactical.md` is covered by `fxgl-tactical-rpg`.

## Compatibility notes

- Baseline target: **Java 17+**
- FXGL baseline: **21.x**
- The skill files are canonical; adapter files should point back to them rather than duplicating
  their content.
