# Use Cases — Particle System & Visual Effects

Covers ParticleEmitter configuration, built-in factory emitters, image-textured particles,
custom per-particle control functions, TrailParticleComponent, EffectComponent, and
screen-level effects (SlowTimeEffect, WobbleEffect).

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-FX-1\nSpawn one-shot burst at impact point"]
    Dev --> UC2["UC-FX-2\nAttach continuous emitter to entity"]
    Dev --> UC3["UC-FX-3\nColorize particles with source image texture"]
    Dev --> UC4["UC-FX-4\nCustom per-particle physics via setControl"]
    Dev --> UC5["UC-FX-5\nAttach motion trail to moving entity"]
    Dev --> UC6["UC-FX-6\nApply slow-time (bullet-time) effect"]
    Dev --> UC7["UC-FX-7\nApply wobble / screen-shake effect"]
    Dev --> UC8["UC-FX-8\nStack multiple effects on entity"]
    Dev --> UC9["UC-FX-9\nBuild fireworks display (rocket + burst)"]
    Dev --> UC10["UC-FX-10\nWorld-wide rain or smoke atmosphere"]
```

## Emitter Configuration API

```mermaid
flowchart TD
    PE["ParticleEmitter\n(or factory from ParticleEmitters)"] --> Count["setNumParticles(int)\nsetEmissionRate(0.0–1.0)\nsetMaxEmissions(int MAX_VALUE = infinite)"]
    PE --> Size["setSize(double min, double max)"]
    PE --> FnV["setVelocityFunction(\n  Function<Integer, Point2D>\n)"]
    PE --> FnA["setAccelerationFunction(\n  Supplier<Point2D>\n)"]
    PE --> FnE["setExpireFunction(\n  Function<Integer, Duration>\n)"]
    PE --> FnS["setScaleFunction(\n  Function<Integer, Point2D>\n) — per-particle scale delta"]
    PE --> FnSP["setSpawnPointFunction(\n  Function<Integer, Point2D>\n) — offset from entity origin"]
    PE --> Color["setStartColor(Color)\nsetEndColor(Color)"]
    PE --> Img["setSourceImage(Image)\n— colorize via texture().multiplyColor(c)\n   or texture().toColor(c)"]
    PE --> Blend["setBlendMode(BlendMode.ADD | SRC_OVER)"]
    PE --> Rot["setAllowParticleRotation(boolean)"]
    PE --> Interp["setInterpolator(Interpolators.EXPONENTIAL.EASE_OUT())"]
    PE --> Ctrl["setControl(Consumer<Particle>)\n— per-frame per-particle override"]
```

## Built-in Factory Emitters

```mermaid
graph LR
    F["ParticleEmitters"] --> Fire["newFireEmitter()\norange/red upward, fire-shaped"]
    F --> Expl["newExplosionEmitter(int radius)\noutward radial burst"]
    F --> Smoke["newSmokeEmitter()\ngrey billowing upward"]
    F --> Rain["newRainEmitter(int widthPx)\nblue-grey downward, covers width"]
```

## Attaching Emitter to Entity

```mermaid
flowchart LR
    Emitter["configured ParticleEmitter"] --> PC["new ParticleComponent(emitter)"]
    PC --> EB["entityBuilder()\n.at(x, y)\n.with(particleComponent)\n.buildAndAttach()"]
    EB --> OneShot{"one-shot or\ncontinuous?"}
    OneShot -->|one-shot| Expire[".with(new ExpireCleanComponent(duration))\n— auto-removes entity after burst"]
    OneShot -->|continuous| Bind["bind entity position to target\n e.xProperty().bind(...)"]
```

## UC-FX-1: One-Shot Burst at Impact Point

```mermaid
sequenceDiagram
    participant Col as Collision Handler
    participant World as Game World

    Col->>World: spawn entity at (hitX, hitY)
    Note over World: entityBuilder().at(hitX, hitY)\n.with(ParticleComponent(explosion))\n.with(ExpireCleanComponent(Duration.seconds(1)))\n.buildAndAttach()
    World-->>Col: entity auto-removed after 1s
```

## UC-FX-3: Textured Particles with Colorization

```mermaid
flowchart TD
    Tex["texture('particles/flare_01.png', 64, 64)"] --> MC["multiplyColor(color)\n— tints while preserving shape"]
    Tex --> TC["toColor(color)\n— fully recolors to flat tone"]
    MC --> SI["emitter.setSourceImage(colorizedImage)"]
    TC --> SI
    SI --> Result["particles render as image\ninstead of solid rectangle"]
```

Available particle sprite names (from `assets/textures/particles/`):
`circle_01–05`, `dirt_01–03`, `fire_01–02`, `flame_01–06`, `flare_01`, `light_01–03`,
`magic_01–05`, `muzzle_01–05`, `scorch_01–03`, `spark_01–07`, `star_01–09`,
`smoke_01–10`, `slash_01–04`, `twirl_01–03`, `trace_01–07`, `symbol_01–02`, `window_01–04`

## UC-FX-4: Custom Per-Particle Physics (setControl)

```mermaid
flowchart TD
    Ctrl["emitter.setControl(Consumer<Particle> fn)"] --> Loop["called every frame for each live particle"]
    Loop --> Access["Particle fields:\n• p.position (Vec2)\n• p.velocity (Vec2)\n• p.acceleration (Vec2)"]
    Access --> UseCases["Use cases:\n• noise-field steering\n• attractor/repulsor\n• boundary bounce\n• swarm behaviour"]
```

## UC-FX-5: Motion Trail on Moving Entity

```mermaid
flowchart LR
    Trail["TrailParticleComponent\n(emitter, Duration.millis(interval))"] --> Add["entity.addComponent(trail)"]
    Add --> Auto["spawns one particle at\nentity position every interval ms"]
    Auto --> Fade["particle fades via\nsetEndColor transparent"]
```

## UC-FX-6 / UC-FX-7: EffectComponent Effects

```mermaid
flowchart TD
    EC["entity.addComponent(new EffectComponent())"] --> Start["effectComponent.startEffect(effect)"]
    Start --> ST["SlowTimeEffect(Duration)\n— scales tpf for all entity updates\n— does NOT affect timers or JavaFX animations"]
    Start --> WE["WobbleEffect(Duration)\n— sine-wave offset on entity position\n— best on camera anchor for screen-shake"]
    Start --> Stack["multiple effects stack;\neach expires independently"]
```

## UC-FX-9: Fireworks Display Pattern

```mermaid
flowchart LR
    Timer["run(interval)"] --> Rocket["spawn rocket entity\n+ ProjectileComponent upward\n+ ExpireCleanComponent"]
    Rocket --> Expire["on expire callback:\nspawn newExplosionEmitter at rocket position\nwith random color + ADD blend mode"]
    Expire --> Gravity["particles arc and fall\nvia setAccelerationFunction with Y gravity"]
```

## UC-FX-10: Atmospheric Rain / Smoke

```mermaid
flowchart TD
    Rain["ParticleEmitters.newRainEmitter(getAppWidth())"] --> Attach["entity at (0, 0) with ParticleComponent"]
    Attach --> Colorize["emitter.setSourceImage(texture('rain.png').multiplyColor(Color.BLUE))"]
    Smoke2["ParticleEmitters.newSmokeEmitter()"] --> SConf["setSize(15,30)\nsetNumParticles(10)\nsetEmissionRate(0.25)\nsetStartColor + setEndColor"]
```

## Gotcha Summary

| Gotcha | Rule |
|--------|------|
| Missing `ExpireCleanComponent` | One-shot emitters leak entities forever — always pair |
| `BlendMode.ADD` on light backgrounds | Switch to `BlendMode.SRC_OVER` |
| High-rate `TrailParticleComponent` | Each trail particle is its own entity — profile at high counts |
| `setControl` modifies velocity/acceleration | Do not fight the base velocity/acceleration unless you zero them first |
| `setVelocityFunction` vs `setVelocityX/Y` | FXGL uses function-based API; `setVelocityX/Y` does not exist |
| `SlowTimeEffect` scope | Affects entity `onUpdate()` tpf only — not `run()` timers or JavaFX |
