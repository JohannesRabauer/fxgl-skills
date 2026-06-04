# Use Cases — 3D Scene

Covers Camera3D, Model3D loading (OBJ), Skybox, 3D primitives (Cuboid, Prism, Torus),
custom 3D shapes, 3D collision, and third-person camera.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-3D-1\nEnable 3D mode and set up Camera3D"]
    Dev --> UC2["UC-3D-2\nMove camera with WASD + mouse look"]
    Dev --> UC3["UC-3D-3\nCamera follows 3D entity (third-person)"]
    Dev --> UC4["UC-3D-4\nLoad OBJ model and spawn as entity"]
    Dev --> UC5["UC-3D-5\nAdd skybox (6-face cube map)"]
    Dev --> UC6["UC-3D-6\nCreate primitive 3D shapes (cube, sphere, cylinder)"]
    Dev --> UC7["UC-3D-7\nCreate custom procedural 3D mesh"]
    Dev --> UC8["UC-3D-8\nAnimate 3D model rotation / translation"]
    Dev --> UC9["UC-3D-9\nDetect 3D collision between entities"]
    Dev --> UC10["UC-3D-10\nThrow / projectile in 3D space"]
    Dev --> UC11["UC-3D-11\nMinecraft-style voxel world"]
```

## 3D Mode Setup

```mermaid
flowchart TD
    Settings2["initSettings"] --> Enable3D["settings.setExperimental3D(true)"]
    Enable3D --> Camera3DSvc["getGameScene().getCamera3D()"]
    Camera3DSvc --> Pos3D["camera.getTransform().setTranslate(x, y, z)"]
    Camera3DSvc --> FOV["camera.setFieldOfView(60)"]
    Camera3DSvc --> NearFar["camera.setNearClip(0.1)\ncamera.setFarClip(5000)"]
```

## Camera3D Control Modes

```mermaid
graph TD
    Cam3D["Camera3D"] --> Free["Free-look Camera\n• WASD moves in world\n• mouse drag rotates view\n• Basic3DSample / Camera3DSample"]
    Cam3D --> Follow3D["Follow Entity Camera\n• bindToEntity(entity, offset)\n• Camera3DFollowSample"]
    Cam3D --> ThirdPerson["Third-Person Camera\n• orbit around entity\n• ThirdPersonCamera3DSample"]
    Cam3D --> Fixed3D["Fixed / Cinematic Camera\n• set position manually\n• animate with AnimationBuilder"]
```

## OBJ Model Loading & Spawning

```mermaid
flowchart LR
    Load5["getAssetLoader().loadModel3D('ship.obj')"] --> Model3D["Model3D object\n(JavaFX 3D node graph)"]
    Model5["entityBuilder()\n.at(x, y, z)\n.view(model3D)\n.buildAndAttach()"] --> World2["entity in 3D world"]
    Load5 --> Model5
```

## Built-in 3D Primitive Shapes

```mermaid
graph TD
    Prefs["Prefabs (scene3d module)"] --> CuboidShape["Cuboid(w, h, d)\n→ box-shaped 3D node"]
    Prefs --> PrismShape["Prism(n sides, radius, height)\n→ n-sided prism"]
    Prefs --> TorusShape["Torus(radius, tubeRadius, divs)\n→ donut shape"]
    Prefs --> PBShapes["PrismBasedShapes:\n• Cylinder (Prism n=32)\n• Cone\n• Pyramid"]
    Prefs --> CustomS["CustomShape3D\n→ supply raw TriangleMesh vertices"]
```

## Skybox Setup

```mermaid
flowchart TD
    SkyboxN["Skybox(\n  'front.png', 'back.png',\n  'top.png', 'bottom.png',\n  'left.png', 'right.png',\n  size\n)"] --> AddSky["getGameScene().addGameView(skybox)"]
    AddSky --> Follow2["Skybox auto-follows camera\nno parallax depth"]
```

## 3D Animation Use Case

```mermaid
flowchart LR
    AB3D["animationBuilder()"] --> Translate3D[".translate(entity)\n.from(pt3D_start)\n.to(pt3D_end)\n.buildAndPlay()"]
    AB3D --> Rotate3D[".rotate(entity)\n.from(startAngle)\n.to(endAngle)\n.axis(Rotate.Y_AXIS)\n.buildAndPlay()"]
    Anim3D2["Anim3DSample:\nkeyframe-based model animation"]
```

## 3D Collision Detection

```mermaid
flowchart TD
    Entity3D["3D entity with PhysicsComponent3D"] --> BBox3D["BoundingBox3D\n(box or sphere)"]
    BBox3D --> CH3D["Collision3DSample:\nonCollisionBegin() still works\nin 3D entity world"]
    CH3D --> Note4["Note: Box2D physics is 2D only\n3D collision uses FXGL's\nown bounding-box intersection"]
```

## Minecraft Voxel Pattern

```mermaid
flowchart TD
    MinecraftSample["MinecraftSample pattern"] --> Grid3D["3D grid of Cuboid entities"]
    Grid3D --> Place["left-click: place voxel\nat raycast hit position"]
    Grid3D --> Remove2["right-click: remove voxel\nat raycast hit position"]
    Place --> Update["rebuild only changed chunk\nfor performance"]
```

## Third-Person Camera Pattern

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Camera as Camera3D
    participant Player4 as Player Entity

    Dev->>Camera: setFollowEntity(player, offset(0, 3, -8))
    Player4->>Player4: moves forward
    Camera->>Camera: lerp towards player.pos + offset
    Dev->>Camera: mouse drag → rotate camera around player
```
