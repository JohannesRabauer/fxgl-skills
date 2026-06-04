# FXGL AI Coding Skills — Use-Case Catalogue

This catalogue documents all relevant use-cases derived from the FXGL core library
(`com.almasb.fxgl`) and its sample projects. Each file contains one or more
Mermaid diagrams covering a specific domain. These use-cases define the scope of
AI coding skills that can be implemented to assist developers building games with FXGL.

## Domain Index

| File | Domain |
|------|---------|
| [uc-overview.md](uc-overview.md) | Full mind-map of all FXGL domains |
| [uc-game-lifecycle.md](uc-game-lifecycle.md) | Game application bootstrap and lifecycle |
| [uc-entity-component-system.md](uc-entity-component-system.md) | Entity–Component–System (ECS) |
| [uc-physics-collision.md](uc-physics-collision.md) | Box2D physics and collision handling |
| [uc-input.md](uc-input.md) | Keyboard, mouse, controller and virtual input |
| [uc-animation.md](uc-animation.md) | Animation builder, sprite sheets, property animation |
| [uc-audio.md](uc-audio.md) | Sound effects and music |
| [uc-ui-scenes.md](uc-ui-scenes.md) | HUD, menus, dialogs, sub-scenes and viewport |
| [uc-level-assets.md](uc-level-assets.md) | Tiled maps, text levels and asset loading |
| [uc-variables-events.md](uc-variables-events.md) | World properties, reactive bindings and event bus |
| [uc-save-load.md](uc-save-load.md) | Save and load game state |
| [uc-progression.md](uc-progression.md) | Achievements and quest system |
| [uc-narrative.md](uc-narrative.md) | Cutscenes, video scenes and dialogue graphs |
| [uc-minigames.md](uc-minigames.md) | Built-in mini-game system |
| [uc-economy.md](uc-economy.md) | Inventory and trade/shop system |
| [uc-multiplayer.md](uc-multiplayer.md) | Multiplayer, networking and replication |
| [uc-ai.md](uc-ai.md) | Pathfinding, GOAP and sense AI |
| [uc-intelligence.md](uc-intelligence.md) | Face detection, gesture, speech recognition and TTS |
| [uc-particles-effects.md](uc-particles-effects.md) | Particle system and visual effects |
| [uc-scene3d.md](uc-scene3d.md) | 3D scene, camera and model loading |
| [uc-procedural.md](uc-procedural.md) | Procedural dungeon and maze generation |
| [uc-dev-tools.md](uc-dev-tools.md) | Developer console, entity inspector and profiler |

## Skill Implementation Priority

```mermaid
quadrantChart
    title Skill Priority Matrix (Impact vs Implementation Effort)
    x-axis Low Effort --> High Effort
    y-axis Low Impact --> High Impact
    quadrant-1 Implement First
    quadrant-2 Plan Carefully
    quadrant-3 Low Priority
    quadrant-4 Quick Wins
    Game Lifecycle: [0.15, 0.95]
    ECS Patterns: [0.25, 0.92]
    Physics & Collision: [0.45, 0.88]
    Input Handling: [0.20, 0.85]
    Animation: [0.35, 0.80]
    Level Loading (Tiled): [0.40, 0.82]
    Save / Load: [0.30, 0.75]
    Audio: [0.15, 0.70]
    UI & HUD: [0.35, 0.78]
    Achievements: [0.25, 0.65]
    Quests: [0.40, 0.70]
    Dialogue / Cutscene: [0.55, 0.72]
    Particles: [0.30, 0.60]
    Mini-Games: [0.60, 0.65]
    Inventory / Trade: [0.55, 0.60]
    AI Pathfinding: [0.55, 0.75]
    Multiplayer: [0.80, 0.70]
    3D Scene: [0.75, 0.55]
    Procedural Gen: [0.65, 0.58]
    Intelligence (ML): [0.85, 0.45]
```
