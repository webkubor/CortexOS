# Coding Standard Reference

## Primary Goals

- Make intent obvious
- Keep data flow explicit
- Minimize surprise and side effects
- Favor local readability over abstract cleverness

## Review Questions

### Naming
- Would a new maintainer understand what this variable, function, or module owns?
- Do names describe intent instead of implementation trivia?

### Structure
- Does one module own one coherent responsibility?
- Are orchestration, side effects, and rendering separated enough to debug safely?
- Is shared logic extracted only when reuse is real?

### Complexity
- Can a reader follow the happy path without jumping through several files?
- Are condition branches and reactive paths bounded enough to test mentally?
- Is state concentrated where it belongs, instead of spread across unrelated layers?

### Contracts
- Are types, props, params, and return values explicit enough?
- Are side effects and failure conditions visible at the boundary?

### Comments
- Comments should explain motivation, edge cases, or dangerous assumptions
- Comments should not restate the code line by line

## Refactor Preference Order

1. Rename for clarity
2. Extract a small pure helper
3. Extract a focused module or composable
4. Split UI, state, and effect orchestration
5. Reconsider the broader abstraction only if the first four are insufficient
