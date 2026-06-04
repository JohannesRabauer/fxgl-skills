---
name: fxgl-particles-effects
description: >
  Add particle systems and visual effects to an FXGL game — configure ParticleEmitter with
  emission rate, size, speed, lifetime, color, and blend mode; use built-in factory
  emitters (fire, explosion, smoke, rain); attach TrailParticleComponent for motion
  trails; apply SlowTimeEffect for bullet-time; apply WobbleEffect for screen-shake; stack
  multiple effects with EffectComponent; create image-to-particle animations; build
  fireworks displays. Use this skill when adding explosions, fire, smoke, rain, motion
  trails, impact bursts, bullet-time slow-motion, screen shake, or any particle-based
  visual polish.
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
  version: "1.0"
  fxgl-version: "21.1"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---
# FXGL Particle System & Visual Effects

## Built-in Emitter Factories

FXGL ships pre-configured emitters for common effects:

```java
import com.almasb.fxgl.particle.ParticleEmitter;
import com.almasb.fxgl.particle.ParticleEmitters;
import com.almasb.fxgl.particle.ParticleComponent;

// Fire — orange/red upward particles
ParticleEmitter fireEmitter = ParticleEmitters.newFireEmitter();

// Explosion — outward burst, fades quickly
ParticleEmitter explosionEmitter = ParticleEmitters.newExplosionEmitter(60); // radius px

// Smoke — grey upward, large and slow
ParticleEmitter smokeEmitter = ParticleEmitters.newSmokeEmitter();

// Rain — blue/grey downward, high emission rate
ParticleEmitter rainEmitter = ParticleEmitters.newRainEmitter();
```

## Custom ParticleEmitter Configuration

```java
ParticleEmitter emitter = new ParticleEmitter();

// How many particles spawn per second
emitter.setNumParticles(50);
emitter.setEmissionRate(0.016);    // 1 particle per frame at 60fps

// Particle size
emitter.setSize(2.0, 8.0);         // random between min and max

// Speed (pixels per second)
emitter.setVelocityX(-20, 20);     // horizontal spread
emitter.setVelocityY(-150, -80);   // upward motion

// Lifetime (seconds)
emitter.setLifetime(0.5, 1.5);

// Color — static or interpolated
emitter.setStartColor(Color.YELLOW);
emitter.setEndColor(Color.color(1, 0, 0, 0));   // fade to transparent red

// Blend mode (ADD creates glow; SRC_OVER is normal)
emitter.setBlendMode(BlendMode.ADD);

// Optional: gravity
emitter.setGravityX(0);
emitter.setGravityY(50);   // pull downward
```

## Spawning a One-Shot Burst (Explosion)

```java
// One-shot: attach emitter, auto-remove entity after duration
ParticleEmitter explosion = ParticleEmitters.newExplosionEmitter(80);

Entity burst = entityBuilder()
        .at(hitX, hitY)
        .with(new ParticleComponent(explosion))
        .with(new ExpireCleanComponent(Duration.seconds(1.0)))
        .buildAndAttach();
```

## Spawning a Continuous Effect (Fire)

```java
// Continuous: attach to a world position, runs indefinitely
entityBuilder()
        .at(torchX, torchY)
        .with(new ParticleComponent(ParticleEmitters.newFireEmitter()))
        .buildAndAttach();
// Remove by calling entity.removeFromWorld() when no longer needed
```

## TrailParticleComponent — Motion Trail

```java
import com.almasb.fxgl.particle.TrailParticleComponent;

// Configure a small emitter for the trail particles
ParticleEmitter trailEmitter = new ParticleEmitter();
trailEmitter.setNumParticles(1);
trailEmitter.setSize(4.0, 4.0);
trailEmitter.setLifetime(0.3, 0.6);
trailEmitter.setStartColor(Color.CYAN);
trailEmitter.setEndColor(Color.color(0, 1, 1, 0));
trailEmitter.setBlendMode(BlendMode.ADD);

// Attach to player — spawns a particle at the entity's position every 30ms
TrailParticleComponent trail = new TrailParticleComponent(trailEmitter, Duration.millis(30));
player.addComponent(trail);
```

## EffectComponent — Stack Multiple Effects

```java
import com.almasb.fxgl.entity.component.EffectComponent;
import com.almasb.fxgl.effect.SlowTimeEffect;
import com.almasb.fxgl.effect.WobbleEffect;

// Add EffectComponent to any entity (or the player)
entity.addComponent(new EffectComponent());

// Start an effect — duration-based, expires automatically
EffectComponent fx = entity.getComponent(EffectComponent.class);
fx.startEffect(new SlowTimeEffect(Duration.seconds(3)));

// Multiple effects stack and expire independently
fx.startEffect(new WobbleEffect(Duration.seconds(1)));

// Inspect active effects
ObservableList<Effect> active = fx.getEffects();
```

## SlowTimeEffect — Bullet Time

```java
// SlowTimeEffect reduces the tpf multiplier for all entities in the world.
// Duration.seconds(3) → 3 seconds of slow motion, then auto-restores.

onCollisionBegin(EntityType.PLAYER, EntityType.POWERUP, (player, powerup) -> {
    powerup.removeFromWorld();
    player.getComponent(EffectComponent.class)
          .startEffect(new SlowTimeEffect(Duration.seconds(4)));
    play("sounds/slowmo.wav");
});
```

## WobbleEffect — Screen Shake

```java
// WobbleEffect applies a sine-wave offset to the entity's position.
// Attach it to the camera anchor entity for a screen-shake feel.

onCollisionBegin(EntityType.PLAYER, EntityType.ENEMY_BULLET, (player, bullet) -> {
    bullet.removeFromWorld();
    player.getComponent(EffectComponent.class)
          .startEffect(new WobbleEffect(Duration.millis(500)));
});
```

## Custom Effect

```java
import com.almasb.fxgl.effect.AbstractEffect;

public class BurnEffect extends AbstractEffect {
    private double damageTimer = 0;

    public BurnEffect() {
        super(Duration.seconds(5));   // effect lasts 5 seconds
    }

    @Override
    public void onStart(Entity entity) {
        // Called once when effect begins — add visual indicator
        entity.getViewComponent().addChild(new ImageView("burn-icon.png"));
    }

    @Override
    public void onUpdate(Entity entity, double tpf) {
        // Called every frame during effect
        damageTimer += tpf;
        if (damageTimer >= 0.5) {
            damageTimer = 0;
            entity.getComponent(HPComponent.class).damage(5);
        }
    }

    @Override
    public void onEnd(Entity entity) {
        // Called once when effect expires or is manually stopped
        entity.getViewComponent().clearChildren();
    }
}
```

## Rain Effect (World-Wide)

```java
// Position rain emitter at the top of the viewport, wide spread
ParticleEmitter rain = ParticleEmitters.newRainEmitter();
rain.setVelocityX(-10, 10);
rain.setVelocityY(300, 500);
rain.setNumParticles(200);
rain.setEmissionRate(0.016);   // every frame

entityBuilder()
        .at(getAppWidth() / 2.0, -10)
        .with(new ParticleComponent(rain))
        .buildAndAttach();
```

## Fireworks Display

```java
// Schedule repeated rocket launches
run(() -> launchFirework(), Duration.seconds(0.5));

private void launchFirework() {
    // Rocket rises from bottom
    Entity rocket = entityBuilder()
            .at(FXGLMath.random(100, getAppWidth() - 100), getAppHeight())
            .with(new ProjectileComponent(new Point2D(0, -1), 400))
            .with(new ExpireCleanComponent(Duration.seconds(1.5)) {
                @Override
                public void onExpire() {
                    explode(entity.getX(), entity.getY());
                }
            })
            .buildAndAttach();
}

private void explode(double x, double y) {
    // Colorful explosion burst
    ParticleEmitter burst = ParticleEmitters.newExplosionEmitter(100);
    burst.setStartColor(FXGLMath.randomColor());
    burst.setEndColor(Color.color(1, 1, 0, 0));
    burst.setGravityY(80);   // particles fall after explosion

    entityBuilder()
            .at(x, y)
            .with(new ParticleComponent(burst))
            .with(new ExpireCleanComponent(Duration.seconds(1.5)))
            .buildAndAttach();

    play("sounds/firework_pop.wav");
}
```

## Image-to-Particles Animation

```java
// Disintegrate an image into particles — useful for dramatic destruction
public void disintegrate(Entity entity) {
    Image image = entity.getViewComponent().getChildren().get(0)
                        .snapshot(null, null);
    int w = (int) image.getWidth();
    int h = (int) image.getHeight();

    PixelReader reader = image.getPixelReader();

    for (int px = 0; px < w; px += 2) {     // sample every 2 pixels for performance
        for (int py = 0; py < h; py += 2) {
            Color color = reader.getColor(px, py);
            if (color.getOpacity() < 0.1) continue;

            double worldX = entity.getX() + px;
            double worldY = entity.getY() + py;

            ParticleEmitter pxEmitter = new ParticleEmitter();
            pxEmitter.setNumParticles(1);
            pxEmitter.setEmissionRate(1.0);
            pxEmitter.setSize(2.0, 2.0);
            pxEmitter.setLifetime(0.5, 1.5);
            pxEmitter.setStartColor(color);
            pxEmitter.setEndColor(Color.color(color.getRed(), color.getGreen(), color.getBlue(), 0));
            pxEmitter.setVelocityX(-80, 80);
            pxEmitter.setVelocityY(-120, -40);
            pxEmitter.setGravityY(60);

            entityBuilder()
                    .at(worldX, worldY)
                    .with(new ParticleComponent(pxEmitter))
                    .with(new ExpireCleanComponent(Duration.seconds(1.5)))
                    .buildAndAttach();
        }
    }
    entity.removeFromWorld();
}
```

## Gotchas

- **`ExpireCleanComponent` is required for one-shot emitters** — without it the particle entity
  stays in the world forever consuming memory. For bursts always pair them together.
- **`BlendMode.ADD` creates glow** but washes out on white backgrounds. Switch to
  `BlendMode.SRC_OVER` for effects on light-colored scenes.
- **TrailParticleComponent spawns child entities** in the world — each trail particle is its
  own entity with `ExpireCleanComponent`. High emission rates with many moving entities can
  push entity counts into the thousands. Profile if FPS drops.
- **EffectComponent must be on the entity before calling `startEffect()`** — adding it after
  and immediately calling `startEffect()` in the same frame is safe, but calling `getComponent`
  before `addComponent` throws.
- **SlowTimeEffect affects `tpf` passed to all `Component.onUpdate()` calls** — it does not
  affect timers (`run()`, `runOnce()`), UI, or JavaFX animations. Those continue at real time.
- **`newExplosionEmitter(radius)` — the radius controls spread**, not the number of particles.
  Increase `setNumParticles()` independently for a denser explosion.
- **Image-to-particles is expensive** for large images. Downsample (sample every 2-4 pixels)
  and cap the total particle count to stay under ~2000 particles per disintegration.
- **ParticleEmitter color functions** — you can supply a `BiFunction<Integer, Double, Color>`
  via `setColorFunction()` to compute color per-particle per-frame for gradient or animated effects.
