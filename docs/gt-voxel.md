# Game Type — Voxel World

Covers Minecraft-style 3D voxel games. Block grid world, place/remove blocks via 3D raycasting, procedural terrain, chunk-based loading, crafting.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-VOX-1\nChunk-based 3D block world"]
    Dev --> UC2["UC-VOX-2\nPlace block on right-click (face normal)"]
    Dev --> UC3["UC-VOX-3\nBreak block on left-click hold"]
    Dev --> UC4["UC-VOX-4\nProcedural terrain via Perlin noise"]
    Dev --> UC5["UC-VOX-5\nInventory of block types to place"]
    Dev --> UC6["UC-VOX-6\nBlock selection highlight (outline)"]
    Dev --> UC7["UC-VOX-7\nGravity and movement in voxel space"]
    Dev --> UC8["UC-VOX-8\nLight propagation (ambient, sunlight)"]
    Dev --> UC9["UC-VOX-9\nCrafting recipe system"]
    Dev --> UC10["UC-VOX-10\nSave/load world chunk data"]
```

## World Structure

```mermaid
flowchart TD
    World["VoxelWorld\nMap<ChunkCoord, Chunk>"] --> Chunk["Chunk: CHUNK_SIZE × CHUNK_HEIGHT × CHUNK_SIZE\n(e.g. 16×256×16)\nbyte[][][] blocks"]
    Chunk --> BlockTypes["block types:\n0=AIR, 1=GRASS, 2=DIRT, 3=STONE,\n4=SAND, 5=WOOD, 6=LEAVES, ..."]
    BlockTypes --> ChunkLoading["load chunks around player\nunload chunks far away\n(view distance = N chunks)"]
```

## Terrain Generation

```mermaid
flowchart TD
    NoiseGen["PerlinNoise / SimplexNoise\n2D noise for height map"] --> HeightMap["for each (x, z): height = (int)(noise(x*0.05, z*0.05) × 64 + 64)"]
    HeightMap --> FillColumn["for y in 0..height:\n  if y == height: GRASS\n  if y >= height-4: DIRT\n  else: STONE"]
    FillColumn --> FillOres["random ore veins below y=32:\n  COAL, IRON, GOLD, DIAMOND"]
    FillOres --> PlaceTrees["on GRASS above ground:\n  20% chance: spawn tree (log + leaves columns)"]
```

## Block Raycast (Place / Break)

```mermaid
flowchart LR
    MouseClick3D2["LEFT click: break\nRIGHT click: place"] --> RayFromCamera["ray = camera.pos + t × camera.forward\nstep t in 0.1 increments up to reach=6"]
    RayFromCamera --> FindHitBlock["first block != AIR at ray position"]
    FindHitBlock --> BreakBlock["set block(x,y,z) = AIR\nrebuild chunk mesh\ndrop item entity"]
    FindHitBlock --> PlaceBlock["backtrack one step: get empty block before hit\n(adjacent to hit face)\nset block = selectedBlockType\nrebuild chunk mesh"]
```

## Mesh Building (Face Culling)

```mermaid
flowchart TD
    ChunkData["chunk block data"] --> BuildMesh["for each non-air block at (x,y,z):"]
    BuildMesh --> CheckFaces["for each of 6 faces:\n  neighbor = adjacent block\n  if neighbor is AIR: add face to mesh\n  (don't add face if hidden by solid neighbor)"]
    CheckFaces --> CreateMesh["assemble TriangleMesh from visible faces\napply block texture UV coordinates\ncreate single MeshView per chunk (efficient!)"]
```

## Inventory and Block Selection

```mermaid
flowchart LR
    Hotbar["hotbar: 9 slots\ndisplayed in HUD"] --> ScrollWheel["mouse scroll → change selectedSlot"]
    ScrollWheel --> NumberKeys["1-9 → direct slot select"]
    NumberKeys --> SelectedBlock["selectedBlockType = hotbar[selectedSlot].blockType"]
    SelectedBlock --> PlaceOnRightClick["on right-click:\n  place selectedBlockType at target position"]
```

## Save / Load Chunks

```mermaid
flowchart TD
    SaveWorld["on player saves"] --> SerializeChunks["for each modified chunk:\n  write byte[][][] to file:\n    'world/chunk_X_Z.dat'"]
    LoadWorld["on chunk enters view distance"] --> CheckExists["if 'world/chunk_X_Z.dat' exists:\n  read byte[][][] from file\nelse:\n  generate procedurally"]
    LoadWorld --> BuildChunkMesh["build chunk mesh\nadded to JavaFX 3D scene"]
```
