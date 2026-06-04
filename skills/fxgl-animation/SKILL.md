---
name: fxgl-animation
description: >
  Animate entities and JavaFX nodes in FXGL — translate, rotate, scale, and fade entities
  using AnimationBuilder DSL, play sprite sheet frame animations with AnimatedTexture and
  AnimationChannel, animate along bezier/path curves, animate JavaFX properties (color,
  opacity), chain sequential animations, apply easing interpolators, and spawn or despawn
  entities with built-in scale effects. Use this skill when adding movement tweens, character
  walk cycles, UI transitions, cutscene animations, or particle-like effects.
  Triggers on: "AnimationBuilder", "animate", "tween", "sprite sheet", "AnimatedTexture",
  "AnimationChannel", "fade in", "fade out", "interpolator", "walk cycle", "animation".
compatibility: Java 17+, FXGL 21.x
metadata:
  author: fxgl-skills
  version: "1.0"
  fxgl-version: "21.1"
  category: fxgl/animation
allowed-tools: Read Write Edit Bash
---

# FXGL Animation System

## AnimationBuilder — Core DSL

All property animations use the builder. Chain options before calling a terminal method.

```java
// Translate entity from A to B over 1 second
animationBuilder()
        .duration(Duration.seconds(1))
        .interpolator(Interpolators.SMOOTH.EASE_IN_OUT())
        .translate(entity)
        .from(new Point2D(0, 0))
        .to(new Point2D(400, 300))
        .buildAndPlay();   // starts immediately, fire-and-forget

// Or store the Animation for manual control
Animation anim = animationBuilder()
        .duration(Duration.seconds(2))
        .translate(entity)
        .from(new Point2D(0, 0))
        .to(new Point2D(600, 400))
        .build();

anim.setOnFinished(() -> entity.removeFromWorld());
anim.start();
// anim.stop() / anim.pause() / anim.resume() when needed
```

## Translate, Rotate, Scale, Fade

```java
Duration d = Duration.seconds(0.5);

// Translate
animationBuilder().duration(d).translate(entity).from(start).to(end).buildAndPlay();

// Rotate (degrees)
animationBuilder().duration(d).rotate(entity).from(0).to(360).buildAndPlay();

// Scale (uniform)
animationBuilder().duration(d).scale(entity)
        .from(new Point2D(1, 1)).to(new Point2D(2, 2)).buildAndPlay();

// Scale (non-uniform)
animationBuilder().duration(d).scale(entity)
        .from(new Point2D(0, 0)).to(new Point2D(1, 1)).buildAndPlay();  // scale-in from zero

// Fade out then remove
animationBuilder().duration(d).fadeOut(entity)
        .buildAndPlay()
        .setOnFinished(() -> entity.removeFromWorld());

// Fade in
animationBuilder().duration(d).fadeIn(entity).buildAndPlay();

// Fade to specific opacity (0.0–1.0)
animationBuilder().duration(d).fadeTo(entity, 0.5).buildAndPlay();
```

## Spawn / Despawn with Scale Effect (DSL Convenience)

```java
// Spawn entity with scale-in animation
Entity e = spawnWithScale("enemy", new SpawnData(200, 300), Duration.seconds(0.3),
        Interpolators.ELASTIC.EASE_OUT());

// Despawn with scale-out animation (removes from world on completion)
despawnWithScale(entity, Duration.seconds(0.3), Interpolators.ELASTIC.EASE_IN());

// Spawn with fade-in
Entity e2 = spawnFadeIn("coin", new SpawnData(400, 200), Duration.seconds(0.5));

// Despawn with delay
despawnWithDelay(entity, Duration.seconds(2));
```

## Chaining Sequential Animations

```java
// Method 1: onFinished callback chain
animationBuilder().duration(Duration.seconds(0.5))
        .translate(entity).from(A).to(B)
        .build()
        .setOnFinished(() ->
            animationBuilder().duration(Duration.seconds(0.5))
                    .rotate(entity).from(0).to(180)
                    .build()
                    .setOnFinished(() ->
                        animationBuilder().duration(Duration.seconds(0.3))
                                .fadeOut(entity).buildAndPlay())
                    .start())
        .start();

// Method 2: AnimationBuilder with repeat + autoReverse
animationBuilder()
        .duration(Duration.seconds(1))
        .autoReverse(true)
        .repeat(3)            // plays 3 times (6 half-cycles with autoReverse)
        .scale(entity)
        .from(new Point2D(1, 1))
        .to(new Point2D(1.3, 1.3))
        .buildAndPlay();

// Method 3: infinite loop
animationBuilder()
        .duration(Duration.seconds(0.5))
        .repeatInfinitely()
        .autoReverse(true)
        .translate(entity)
        .from(new Point2D(entity.getX(), entity.getY() - 10))
        .to(new Point2D(entity.getX(), entity.getY() + 10))
        .buildAndPlay();
```

## Path Animation (Bezier Curve)

```java
// Define a cubic bezier path
CubicCurve path = new CubicCurve(
        100, 500,   // start
        200, 100,   // control point 1
        600, 100,   // control point 2
        700, 500    // end
);

animationBuilder()
        .duration(Duration.seconds(3))
        .alongPath(entity, path)
        .buildAndPlay();
```

## Animate JavaFX Property (Custom Value)

```java
// Animate any double property — e.g., a custom shader parameter
AnimatedValue<Double> av = new AnimatedValue<>(0.0, 1.0);

animationBuilder()
        .duration(Duration.seconds(2))
        .animate(av)
        .onProgress(value -> {
            myShaderNode.setOpacity(value);
            colorRect.setFill(Color.color(value, 0, 1 - value));
        })
        .buildAndPlay();
```

## Animated String (Text Reveal)

```java
Text label = getUIFactoryService().newText("", Color.WHITE, 20);
addUINode(label, 200, 100);

animationBuilder()
        .duration(Duration.seconds(2))
        .animateString(label, "Hello, World!")  // reveals character by character
        .buildAndPlay();
```

## Interpolator Reference

```java
// Smooth (S-curve, natural feel)
Interpolators.SMOOTH.EASE_IN()
Interpolators.SMOOTH.EASE_OUT()
Interpolators.SMOOTH.EASE_IN_OUT()

// Elastic (spring overshoot — great for UI pop-ins)
Interpolators.ELASTIC.EASE_OUT()
Interpolators.ELASTIC.EASE_IN()

// Bounce (impact at end)
Interpolators.BOUNCE.EASE_OUT()

// Back (slight overshoot before settle)
Interpolators.BACK.EASE_OUT()

// Exponential (very fast start, slow end or vice versa)
Interpolators.EXPONENTIAL.EASE_IN()
Interpolators.EXPONENTIAL.EASE_OUT()

// Linear (constant speed — rarely looks good for game animations)
Interpolators.LINEAR

// JavaFX built-in
Interpolator.EASE_BOTH   // also accepted
```

## Sprite Sheet Animation

```java
// 1. Load texture (8 frames in a row, each 64x64)
Texture spriteSheet = getAssetLoader().loadTexture("characters/player.png");

// 2. Create animation channels
AnimationChannel idleChannel = new AnimationChannel(spriteSheet, 4,  // 4 cols
        64, 64, Duration.seconds(0.8), 0, 3);   // frames 0-3, loop 0.8s
AnimationChannel walkChannel = new AnimationChannel(spriteSheet, 8,  // 8 cols
        64, 64, Duration.seconds(0.6), 4, 11);  // frames 4-11
AnimationChannel jumpChannel = new AnimationChannel(spriteSheet, 8,
        64, 64, Duration.seconds(0.4), 12, 14, false);  // frames 12-14, no loop

// 3. Create AnimatedTexture
AnimatedTexture animTex = new AnimatedTexture(idleChannel);
animTex.loop();  // start looping immediately

// 4. Attach to entity
entityBuilder()
        .view(animTex)
        // ...
        .buildAndAttach();

// 5. Switch channels on state change (in PlayerComponent)
public void startWalking() {
    animTex.loopAnimationChannel(walkChannel);
}
public void stopWalking() {
    animTex.loopAnimationChannel(idleChannel);
}
public void jump() {
    // Play once then return to idle
    animTex.playAnimationChannel(jumpChannel);
    animTex.setOnCycleFinished(() -> animTex.loopAnimationChannel(idleChannel));
}
```

## AnimationChannel Constructor Variants

```java
// All frames in a single row
new AnimationChannel(texture, frameCount, frameW, frameH, duration, startFrame, endFrame)

// With looping control (false = play once then stop)
new AnimationChannel(texture, frameCount, frameW, frameH, duration, startFrame, endFrame, loop)

// From a list of specific frames
new AnimationChannel(List.of(frame0, frame2, frame5), duration)

// From Image (not Texture)
new AnimationChannel(image, frames, frameW, frameH, duration, start, end)
```

## Delay Before Animation

```java
animationBuilder()
        .delay(Duration.seconds(0.5))      // wait 0.5s then start
        .duration(Duration.seconds(1))
        .fadeIn(entity)
        .buildAndPlay();
```

## Gotchas

- **`buildAndPlay()` vs `build().start()`**: `buildAndPlay()` is fire-and-forget with no
  handle. Use `build()` when you need to stop, pause, or set an `onFinished` callback.
- **Animations do not block the game loop** — all animations run asynchronously on the
  JavaFX animation timer. Use `setOnFinished()` to sequence code after an animation.
- **`translateX/Y` in `from/to` are absolute world coordinates**, not offsets. To offset
  from current position: `.from(entity.getPosition()).to(entity.getPosition().add(100, 0))`.
- **AnimatedTexture must be the entity's view** — you cannot reuse the same `AnimatedTexture`
  instance across multiple entities. Create a new one per entity.
- **`loopAnimationChannel` vs `playAnimationChannel`**: loop plays forever; play fires
  `onCycleFinished` once the animation ends once.
- **Sprite sheet orientation**: FXGL reads frames left-to-right, top-to-bottom. Frame index 0
  is top-left. Frame (col, row) = index row * numCols + col.
- **`animationBuilder(scene)` variant**: pass a specific `Scene` when animating UI nodes
  that live in a `GameSubScene` rather than the main `GameScene`.
