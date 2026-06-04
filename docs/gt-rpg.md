# Game Type — RPG / JRPG

Covers role-playing games with stats, combat encounters, overworld exploration, NPCs, equipment, and level progression.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])

    Dev --> UC1["UC-RPG-1\nCharacter stats (ATK, DEF, HP, MP, SPD)"]
    Dev --> UC2["UC-RPG-2\nExperience and leveling system"]
    Dev --> UC3["UC-RPG-3\nTurn-based battle scene"]
    Dev --> UC4["UC-RPG-4\nOverworld exploration (top-down)"]
    Dev --> UC5["UC-RPG-5\nEquipment system (weapon, armor, accessory)"]
    Dev --> UC6["UC-RPG-6\nStatus effects (poison, stun, burn)"]
    Dev --> UC7["UC-RPG-7\nAbility / skill system with MP cost"]
    Dev --> UC8["UC-RPG-8\nNPC dialogue and quest giving"]
    Dev --> UC9["UC-RPG-9\nSave/load game state including party"]
    Dev --> UC10["UC-RPG-10\nLoot drops on enemy defeat"]
    Dev --> UC11["UC-RPG-11\nShop / merchant for items"]
    Dev --> UC12["UC-RPG-12\nRandom encounter or visible enemy contact"]
```

## Battle Scene Flow

```mermaid
stateDiagram-v2
    [*] --> Overworld
    Overworld --> BattleStart : contact with enemy
    BattleStart --> PlayerTurn : initiative resolved
    PlayerTurn --> SelectAction : display battle menu
    SelectAction --> AttackResolution : Attack/Skill/Item chosen
    AttackResolution --> EnemyTurn : player action complete
    EnemyTurn --> AttackResolution2 : enemy AI acts
    AttackResolution2 --> PlayerTurn : enemy action complete
    AttackResolution --> VictoryScreen : enemy HP = 0
    AttackResolution2 --> DefeatScreen : player HP = 0
    VictoryScreen --> Overworld : XP + loot awarded
    DefeatScreen --> [*]
```

## Stats and Leveling

```mermaid
flowchart TD
    GainXP["enemy defeated → XP += reward"] --> CheckLevel["XP >= xpThreshold[level]"]
    CheckLevel --> |yes| LevelUp["level++\nHP += hpGrowth\nATK += atkGrowth\n... per stat growth rates"]
    LevelUp --> UnlockSkill["if level == skillLearnLevel:\n  addSkill(newSkill)"]
    LevelUp --> PlayFanfare["show level-up animation + sound"]
```

## Equipment Stat Modification

```mermaid
flowchart LR
    Equip["player equips item"] --> RemoveOld["subtract old item's stat bonuses\nfrom effective stats"]
    RemoveOld --> ApplyNew["add new item's stat bonuses\nto effective stats"]
    ApplyNew --> UpdateHUD["refresh stats display"]
    Unequip["player unequips"] --> RemoveOld
```

## Status Effect Pattern

```mermaid
flowchart TD
    ApplyStatus["applyStatus(POISON, target, duration=5turns)"] --> StatusComp["StatusEffectComponent\nstores Map<StatusType, remainingTurns>"]
    StatusComp --> OnTurnEnd["each turn end:\nif POISON: target.takeDamage(maxHP * 0.1)\nif STUN: skip this unit's turn\nif BURN: ATK reduced by 30%"]
    StatusComp --> DecTimer["remainingTurns--\nif 0: remove status"]
```

## Random Encounter / Contact

```mermaid
flowchart LR
    StepCounter["player moves\nsteps++"] --> RandomRoll["random(0..100) < encounterRate * stepMultiplier"]
    RandomRoll --> |triggered| StartBattle["pick random enemy group\nfrom current area's encounter table\ntransition to BattleScene"]
    VisibleEnemy["visible enemy entity\nin overworld"] --> Contact["onCollisionBegin PLAYER+ENEMY\n→ StartBattle with that enemy type"]
```
