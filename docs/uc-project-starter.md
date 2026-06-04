# Use Cases — FXGL Project Starter Workflow

Covers interactive project discovery, docs-first specification, project scaffolding, and
documentation-synchronized implementation for new FXGL projects.

## Actors and Primary Use Cases

```mermaid
graph LR
    Dev([Developer])
    Agent([Coding Agent])
    Repo([Project Repository])

    Dev --> UC1["UC-START-1\nAnswer bounded Socratic questions"]
    Dev --> UC2["UC-START-2\nReview and approve starter specification"]
    Dev --> UC3["UC-START-3\nConfirm project initialization choices"]

    Agent --> UC4["UC-START-4\nSynthesize project brief from answers"]
    Agent --> UC5["UC-START-5\nCreate ADRs for major decisions"]
    Agent --> UC6["UC-START-6\nCreate arc42-lite architecture summary"]
    Agent --> UC7["UC-START-7\nCreate Mermaid use-case diagrams"]
    Agent --> UC8["UC-START-8\nInitialize FXGL project skeleton"]
    Agent --> UC9["UC-START-9\nCreate automated test scaffold"]
    Agent --> UC10["UC-START-10\nKeep docs and implementation synchronized"]

    Repo --> UC8
    Repo --> UC9
    Repo --> UC10
```

## Interactive vs Default Path

```mermaid
flowchart TD
    Start["Need new FXGL project"] --> Mode{"Interactive user available?"}
    Mode -- Yes --> Qs["Ask bounded question flow\n(one question at a time)"]
    Mode -- No --> Defaults["Apply conservative defaults:\n2D game, local play, Maven, Java, no multiplayer"]
    Qs --> Spec["Create starter specification"]
    Defaults --> Spec
    Spec --> Approve{"Specification approved?"}
    Approve -- No --> Qs
    Approve -- Yes --> Init["Initialize FXGL project"]
```

## Docs-First Delivery Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Agent as Coding Agent
    participant Docs as Documentation
    participant Code as Project Code
    participant Tests as Automated Tests

    Dev->>Agent: describe initial game idea
    Agent->>Dev: ask bounded Socratic questions
    Agent->>Docs: create project brief + ADR + arc42-lite + use-case diagrams
    Docs-->>Dev: reviewable specification
    Dev->>Agent: approve / refine
    Agent->>Code: scaffold FXGL project
    Agent->>Tests: add initial automated tests
    Agent->>Docs: update docs for each implemented step
    Tests-->>Dev: verify each step automatically
```

## Documentation Artifacts

```mermaid
graph TD
    Root["docs/"] --> Brief["project-brief.md"]
    Root --> UC["use-cases/core-use-cases.md"]
    Root --> Arch["architecture/arc42-lite.md"]
    Root --> ADR["architecture/adr/0001-*.md"]
    Root --> Plan["implementation-plan.md"]
```

## Testing Strategy

```mermaid
graph LR
    Change["Each project step"] --> Unit["Unit tests\nplain Java logic"]
    Change --> FX["FX tests\n@ExtendWith(RunWithFX.class)"]
    Change --> Smoke["Optional launch smoke test\nif environment supports display"]
    Unit --> Gate["Step accepted only when matching automated tests exist"]
    FX --> Gate
    Smoke --> Gate
```

## Synchronization Rule

```mermaid
flowchart LR
    Decision["New feature or architecture change"] --> DocUpdate["Update relevant docs first"]
    DocUpdate --> Impl["Implement code"]
    Impl --> Test["Add / update automated tests"]
    Test --> Verify["Run tests and ensure docs still match behavior"]
```
