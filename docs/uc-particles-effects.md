# Use Cases — Particle System & Visual Effects

Covers particle emitters, the particle system, trail particles, slow-time effect, wobble effect,
and effect composition via EffectComponent.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-FX-1\nSpawn particle emitter at position"]
    Dev --> UC2["UC-FX-2\nAttach continuous trail to entity"]
    Dev --> UC3["UC-FX-3\nCreate explosion / impact burst"]
    Dev --> UC4["UC-FX-4\nCreate fire / smoke / rain emitter"]
    Dev --> UC5["UC-FX-5\nApply slow-time effect (bullet time)"]
    Dev --> UC6["UC-FX-6\nApply wobble / screen-shake effect"]
    Dev --> UC7["UC-FX-7\nStack multiple effects on entity"]
    Dev --> UC8["UC-FX-8\nRemove / expire effect after duration"]
    Dev --> UC9["UC-FX-9\nConvert image to particle animation"]
    Dev --> UC10["UC-FX-10\nCreate fireworks display"]
```

## Particle Emitter Configuration

```mermaid
flowchart TD
    PE["ParticleEmitter"] --> Props["Configure properties\n• numParticles\n• emissionRate\n• size (min/max)\n• speed (min/max)\n• lifetime (min/max)\n• color + colorFunction\n• blendMode"]
    Props --> Emitters["Pre-built factory methods:\nParticleEmitters.newFireEmitter()\nParticleEmitters.newExplosionEmitter(radius)\nParticleEmitters.newSmokeEmitter()\nParticleEmitters.newRainEmitter()"]
```

## Particle Emitter Spawning

```mermaid
flowchart LR
    A3["ParticleComponent pc\n= new ParticleComponent(emitter)"] --> Attach2["entityBuilder()\n.at(x, y)\n.with(pc)\n.buildAndAttach()"]
    Attach2 --> Expire2["add ExpireCleanComponent\nto auto-remove after burst"]
    OneShot["one-shot burst"] --> Expire2
    Continuous2["continuous trail\n(follow entity)"] --> NoExpire["no expire component needed"]
```

## TrailParticleComponent (Entity Trail)

```mermaid
flowchart LR
    TPC["TrailParticleComponent\n(emitter, durationBetweenParticles)"] --> With["entity.addComponent(trailComponent)"]
    With --> AutoTrail["spawns particles at entity position\nevery N milliseconds\ncreates motion trail effect"]
```

## EffectComponent & Effect Stacking

```mermaid
flowchart TD
    EC["EffectComponent"] --> Add5["entity.addComponent(new EffectComponent())"]
    Add5 --> Apply["effectComponent.startEffect(new SlowTimeEffect(duration))"]
    Apply --> Stack2["Multiple effects stack\nand expire independently"]
    Stack2 --> List2["effectComponent.effects() → observable list"]
```

## Built-in Effects

```mermaid
graph TD
    Effects["Built-in Effects"] --> SlowTime["SlowTimeEffect\n• slows all entity update speeds\n• duration-based\n• extends AbstractEffect"]
    Effects --> Wobble["WobbleEffect\n• applies sine-wave offset to entity position\n• creates screen-shake / jello feeling"]
    Effects --> Custom3["Custom Effect\nextend AbstractEffect\noverride onStart() onEnd() onUpdate(tpf)"]
```

## Slow-Time Effect Use Case

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant EffectComp as EffectComponent
    participant Entity4 as Game Entities

    Dev->>EffectComp: startEffect(new SlowTimeEffect(Duration.seconds(3)))
    EffectComp->>Entity4: reduce tpf multiplier to 0.2
    Note over Entity4: everything appears in slow motion
    EffectComp->>EffectComp: after 3 seconds effect expires
    EffectComp->>Entity4: restore normal tpf multiplier
```

## Image-to-Particles Animation

```mermaid
flowchart TD
    Img["Image / Texture"] --> Pixels["sample pixel colors from image"]
    Pixels --> Particles2["spawn particle per pixel\nat corresponding screen position"]
    Particles2 --> Anim3["animate particles FROM image positions\nTO random/explosion positions\n(or reverse: assemble from chaos)"]
    Anim3 --> Examples2["Examples:\n• logo reveal effect\n• pixelated explosion\n• image disintegration"]
```

## Fireworks Use Case

```mermaid
flowchart LR
    Timer2["run(interval)"] --> Launch["spawn rocket entity\nat bottom of screen"]
    Launch --> Rise["rocket moves upward"]
    Rise --> Explode["on expire:\nspawn ParticleComponent\nnewExplosionEmitter with colorful particles"]
    Explode --> Gravity2["particles fall with gravity\nfade out over lifetime"]
```

## Rain / Smoke Use Case

```mermaid
flowchart TD
    Rain["ParticleEmitters.newRainEmitter()"] --> Config2["• emissionRate: high\n• direction: downward\n• size: small elongated\n• lifetime: 2s\n• color: blue/grey semi-transparent"]
    Smoke["ParticleEmitters.newSmokeEmitter()"] --> Config3["• emissionRate: medium\n• direction: upward + random spread\n• size: large growing\n• lifetime: 3-5s\n• color: grey fading to transparent"]
```
