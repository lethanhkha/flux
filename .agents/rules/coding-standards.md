---
trigger: always_on
---

# Clean Code Expert Skill — Automatic Activation Rule

## Purpose

Automatically use the `clean-code-expert` skill for any task that involves writing, generating, reviewing, refactoring, modifying, or architecting software code.

The `clean-code-expert` skill is the default and preferred source of coding standards, architecture, and maintainability guidelines for this workspace.

## When to Activate

Activate and follow the `clean-code-expert` skill whenever the task involves any of the following:

- Writing new functions, classes, modules, or entire scripts.
- Refactoring or optimizing an existing codebase.
- Reviewing code for quality, security, and performance.
- Designing software architecture, data structures, or databases.
- Fixing bugs, handling exceptions, or writing test cases.
- Implementing API integrations, backend logic, or frontend logic.
- Naming variables, functions, or files.
- Documenting code or writing docstrings/JSDocs.

If a task contains both documentation and coding work, activate the skill for the coding portion while keeping the documentation focused on the user's requirements.

## Required Behavior

When this rule is triggered:

1. Use the `clean-code-expert` skill before making implementation or architectural decisions.
2. Read and follow the skill's instructions regarding clean code practices.
3. Do not ignore the skill merely because the user did not explicitly mention it.
4. Treat the skill as the default software engineering authority for this workspace unless the user explicitly requests a quick-and-dirty script or a specific non-standard paradigm.
5. Preserve the existing project's architecture when modifying an existing application, unless the user explicitly asks for a complete refactor.
6. Avoid introducing magic numbers, cryptic variables, or overly complex one-liners when the skill provides appropriate guidance for readability.
7. Follow the skill's recommendations on DRY (Don't Repeat Yourself), KISS (Keep It Simple, Stupid), and SOLID principles.
8. Use additional skill searches or domain-specific guidance when the task requires highly specific framework-level patterns (e.g., React hooks, Python decorators).

## Core Principles Requirement

For substantial new development work, establish a clear architectural plan before implementation.

Consider:

- Meaningful and pronounceable naming conventions
- Modularity and the Single Responsibility Principle (SRP)
- Optimal data structures and algorithms
- Predictable state and immutability
- Error handling and graceful degradation
- Security (input validation, preventing injections, no hardcoded secrets)
- Code readability and formatting (e.g., PEP 8, ESLint standards)

Do not randomly select an architectural pattern if the skill can provide a suitable recommendation.

## Existing Project Rule

When working on an existing codebase:

- Inspect the current implementation and established patterns first.
- Preserve the existing architectural language and reusable modules where appropriate.
- Do not unnecessarily refactor unrelated files or modules.
- Maintain formatting consistency across existing code.
- Improve the code according to the `clean-code-expert` guidance without breaking existing functionality.

## Implementation Rule

Code quality and maintainability must be considered part of implementation correctness.

Before finishing a coding task, verify:

- Variables and functions have clear, descriptive names.
- Functions are small and do exactly one thing.
- No duplicated code (DRY).
- Inputs are validated at the boundary (Fail Fast).
- Anticipated errors are handled with comprehensive Try/Catch blocks.
- No silent failures or swallowed exceptions.
- No hardcoded API keys or credentials.
- Code is self-documenting, with inline comments explaining the "why", not the "what".
- Existing functionality remains intact and tests pass (if applicable).

## Priority

When this rule applies, prefer the following order:

1. User's explicit requirements
2. Existing project architecture and standards
3. `clean-code-expert` skill guidance
4. General implementation preferences

Do not override an explicit user requirement merely because the skill recommends another approach. When there is a conflict, satisfy the user's requirement while applying the skill's guidance wherever possible.

## Important

Do not require the user to explicitly say:

"Use clean-code-expert"

before activating this rule.

Infer coding relevance from the task itself and automatically use the `clean-code-expert` skill when applicable.