# Coding Standard Reference

## Primary Goals

- Make intent obvious
- Keep the TypeScript contract explicit
- Preserve SSOT for state, rules, and mappings
- Minimize surprise, hidden coupling, and side effects
- Keep UI interaction logic understandable and replaceable

## Review Questions

### Type System
- Does TypeScript describe the real business contract?
- Are props, params, payloads, and return values explicit and narrow enough?
- Is `any`, unsafe casting, or duplicated shape definition hiding a deeper design problem?

### SSOT
- What is the single source of truth for this state or rule?
- Are display values, derived values, and payloads computed from the source instead of manually mirrored?
- If multiple modules can mutate the same fact, is that boundary intentional?

### Structure
- Does one module own one coherent responsibility?
- Are orchestration, side effects, rendering, and business rules separated enough to debug safely?
- Is shared logic extracted only when reuse is real?

### Interaction
- Can the user interaction flow be understood without mentally simulating five files at once?
- Are handlers, effects, and async transitions obvious and bounded?
- Does the component own too many UI states, requests, validations, and side effects at once?

### Framework Usage
- Vue: are template, composables, and side effects appropriately separated?
- React: are hooks, derived state, and effects used to model reality rather than patch over poor ownership?
- Is the framework carrying business logic that should live in TS modules instead?

### Comments
- Comments should explain motivation, dangerous assumptions, or edge cases
- Comments should not narrate the code line by line

## Refactor Preference Order

1. Rename for clarity
2. Tighten types and remove unsafe escape hatches
3. Restore SSOT if state or rules are duplicated
4. Extract a small pure helper or domain module
5. Split UI, state, and effect orchestration
6. Reconsider the broader abstraction only if the first five are insufficient
