---
name: fxgl-particles-effects
description: >
  Add particle systems and visual effects to an FXGL game — configure ParticleEmitter
  with function-based setters (setVelocityFunction, setAccelerationFunction,
  setExpireFunction, setScaleFunction, setSpawnPointFunction); use built-in factory
  emitters (fire, explosion, smoke, rain); apply image-textured particles with
  multiplyColor / toColor; write custom per-particle physics via setControl; attach
  TrailParticleComponent for motion trails; apply SlowTimeEffect for bullet-time;
  apply WobbleEffect for screen-shake; stack multiple effects with EffectComponent;
  build fireworks displays. Use this skill when adding explosions, fire, smoke, rain,
  motion trails, impact bursts, bullet-time slow-motion, screen shake, or any
  particle-based visual polish.
triggers:
  - particle
  - emitter
  - ParticleEmitter
  - explosion
  - fire effect
  - smoke
  - rain
  - trail
  - TrailParticleComponent
  - EffectComponent
  - SlowTimeEffect
  - WobbleEffect
  - screen shake
  - bullet time
  - visual effect
  - fireworks
  - particle system
  - setControl
  - textured particles
compatibility: >
  Java 17+, FXGL 21.x
category: fxgl/effects
tags:
  - fxgl
  - java
  - javafx
  - effects
  - particles
metadata:
  author: "fxgl-skills"
  version: "1.1"
  fxgl-version: "21.1"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---
# FXGL Particle System & Visual Effects

## Built-in Factory Emitters

FXGL ships pre-configured emitters for common effects:

```java
import com.almasb.fxgl.particle.ParticleEmitter;
import com.almasb.fxgl.particle.ParticleEmitters;
import com.almasb.fxgl.particle.ParticleComponent;

// Fire — orange/red upward particles
ParticleEmitter fireEmitter = ParticleEmitters.newFireEmitter();

// Explosion — outward radial burst; radius controls spread, not particle count
ParticleEmitter explosionEmitter = ParticleEmitters.newExplosionEmitter(80);

// Smoke — grey billowing upward
ParticleEmitter smokeEmitter = ParticleEmitters.newSmokeEmitter();

// Rain — covers the given pixel width
ParticleEmitter rainEmitter = ParticleEmitters.newRainEmitter(getAppWidth() / 2);
```

## Emitter Configuration — Function-Based API

FXGL's `ParticleEmitter` uses **function setters** for all per-particle properties.
There are no `setVelocityX/Y`, `setGravityX/Y`, or `setLifetime` methods.

```java
import com.almasb.fxgl.core.math.FXGLMath;
import javafx.geometry.Point2D;
import javafx.scene.effect.BlendMode;
import javafx.scene.paint.Color;
import javafx.util.Duration;

ParticleEmitter emitter = ParticleEmitters.newExplosionEmitter(300);

// --- emission ---
emitter.setNumParticles(50);
emitter.setEmissionRate(0.86);              // 0.0–1.0; higher = more per tick
emitter.setMaxEmissions(Integer.MAX_VALUE); // default; use a finite int for one-shot

// --- size ---
emitter.setSize(1, 24);                     // random between min and max (pixels)

// --- velocity: Function<Integer, Point2D> (i = particle index) ---
emitter.setVelocityFunction(i -> FXGLMath.randomPoint2D().multiply(random(1, 45)));

// --- acceleration: Supplier<Point2D> ---
emitter.setAccelerationFunction(() -> new Point2D(0, 9.8)); // downward gravity

// --- scale delta per frame: Function<Integer, Point2D> ---
emitter.setScaleFunction(i -> FXGLMath.randomPoint2D().multiply(0.01));

// --- lifetime: Function<Integer, Duration> ---
emitter.setExpireFunction(i -> Duration.seconds(random(0.25, 2.5)));

// --- spawn offset from entity origin: Function<Integer, Point2D> ---
emitter.setSpawnPointFunction(i -> new Point2D(random(-5, 5), random(-5, 5)));

// --- color ---
emitter.setStartColor(Color.YELLOW);
emitter.setEndColor(Color.color(1, 0, 0, 0));  // fade to transparent

// --- blend mode ---
emitter.setBlendMode(BlendMode.ADD);           // ADD = glow; SRC_OVER = normal

// --- rotation ---
emitter.setAllowParticleRotation(true);

// --- interpolation curve ---
emitter.setInterpolator(Interpolators.EXPONENTIAL.EASE_OUT());
```

## Attaching an Emitter to an Entity

```java
import com.almasb.fxgl.particle.ParticleComponent;

// Continuous effect — lives as long as the entity
entityBuilder()
        .at(torchX, torchY)
        .with(new ParticleComponent(ParticleEmitters.newFireEmitter()))
        .buildAndAttach();
```

## One-Shot Burst (Explosion / Impact)

```java
import com.almasb.fxgl.dsl.components.ExpireCleanComponent;

ParticleEmitter burst = ParticleEmitters.newExplosionEmitter(80);
burst.setBlendMode(BlendMode.ADD);
burst.setStartColor(FXGLMath.randomColor());
burst.setEndColor(Color.color(1, 1, 0, 0));
burst.setExpireFunction(i -> Duration.seconds(random(1.25, 2.5)));

entityBuilder()
        .at(hitX, hitY)
        .with(new ParticleComponent(burst))
        .with(new ExpireCleanComponent(Duration.seconds(3)).animateOpacity())
        .zIndex(100)
        .buildAndAttach();
// ExpireCleanComponent is required — without it the entity stays in the world forever.
```

## Image-Textured Particles

Particles can use a source image instead of a solid rectangle.
Use `texture().multiplyColor(color)` to tint while preserving shape, or
`texture().toColor(color)` to fully recolor.

```java
import javafx.scene.paint.Color;

Color c = FXGLMath.randomColor();

// Tint: preserves the image shape, multiplies each pixel by the color
emitter.setSourceImage(texture("particles/flare_01.png", 64, 64).multiplyColor(c));

// Flat recolor: replaces all non-transparent pixels with the given color
emitter.setSourceImage(texture("particles/rain.png").toColor(Color.YELLOW));
```

Available built-in sprite names (under `assets/textures/particles/`):
`circle_01–05`, `dirt_01–03`, `fire_01–02`, `flame_01–06`, `flare_01`,
`light_01–03`, `magic_01–05`, `muzzle_01–05`, `scorch_01–03`, `scratch_01`,
`slash_01–04`, `smoke_01–10`, `spark_01–07`, `star_01–09`,
`symbol_01–02`, `trace_01–07`, `twirl_01–03`, `window_01–04`

## Custom Per-Particle Physics — `setControl`

`setControl` receives a `Consumer<Particle>` called **every frame for every live particle**.
Use the mutable `Particle` fields to implement noise fields, attractors, boundary bounce, etc.

```java
import com.almasb.fxgl.core.math.Vec2;

emitter.setControl(p -> {
    // Noise-field steering
    double noiseValue = FXGLMath.noise2D(p.position.x * 0.002 * t,
                                          p.position.y * 0.002 * t);
    double angle = FXGLMath.toDegrees((noiseValue + 1) * Math.PI * 1.5) % 360.0;

    Vec2 v = Vec2.fromAngle(angle).normalizeLocal().mulLocal(FXGLMath.random(1.0, 25));

    // Blend current velocity with noise direction
    p.velocity.x = p.velocity.x * 0.8f + v.x * 0.2f;
    p.velocity.y = p.velocity.y * 0.8f + v.y * 0.2f;
});
```

Attractor pattern — particles are drawn toward the entity's position:

```java
emitter.setControl(p -> {
    Vec2 toEntity = new Vec2(
        (float)(entity.getX() - p.position.x),
        (float)(entity.getY() - p.position.y)
    );
    double dist2 = Math.max(10, toEntity.lengthSquared());
    double power = 250.0 / Math.min(dist2, 1600) * FXGLMath.random(1, 4);
    p.acceleration.set(toEntity.normalizeLocal().mulLocal((float) power));
});
```

## Smoke Emitter — Color Configuration

The smoke emitter uses `setStartColor` / `setEndColor` instead of a source image:

```java
ParticleEmitter smoke = ParticleEmitters.newSmokeEmitter();
smoke.setBlendMode(BlendMode.SRC_OVER);
smoke.setSize(15, 30);
smoke.setNumParticles(10);
smoke.setEmissionRate(0.25);
smoke.setStartColor(Color.color(0.6, 0.55, 0.5, 0.47));
smoke.setEndColor(Color.BLACK);
smoke.setExpireFunction(i -> Duration.seconds(16));
smoke.setVelocityFunction(i -> new Point2D(FXGLMath.randomDouble() - 0.5, 0));
```

## Rain Effect — World-Wide Atmosphere

```java
ParticleEmitter rain = ParticleEmitters.newRainEmitter(getAppWidth() / 2);
rain.setSourceImage(texture("rain.png").multiplyColor(Color.BLUE));

entityBuilder()
        .with(new ParticleComponent(rain))
        .buildAndAttach();

// Second lane with different color and interpolator
ParticleEmitter rain2 = ParticleEmitters.newRainEmitter(getAppWidth() / 2);
rain2.setSourceImage(texture("rain.png").toColor(Color.YELLOW));
rain2.setInterpolator(Interpolators.EXPONENTIAL.EASE_OUT());

entityBuilder()
        .at(getAppWidth() / 2, 0)
        .with(new ParticleComponent(rain2))
        .buildAndAttach();
```

## Fireworks Display

```java
import com.almasb.fxgl.dsl.components.ProjectileComponent;

// Launch a rocket every 150ms
run(() -> spawnRocket(new Point2D(random(0, getAppWidth() - 80), getAppHeight())),
    Duration.seconds(0.15));

private void spawnRocket(Point2D origin) {
    Color color = FXGLMath.randomColor().brighter().brighter();

    // Rising trail uses fire emitter with star texture
    ParticleEmitter trail = ParticleEmitters.newFireEmitter();
    trail.setNumParticles(15);
    trail.setEmissionRate(0.5);
    trail.setSize(1, 24);
    trail.setSpawnPointFunction(i -> new Point2D(random(-1, 1), random(-1, 1)));
    trail.setExpireFunction(i -> Duration.seconds(random(0.25, 0.6)));
    trail.setBlendMode(BlendMode.SRC_OVER);
    trail.setSourceImage(texture("particles/star_04.png", 32, 32).multiplyColor(Color.YELLOW));
    trail.setAllowParticleRotation(true);

    Entity rocket = entityBuilder()
            .at(origin)
            .with(new ProjectileComponent(new Point2D(0, -1), 750))
            .with(new ParticleComponent(trail))
            .buildAndAttach();

    // Explode after random flight time
    runOnce(() -> {
        explode(rocket.getPosition(), color);
        rocket.removeFromWorld();
    }, Duration.seconds(random(0.4, 0.7)));
}

private void explode(Point2D pos, Color color) {
    ParticleEmitter burst = ParticleEmitters.newExplosionEmitter(random(50, 150));
    burst.setExpireFunction(i -> Duration.seconds(random(1.25, 2.5)));
    burst.setInterpolator(Interpolators.EXPONENTIAL.EASE_OUT());
    burst.setAccelerationFunction(() -> new Point2D(random(1, 1.5), random(1, 35.5)));
    burst.setBlendMode(BlendMode.ADD);
    burst.setSize(8, 32);
    burst.setAllowParticleRotation(false);
    burst.setSourceImage(texture("particles/flare_01.png", 64, 64).multiplyColor(color));

    entityBuilder()
            .at(pos)
            .with(new ParticleComponent(burst))
            .with(new ExpireCleanComponent(Duration.seconds(3)).animateOpacity())
            .zIndex(100)
            .buildAndAttach();
}
```

## Entity Scale Sync for Scaled Entities

When the host entity is scaled, keep particle origin in sync:

```java
emitter.setEntityScaleFunction(() -> new Point2D(1.75, 1.75));
emitter.setScaleOriginFunction(i -> new Point2D(12, 32));

var e = entityBuilder()
        .at(250, 250)
        .viewWithBBox("brick.png")
        .scale(1.75, 1.75)
        .with(new ParticleComponent(emitter))
        .buildAndAttach();

e.getTransformComponent().setScaleOrigin(new Point2D(12, 32));
```

## TrailParticleComponent — Motion Trail

```java
import com.almasb.fxgl.particle.TrailParticleComponent;

ParticleEmitter trailEmitter = new ParticleEmitter();
trailEmitter.setNumParticles(1);
trailEmitter.setSize(4, 4);
trailEmitter.setExpireFunction(i -> Duration.seconds(random(0.3, 0.6)));
trailEmitter.setStartColor(Color.CYAN);
trailEmitter.setEndColor(Color.color(0, 1, 1, 0));
trailEmitter.setBlendMode(BlendMode.ADD);

// Spawns one particle at the entity's position every 30ms
player.addComponent(new TrailParticleComponent(trailEmitter, Duration.millis(30)));
```

## EffectComponent — Stackable Effects

```java
import com.almasb.fxgl.entity.component.EffectComponent;
import com.almasb.fxgl.effect.SlowTimeEffect;
import com.almasb.fxgl.effect.WobbleEffect;

entity.addComponent(new EffectComponent());

EffectComponent fx = entity.getComponent(EffectComponent.class);

// Bullet time — scales tpf for all entity onUpdate() calls (not timers or JavaFX)
fx.startEffect(new SlowTimeEffect(Duration.seconds(3)));

// Screen shake — sine-wave positional offset; best applied to camera anchor entity
fx.startEffect(new WobbleEffect(Duration.millis(500)));

// Effects stack and expire independently
```

## Custom Effect

```java
import com.almasb.fxgl.effect.AbstractEffect;

public class BurnEffect extends AbstractEffect {
    private double damageTimer = 0;

    public BurnEffect() {
        super(Duration.seconds(5));
    }

    @Override
    public void onStart(Entity entity) {
        // add burn visual indicator
    }

    @Override
    public void onUpdate(Entity entity, double tpf) {
        damageTimer += tpf;
        if (damageTimer >= 0.5) {
            damageTimer = 0;
            entity.getComponent(HPComponent.class).damage(5);
        }
    }

    @Override
    public void onEnd(Entity entity) {
        // remove indicator
    }
}
```

## Gotchas

- **`ExpireCleanComponent` is mandatory for one-shot emitters.** Without it the entity
  persists forever consuming memory. Always pair with burst emitters.
- **`BlendMode.ADD` washes out on light backgrounds.** Switch to `BlendMode.SRC_OVER`
  for effects on non-black scenes.
- **No `setVelocityX/Y`, `setGravityX/Y`, or `setLifetime` methods exist.** Use
  `setVelocityFunction`, `setAccelerationFunction`, and `setExpireFunction` instead.
- **`newRainEmitter` takes a width argument** — `newRainEmitter(int widthPx)`. Calling it
  without an argument compiles but uses a zero-width lane.
- **`setControl` runs every frame per particle** — keep its lambda fast. Avoid allocations
  inside it; use `Vec2.set()` to mutate rather than creating new objects.
- **`TrailParticleComponent` spawns one entity per particle** — high emission intervals with
  many fast entities push entity counts into the thousands. Profile if FPS drops.
- **`SlowTimeEffect` does not affect `run()` / `runOnce()` timers**, JavaFX transitions, or
  UI animations. Only entity `Component.onUpdate()` sees the scaled `tpf`.
- **`newExplosionEmitter(radius)` — `radius` controls spread width**, not particle count.
  Increase `setNumParticles()` separately for a denser burst.
