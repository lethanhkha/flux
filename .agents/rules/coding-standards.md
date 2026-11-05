---
paths:
  - "client/src/**/*.{ts,tsx,js,jsx}"
  - "server/src/**/*.{ts,js}"
---

# Clean Code & Architectural Standards

Enforce clean code principles for all source code modifications in this workspace:
- **Core Skill**: Activate the [`coding-standards`](file:///t:/Website/Flux/.agents/skills/coding-standards/SKILL.md) skill before making architectural decisions or major refactorings.
- **Principles**: Adhere to DRY, KISS, and SOLID. Use descriptive naming, keep functions modular (Single Responsibility), validate inputs at boundaries, and avoid magic numbers.
- **Error Handling**: Comprehensive Try/Catch blocks without swallowing exceptions or silent failures.
- **Existing Architecture**: Preserve existing project architecture and patterns unless explicitly directed to refactor.
- **Detailed Guidelines**: Refer to [Common Coding Style](file:///t:/Website/Flux/.agents/rules/common-coding-style.md) and [TypeScript Coding Style](file:///t:/Website/Flux/.agents/rules/typescript-coding-style.md).
