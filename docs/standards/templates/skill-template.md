# Skill Template

Use this file as the default standard when adding a new skill to `Cortex-Arsenal`.

## Admission Rule

A new skill belongs in this repository only if:
- It solves a recurring task with a clear trigger
- Its scope is narrow enough that it does not overlap heavily with an existing skill
- It can be represented as a lightweight skill module, not a standalone app
- Its instructions are stable enough to be reused across tasks

If the work is mostly runtime code, account data, or one-off automation, do not add it as a skill.

## Required Structure

```text
new-skill/
├── SKILL.md
├── agents/
│   └── openai.yaml
└── references/
    └── optional-reference.md
```

Rules:
- `SKILL.md` is required
- `agents/openai.yaml` is required
- `references/` is optional
- Do not add `README.md`, `package.json`, or wrapper project files unless the skill truly needs executable assets
- If executable assets are truly necessary, keep them minimal and justify them in the skill

## Naming Rule

- Directory name should end with `-skill`
- Frontmatter `name` should match the directory name
- Use plain, stable names based on the task, not slogans

Good:
- `true-advisor-skill`
- `pwa-master-skill`
- `vitepress-init-skill`

Bad:
- `ultimate-ai-brain-skill`
- `super-workflow-v2`

## `SKILL.md` Template

```md
---
name: new-skill
description: Short, concrete description of what the skill does and when it should be used.
---

# New Skill

This skill is for one narrow job: explain the actual reusable capability here.

Use it when the user asks to:
- Trigger case 1
- Trigger case 2
- Trigger case 3

Do not use it for:
- Nearby but different task 1
- Nearby but different task 2

## Core Workflow

### 1. Inspect first
- What context must be checked before acting

### 2. Decide the right path
- What tradeoffs or branches matter

### 3. Implement the minimum useful change
- What the skill should actually produce or modify

### 4. Validate the result
- What must be checked before considering the task done

## Loading Rules

- Always read `references/example.md`
- Only read optional references when the task actually needs them

## Constraints

- State the main failure modes or things the skill must not do
```

## `agents/openai.yaml` Template

```yaml
interface:
  display_name: "New Skill"
  short_description: "Short UI description of the skill."
  default_prompt: "Use $new-skill to help with the specific job this skill is designed for."

policy:
  allow_implicit_invocation: true
```

Rules:
- Quote all string values
- Keep the `short_description` short and scannable
- `default_prompt` must explicitly mention the skill as `$skill-name`

## Reference File Rule

Only create files in `references/` if they hold real optional depth:
- checklists
- domain rules
- format-specific guidance
- reusable prompt modes

Do not move core workflow steps out of `SKILL.md`.

## Admission Checklist

Before adding a new skill, verify:
- The trigger conditions are obvious
- The scope is narrower than an app or framework
- The skill does not duplicate an existing one
- `SKILL.md` explains when to use it and when not to use it
- `agents/openai.yaml` exists and matches the skill
- The directory stays lightweight

## Update Rule

When modifying an existing skill:
- Prefer tightening scope over expanding it
- Remove wrapper files if they stop adding real value
- Keep `SKILL.md`, `references/`, and `agents/openai.yaml` aligned
