# Engineering Baseline (v6.0.0)

> 🛠️ **SSOT**: This file defines the HARD constraints for CortexOS engineering. All agents must align with these standards.

## 1. Runtime & Stack
- **OS**: macOS (Darwin)
- **Python**: `uv` for package management and script execution.
- **Node.js**: `pnpm` as defined in `.nvmrc`.
- **Infrastructure**: GitHub CLI (`gh`) for remote automation.

## 2. Core Architecture Constraints
- **DRY (Don't Repeat Yourself)**: Zero tolerance for duplicate state sources or redundant logic. 
- **Deterministic Interfaces**: Every module/function must have explicit input validation, output structures, and error boundaries.
- **No Quiet Failures**: Swallowing exceptions is prohibited. Errors must include: `Action`, `Object`, and `Root Cause`.
- **Lazy Context Loading**: Use `load_rule()` for task-specific standards instead of full-scan to minimize token noise.

## 3. Code Standards & Documentation
- **Verified Code Only**: Code must be runnable and verified in the current environment before submission.
- **Documentation**: 
  - **TS/JS**: JSDoc/TSDoc.
  - **Python**: PEP 257 Docstrings.
- **Traceability**: All significant steps must be logged via `log_task` with `[[task-XXX]]` backlinks.

## 4. Red Lines (Strict Prohibitions)
- ❌ **Secret Leakage**: Hard-coded credentials or absolute paths in Git are blocked by pre-commit hooks.
- ❌ **Shadow Logic**: Unmanaged system commands or logic drift from `router.md` are not allowed.
- ❌ **Legacy Logic**: No "just-in-case" code. If a feature is deprecated (e.g., old fleet logic), it must be physically removed.

---
*Status: Actionable | Version: v6.0.0 (Pure Brain Mode)*
