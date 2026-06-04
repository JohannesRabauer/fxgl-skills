---
name: fxgl-voxel
description: >
  Build a voxel or Minecraft-style game in FXGL — store a chunked block grid, generate terrain,
  place and remove blocks by 3D picking, highlight selected voxels, manage a hotbar of block
  types, rebuild visible chunk geometry after edits, and save modified chunk data. Use this skill
  for sandbox voxel worlds, block-building prototypes, or destructible cubic terrain.
triggers:
  - voxel
  - minecraft
  - chunk
  - block world
  - place block
  - break block
  - chunk mesh
  - terrain generation
compatibility: >
  Java 17+, FXGL 21.x. Requires FXGL 3D mode and builds on fxgl-scene3d.
category: fxgl/3d
tags:
  - fxgl
  - java
  - javafx
  - 3d
  - game-types
  - voxel
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
# FXGL Voxel World

## Layering

Use **fxgl-scene3d** for the basic 3D world and picking behavior. This skill adds:

- chunked world storage
- terrain generation
- place / break interaction
- hotbar block selection
- save/load of modified chunks

## Chunk Data

```java
public record ChunkCoord(int x, int z) {}

private static final int CHUNK_SIZE = 16;
private static final int CHUNK_HEIGHT = 64;

private final Map<ChunkCoord, byte[][][]> chunks = new HashMap<>();
```

Represent air as `0` and solid block IDs as positive values.

## Terrain Generation

```java
private byte[][][] generateChunk(ChunkCoord coord) {
    byte[][][] data = new byte[CHUNK_SIZE][CHUNK_HEIGHT][CHUNK_SIZE];

    for (int x = 0; x < CHUNK_SIZE; x++) {
        for (int z = 0; z < CHUNK_SIZE; z++) {
            int worldX = coord.x() * CHUNK_SIZE + x;
            int worldZ = coord.z() * CHUNK_SIZE + z;
            int height = (int) (32 + noise(worldX * 0.05, worldZ * 0.05) * 12);

            for (int y = 0; y <= height; y++) {
                data[x][y][z] = (byte) (y == height ? 1 : 2);  // grass over dirt
            }
        }
    }

    return data;
}
```

## Chunk Rendering Strategy

Start simple with one cube per visible block. Once performance drops, move to one mesh per chunk.

```java
private void buildChunkSimple(ChunkCoord coord, byte[][][] data) {
    for (int x = 0; x < CHUNK_SIZE; x++) {
        for (int y = 0; y < CHUNK_HEIGHT; y++) {
            for (int z = 0; z < CHUNK_SIZE; z++) {
                if (data[x][y][z] == 0)
                    continue;

                spawnVoxel(coord, x, y, z, data[x][y][z]);
            }
        }
    }
}
```

Only visible prototypes should stay on the one-node-per-block approach.

## Place / Break by Picking

```java
private void initVoxelPicking() {
    getGameScene().getRoot3D().addEventHandler(MouseEvent.MOUSE_CLICKED, event -> {
        PickResult pick = event.getPickResult();
        if (pick.getIntersectedNode() == null)
            return;

        Point3D hit = pick.getIntersectedPoint();

        if (event.getButton() == MouseButton.PRIMARY) {
            breakBlockAt(hit);
        } else if (event.getButton() == MouseButton.SECONDARY) {
            placeBlockNear(hit, selectedBlockType);
        }
    });
}
```

When placing a block, offset by the hit-face direction or by a snapped adjacent cell. Do not
spawn the new voxel in the exact same cell as the clicked solid block.

## Hotbar Selection

```java
private final List<Byte> hotbar = List.of((byte) 1, (byte) 2, (byte) 3, (byte) 4);
private int selectedSlot = 0;

private byte selectedBlockType() {
    return hotbar.get(selectedSlot);
}
```

Map mouse wheel or number keys to `selectedSlot`.

## Save / Load

Persist only modified chunks if possible.

```java
private final Set<ChunkCoord> dirtyChunks = new HashSet<>();

private void markDirty(ChunkCoord coord) {
    dirtyChunks.add(coord);
}
```

On save:

1. serialize dirty chunk block arrays
2. write one file per chunk or one world database
3. clear the dirty set after a successful save

## Selection Highlight

Use a translucent wireframe or slightly larger cuboid on the targeted block cell.

## Recommended Progression

1. single chunk
2. place / break
3. multiple chunks around player
4. saving modified chunks
5. performance optimization through chunk meshes / culling

## Gotchas

- **One node per block does not scale far** — JavaFX scene graph performance drops quickly with
  very large numbers of cubes.
- **Picking returns hit points, not block coordinates** — always snap or convert to the intended
  voxel cell explicitly.
- **Chunk rebuild boundaries matter** — editing a block on a chunk edge may require refreshing
  neighboring chunk faces too.
- **Keep world data authoritative** — never treat visible cubes as the source of truth; the chunk
  arrays own the world state.
