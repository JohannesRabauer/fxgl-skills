---
name: fxgl-scene3d
description: >
  Build 3D scenes in FXGL — enable experimental 3D mode, set up Camera3D with free-look or
  follow-entity modes, load OBJ models via AssetLoader, spawn 3D entities with Model3D
  views, create built-in 3D primitives (Cuboid, Prism, Torus, Cylinder, Cone), add a six-
  face Skybox, animate 3D entities with AnimationBuilder, implement 3D collision with
  PhysicsComponent3D, build a third-person camera, and create Minecraft-style voxel
  worlds. Use this skill when building a 3D game, a 3D level, a first-person or third-
  person view, a 3D model viewer, or any JavaFX 3D scene within FXGL.
triggers:
  - 3D
  - Camera3D
  - OBJ model
  - Model3D
  - Skybox
  - Cuboid
  - Prism
  - Torus
  - 3D primitives
  - 3D collision
  - third person
  - voxel
  - 3D scene
  - setExperimental3D
  - PhysicsComponent3D
  - 3D animation
compatibility: >
  Java 17+, FXGL 21.x. Requires JavaFX with 3D hardware support.
category: fxgl/3d
tags:
  - fxgl
  - java
  - javafx
  - 3d
  - scene3d
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
# FXGL 3D Scene

## Enable 3D Mode

```java
@Override
protected void initSettings(GameSettings settings) {
    settings.setWidth(1280);
    settings.setHeight(720);
    settings.setTitle("My 3D Game");
    settings.setExperimental3D(true);   // required for 3D scene
}
```

## Camera3D Setup

```java
@Override
protected void initGame() {
    // Get the 3D camera
    Camera3D camera = getGameScene().getCamera3D();

    // Position (X right, Y up, Z toward viewer)
    camera.getTransform().setTranslate(0, -5, -20);

    // Field of view
    camera.setFieldOfView(60);

    // Clip planes — objects outside this range are not rendered
    camera.setNearClip(0.1);
    camera.setFarClip(5000.0);
}
```

## Free-Look Camera (WASD + Mouse)

```java
@Override
protected void initInput() {
    Camera3D camera = getGameScene().getCamera3D();

    // Move
    onKey(KeyCode.W, () -> camera.moveForward(tpf * 5));
    onKey(KeyCode.S, () -> camera.moveBack(tpf * 5));
    onKey(KeyCode.A, () -> camera.moveLeft(tpf * 5));
    onKey(KeyCode.D, () -> camera.moveRight(tpf * 5));
    onKey(KeyCode.SPACE, () -> camera.moveUp(tpf * 5));
    onKey(KeyCode.C, () -> camera.moveDown(tpf * 5));
}

@Override
protected void initGame() {
    // Mouse-look: rotate camera on drag
    getInput().addMouseEventHandler(MouseEvent.MOUSE_DRAGGED, e -> {
        Camera3D camera = getGameScene().getCamera3D();
        double dx = e.getSceneX() - prevMouseX;
        double dy = e.getSceneY() - prevMouseY;
        camera.getTransform().rotateY(dx * 0.3);
        camera.getTransform().rotateX(dy * 0.3);
        prevMouseX = e.getSceneX();
        prevMouseY = e.getSceneY();
    });
}
```

## Loading OBJ Models

```java
// Asset must be in assets/models/ (or assets/textures/ for MTL-referenced textures)
// Supported: .obj (with optional .mtl material file)

@Spawns("spaceship")
public Entity newSpaceship(SpawnData data) {
    Model3D model = getAssetLoader().loadModel3D("spaceship.obj");

    return entityBuilder(data)
            .view(model)
            .build();
}

// Spawn it
spawn("spaceship", new SpawnData(0, 0, 0));
```

## Built-in 3D Primitive Shapes

```java
import com.almasb.fxgl.scene3d.Cuboid;
import com.almasb.fxgl.scene3d.Prism;
import com.almasb.fxgl.scene3d.Torus;

// Box
Cuboid box = new Cuboid(2, 2, 2);           // width, height, depth
box.setMaterial(material);

// N-sided prism (cylinder-like)
Prism prism = new Prism(32, 1.0, 3.0);      // sides, radius, height

// Torus / donut shape
Torus torus = new Torus(2.0, 0.5, 32, 16); // majorRadius, tubeRadius, divMajor, divMinor

// Spawn as entity
entityBuilder()
        .at(0, 0, 0)
        .view(box)
        .buildAndAttach();
```

## Convenience Shapes (PrismBased)

```java
import com.almasb.fxgl.scene3d.Cylinder;
import com.almasb.fxgl.scene3d.Cone;
import com.almasb.fxgl.scene3d.Sphere;

// Cylinder = Prism with 32 sides
Cylinder cylinder = new Cylinder(0.5, 2.0);    // radius, height

// Cone = Prism tapering to a point
Cone cone = new Cone(1.0, 2.0);               // base radius, height

// Sphere — uses JavaFX Sphere
javafx.scene.shape.Sphere sphere = new javafx.scene.shape.Sphere(1.0);
sphere.setMaterial(new PhongMaterial(Color.RED));

entityBuilder().at(x, y, z).view(sphere).buildAndAttach();
```

## Applying Materials

```java
PhongMaterial mat = new PhongMaterial();
mat.setDiffuseColor(Color.STEELBLUE);
mat.setSpecularColor(Color.WHITE);
mat.setSpecularPower(64);

// Texture from assets/textures/
Image diffuseMap = getAssetLoader().loadImage("stone.png");
mat.setDiffuseMap(diffuseMap);

Cuboid block = new Cuboid(1, 1, 1);
block.setMaterial(mat);
```

## Skybox

```java
// Six face images: front, back, top, bottom, left, right
// All must be the same size (power-of-two resolution recommended)
import com.almasb.fxgl.scene3d.Skybox;

// Place face images in assets/textures/skybox/
Skybox skybox = new Skybox(
    getAssetLoader().loadImage("skybox/front.png"),
    getAssetLoader().loadImage("skybox/back.png"),
    getAssetLoader().loadImage("skybox/top.png"),
    getAssetLoader().loadImage("skybox/bottom.png"),
    getAssetLoader().loadImage("skybox/left.png"),
    getAssetLoader().loadImage("skybox/right.png"),
    500.0    // skybox size — must exceed far clip to avoid visible edges
);

getGameScene().addGameView(skybox);
// Skybox automatically follows the camera — no manual update needed
```

## Lighting

```java
@Override
protected void initGame() {
    // Ambient light — illuminates everything equally
    AmbientLight ambient = new AmbientLight(Color.color(0.3, 0.3, 0.3));

    // Point light — illuminates from a position
    PointLight pointLight = new PointLight(Color.WHITE);
    pointLight.setTranslateX(0);
    pointLight.setTranslateY(-10);
    pointLight.setTranslateZ(-5);

    // Add lights to the scene's 3D root
    getGameScene().getRoot3D().getChildren().addAll(ambient, pointLight);
}
```

## Animating 3D Entities

```java
// Rotate a 3D entity around the Y axis
animationBuilder()
        .duration(Duration.seconds(3))
        .repeatInfinitely()
        .rotate(planetEntity)
        .from(0)
        .to(360)
        .axis(new Point3D(0, 1, 0))   // Y axis
        .buildAndPlay();

// Translate along Z axis (move toward viewer)
animationBuilder()
        .duration(Duration.seconds(2))
        .interpolator(Interpolators.SMOOTH.EASE_BOTH())
        .translate(entity)
        .from(new Point3D(0, 0, -50))
        .to(new Point3D(0, 0, 0))
        .buildAndPlay();
```

## Follow-Entity Camera (Third-Person)

```java
public class ThirdPersonCameraComponent extends Component {
    private final Camera3D camera;
    private final Point3D offset;

    public ThirdPersonCameraComponent(Camera3D camera, Point3D offset) {
        this.camera = camera;
        this.offset = offset;
    }

    @Override
    public void onUpdate(double tpf) {
        // Smoothly follow the entity
        double targetX = entity.getX() + offset.getX();
        double targetY = entity.getY() + offset.getY();
        double targetZ = entity.getZ() + offset.getZ();

        Transform t = camera.getTransform();
        t.setTranslateX(t.getTranslateX() + (targetX - t.getTranslateX()) * tpf * 5);
        t.setTranslateY(t.getTranslateY() + (targetY - t.getTranslateY()) * tpf * 5);
        t.setTranslateZ(t.getTranslateZ() + (targetZ - t.getTranslateZ()) * tpf * 5);
    }
}

// Attach in initGame
Camera3D camera = getGameScene().getCamera3D();
player.addComponent(new ThirdPersonCameraComponent(camera, new Point3D(0, -3, -8)));
```

## 3D Collision Detection

```java
// 3D uses FXGL's own axis-aligned bounding box intersection (not Box2D)
// Entities need BoundingBoxComponent populated with a 3D box

Entity projectile = entityBuilder()
        .at(x, y, z)
        .bbox(BoundingShape.box3D(0.5, 0.5, 0.5))
        .collidable()
        .with(new ProjectileComponent(direction, 20))
        .buildAndAttach();

Entity target = entityBuilder()
        .at(tx, ty, tz)
        .bbox(BoundingShape.box3D(2, 2, 2))
        .collidable()
        .build();

onCollisionBegin(EntityType.BULLET, EntityType.ENEMY, (bullet, enemy) -> {
    bullet.removeFromWorld();
    enemy.getComponent(HPComponent.class).damage(25);
});
```

## Minecraft-Style Voxel World

```java
private static final int TILE = 1;   // 1 unit per voxel

private void buildChunk(int[][][] grid) {
    for (int x = 0; x < grid.length; x++) {
        for (int y = 0; y < grid[x].length; y++) {
            for (int z = 0; z < grid[x][y].length; z++) {
                if (grid[x][y][z] == 0) continue;

                Cuboid cube = new Cuboid(TILE, TILE, TILE);
                cube.setMaterial(getMaterialForType(grid[x][y][z]));

                entityBuilder()
                        .at(x * TILE, y * TILE, z * TILE)
                        .view(cube)
                        .bbox(BoundingShape.box3D(TILE, TILE, TILE))
                        .collidable()
                        .buildAndAttach();
            }
        }
    }
}

// Place / remove voxel on click via raycasting
private void placeVoxel(MouseEvent e) {
    // Cast ray from camera through screen point — manual intersection test
    // FXGL 3D: use PickResult from JavaFX scene picking
    getGameScene().getRoot3D().addEventHandler(MouseEvent.MOUSE_CLICKED, event -> {
        PickResult pick = event.getPickResult();
        if (pick.getIntersectedNode() != null) {
            Point3D point = pick.getIntersectedPoint();
            // Snap to grid and spawn new block
            int gx = (int) Math.round(point.getX());
            int gy = (int) Math.round(point.getY());
            int gz = (int) Math.round(point.getZ());
            spawnBlock(gx, gy, gz);
        }
    });
}
```

## Gotchas

- **`setExperimental3D(true)` is required** — without it the `getGameScene().getCamera3D()`
  call returns null and 3D entities are not rendered in 3D space.
- **JavaFX 3D requires hardware acceleration** — on headless servers or older GPUs,
  3D rendering falls back to software rendering, which is extremely slow. Test early.
- **Y axis is inverted vs. 2D** — in JavaFX 3D, Y increases downward in 2D but the 3D
  coordinate system has Y pointing up. Camera moves use the 3D convention.
- **Box2D physics is 2D only** — `PhysicsComponent` with Box2D does not work in 3D space.
  Use manual bounding box collision or JavaFX 3D pick events for 3D collision.
- **OBJ loading requires MTL adjacent to OBJ** — FXGL's OBJ loader resolves material files
  relative to the OBJ path. Both files must be in `assets/models/`.
- **Skybox size must exceed `camera.setFarClip()`** — if the skybox cube is smaller than the
  far clip, you'll see black corners where the skybox ends.
- **`animationBuilder().rotate()` on 3D entities** needs `axis(new Point3D(x,y,z))` — the 2D
  single-angle form only rotates around Z. Pass the axis explicitly for 3D rotation.
- **`PointLight` scope in JavaFX 3D** — by default a PointLight illuminates everything in the
  scene. Use `light.setScope()` to restrict illumination to specific nodes if you have many lights.
- **Voxel worlds with thousands of cubes** — each Cuboid is a separate JavaFX `Node`. Above
  ~10,000 nodes, JavaFX's scene graph slows significantly. Use instanced rendering or chunk
  culling (only spawn visible chunks).
