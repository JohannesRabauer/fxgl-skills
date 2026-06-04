# Use Cases — Animation

Covers the AnimationBuilder DSL, sprite sheet animation, path animation, property animation,
and sequential / chained animations.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-ANIM-1\nTranslate entity (move A to B)"]
    Dev --> UC2["UC-ANIM-2\nRotate entity"]
    Dev --> UC3["UC-ANIM-3\nScale entity"]
    Dev --> UC4["UC-ANIM-4\nFade entity in / out"]
    Dev --> UC5["UC-ANIM-5\nAnimate along bezier / path"]
    Dev --> UC6["UC-ANIM-6\nAnimate sprite sheet (walk cycle)"]
    Dev --> UC7["UC-ANIM-7\nAnimate JavaFX property"]
    Dev --> UC8["UC-ANIM-8\nChain animations sequentially"]
    Dev --> UC9["UC-ANIM-9\nLoop / repeat animation"]
    Dev --> UC10["UC-ANIM-10\nApply easing interpolator"]
    Dev --> UC11["UC-ANIM-11\nSpawn entity with scale-in effect"]
    Dev --> UC12["UC-ANIM-12\nDespawn entity with scale-out effect"]
    Dev --> UC13["UC-ANIM-13\nAnimate a string of text"]
```

## AnimationBuilder DSL Flow

```mermaid
flowchart LR
    AB["FXGL.animationBuilder()"] --> Duration[".duration(Duration.seconds(1))"]
    Duration --> Delay[".delay(Duration.millis(200))  ①optional"]
    Delay --> Interpolator[".interpolator(Interpolators.ELASTIC.EASE_OUT()) ①optional"]
    Interpolator --> Repeat[".repeat(3) or .repeatInfinitely() ①optional"]
    Repeat --> Auto[".autoReverse(true) ①optional"]
    Auto --> Action{Choose Action}
    Action --> Translate[".translate(entity).from(pt1).to(pt2)"]
    Action --> Rotate[".rotate(entity).from(0).to(360)"]
    Action --> Scale[".scale(entity).from(pt1).to(pt2)"]
    Action --> Fade[".fadeIn(entity) / .fadeOut(entity)"]
    Action --> FadeTo[".fadeTo(entity, opacity)"]
    Action --> Path[".alongPath(entity, path) ②CubicCurve/Path"]
    Translate --> Build[".buildAndPlay()  — starts immediately"]
    Translate --> BuildRun[".build()  — returns Animation for manual control"]
```

## Sprite Sheet Animation Use Case

```mermaid
flowchart TD
    Load["getAssetLoader().loadTexture('player.png')"] --> SS["AnimatedTexture via\ntexture.toAnimatedTexture(frameCount, duration)"]
    SS --> Channel["AnimationChannel\n• specify rows/cols\n• frame duration\n• loop or one-shot"]
    Channel --> Attach["entity view = animatedTexture\nanimatedTexture.loop() / .play(channel)"]
    Attach --> Switch["switch channel on state change\n(walk, run, jump, idle)"]
```

## Sequential Animation Pattern

```mermaid
flowchart LR
    A["animationBuilder().translate(e).from(A).to(B).buildAndPlay()"]
    A -->|"on finished"| B["animationBuilder().rotate(e).from(0).to(90).buildAndPlay()"]
    B -->|"on finished"| C["animationBuilder().fadeOut(e).buildAndPlay()"]
    C -->|"on finished"| D["entity.removeFromWorld()"]
```

## Property Animation Use Case

```mermaid
flowchart TD
    Dev([Developer]) --> PA["animationBuilder()\n.duration(Duration.seconds(2))\n.animate(animatedValue)\n.onProgress(value -> node.setOpacity(value))\n.from(0.0).to(1.0)\n.buildAndPlay()"]
    PA --> Custom["Works on ANY double property\n(color channels, custom game values)"]
```

## Interpolator Selection

```mermaid
graph TD
    Interp["Interpolators enum"] --> Linear["LINEAR — constant speed"]
    Interp --> Smooth["SMOOTH — ease in & out"]
    Interp --> Elastic["ELASTIC — spring overshoot"]
    Interp --> Bounce["BOUNCE — bounces at end"]
    Interp --> Back["BACK — slight overshoot"]
    Interp --> Exp["EXPONENTIAL — fast start"]
    Interp --> Circ["CIRCULAR — circular arc"]
    Interp --> Custom2["custom Interpolator implementation"]
    Linear --> Variants["each has .EASE_IN / .EASE_OUT / .EASE_IN_OUT variants"]
    Smooth --> Variants
```

## Animated String Use Case

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant AnimatedText

    Dev->>AnimatedText: animationBuilder().animateString(text, "Hello World!")
    AnimatedText->>AnimatedText: reveals characters one by one
    AnimatedText-->>Dev: onFinished callback
```
