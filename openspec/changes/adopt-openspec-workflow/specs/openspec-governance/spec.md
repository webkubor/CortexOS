## ADDED Requirements

### Requirement: Major changes SHALL use a formal spec workflow
CortexOS SHALL require a formal OpenSpec workflow for major architectural or protocol-level changes so that proposal, design, requirements, and implementation tasks are aligned before code changes begin.

#### Scenario: API contract change is proposed
- **WHEN** a change affects Cloud Brain endpoints, payload fields, or authentication behavior
- **THEN** the change SHALL be documented in an OpenSpec change before implementation starts

#### Scenario: Data flow change is proposed
- **WHEN** a change affects notifications, tasks, memories, or SSOT boundaries
- **THEN** the change SHALL define proposal, design, specs, and tasks artifacts before implementation

### Requirement: OpenSpec SHALL remain separate from long-term documentation SSOT
CortexOS SHALL treat OpenSpec artifacts as change-process documents, while keeping long-term rules, architecture, and operational truth in the existing `docs/` and `~/Documents/memory/` systems.

#### Scenario: A change is completed
- **WHEN** an OpenSpec change reaches completion
- **THEN** its stable conclusions SHALL be written back into long-term documentation if they affect permanent project knowledge

#### Scenario: A design decision is still under discussion
- **WHEN** a design is not yet finalized
- **THEN** it MAY remain only in `openspec/changes/...` until the decision becomes stable enough for long-term docs

### Requirement: AI tools SHALL share the same OpenSpec entrypoints
CortexOS SHALL provide a consistent OpenSpec workflow across Codex, Gemini, Claude, and OpenCode so that different AI tools can follow the same change process.

#### Scenario: Codex starts a major change
- **WHEN** Codex initiates a major change
- **THEN** it SHALL be able to use OpenSpec commands or skills to create and advance the change artifacts

#### Scenario: Another AI tool continues an existing change
- **WHEN** Gemini, Claude, or OpenCode continues a previously created change
- **THEN** it SHALL find the same change folder and artifact structure in `openspec/changes/`
