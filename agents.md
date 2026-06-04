# FXGL Skills Repository Guide for Coding Agents

This repository stores reusable AI coding skills for **FXGL**. When working here, treat the
adjacent `../core-lib` repository as the **source of truth** for APIs, engine behavior, module
names, and sample usage patterns.

## Repository roles

- `../core-lib` — the actual FXGL codebase, modules, and samples to inspect before writing or
  changing any skill content
- `docs/` — domain and game-type analysis documents, including `uc-*.md` and `gt-*.md`
- `skills/` — final agent-facing skill packages, each in `skills/<skill-name>/SKILL.md`
- `skills/index.json` — machine-readable manifest for discovery by AI tools

## Primary rule

Do **not** invent FXGL APIs, lifecycle hooks, DSL calls, component names, services, or module
artifacts. Verify them against `../core-lib` first, preferably from both:

1. engine source in `fxgl*` modules
2. usage examples in `fxgl-samples`

If the API is uncertain, say so in the skill draft or leave a TODO note rather than presenting
guesses as facts.

## What good skill content looks like

Every skill should be practical, implementation-oriented, and optimized for code generation.
Follow the established pattern already used in this repo:

1. YAML front matter with:
   - `name`
   - `description`
   - `triggers`
   - `compatibility`
   - `category`
   - `tags`
   - `metadata`
   - `allowed-tools`
2. A clear title and short overview
3. Copyable Java examples that match real FXGL usage
4. Dependency or setup notes when relevant
5. A **Gotchas** section with failure-prone details
6. References to local supporting files when needed

## Authoring standards

- Target **Java 17+** and **FXGL 21.x** unless the repository clearly moves to a newer baseline.
- Prefer Java examples unless a request explicitly asks for Kotlin.
- Use the FXGL DSL consistently when that matches existing repo examples.
- Keep examples small but complete enough to paste into a real project.
- Explain engine ordering and lifecycle constraints when they matter.
- Call out asset paths, physics caveats, threading assumptions, and initialization order.
- Prefer precise terminology from FXGL source packages over generic game-dev wording.

## Naming and placement conventions

- Add new skills under `skills/fxgl-<topic>/SKILL.md`
- Add supporting references under `skills/fxgl-<topic>/references/`
- Keep domain analysis docs in `docs/uc-*.md`
- Keep game-type guidance in `docs/gt-*.md`
- Use lowercase kebab-case for new directories and files unless FXGL naming requires otherwise

## How to research before editing

Before writing a new skill or revising an existing one:

1. Find the relevant module(s) in `../core-lib`
2. Search for the public API in source
3. Search `fxgl-samples` for real usage
4. Capture the most common and the most failure-prone patterns
5. Write the skill around those proven patterns

## Content boundaries

- Focus on **how to build with FXGL**, not on generic Java tutorials
- Do not duplicate large chunks of engine source
- Do not include speculative roadmap features
- Do not describe behavior that is only true for another engine or plain JavaFX unless you label
  that distinction explicitly

## Preferred output for generated skills

When asked to create or update a skill, produce:

1. the `SKILL.md` file
2. any minimal supporting reference files required by that skill
3. an updated `skills/index.json` entry if skill metadata changed
4. related updates in `docs/` only if the repository structure or coverage changed materially

## Quality bar

A skill is ready when it is:

- grounded in the current FXGL codebase
- internally consistent with this repository's format
- actionable for an AI coding agent
- explicit about caveats that commonly break implementations
