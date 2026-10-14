---
trigger: always_on
---

# UI/UX Pro Max Skill — Automatic Activation Rule

## Purpose

Automatically use the `ui-ux-pro-max` skill for any task that involves designing, creating, implementing, modifying, reviewing, or improving a user interface or user experience.

The `ui-ux-pro-max` skill is the default and preferred source of UI/UX design guidance for this workspace.

## When to Activate

Activate and follow the `ui-ux-pro-max` skill whenever the task involves any of the following:

- Designing a new page, screen, dashboard, landing page, form, modal, dialog, navigation, or component.
- Creating or implementing UI components.
- Modifying an existing UI or visual layout.
- Improving the visual design or UX of an existing feature.
- Choosing colors, typography, spacing, icons, visual hierarchy, or layout.
- Designing responsive behavior for desktop, tablet, or mobile.
- Reviewing UI/UX quality.
- Fixing usability, accessibility, interaction, or visual consistency issues.
- Creating or modifying design systems, themes, design tokens, or component styles.
- Designing charts, data visualizations, cards, tables, or dashboard interfaces.
- Implementing animations, transitions, hover states, loading states, or micro-interactions.
- Building frontend interfaces for web or mobile applications.
- Refactoring frontend code where the requested change affects the UI or UX.

If a task contains both backend and UI work, activate the skill for the UI/UX portion while keeping the backend implementation focused on the user's requirements.

## Required Behavior

When this rule is triggered:

1. Use the `ui-ux-pro-max` skill before making UI/UX implementation decisions.
2. Read and follow the skill's `SKILL.md` instructions.
3. Do not ignore the skill merely because the user did not explicitly mention it.
4. Treat the skill as the default UI/UX authority for this workspace unless the user explicitly requests a different design system, framework, or visual direction.
5. Preserve the existing project's design system when modifying an existing application, unless the user explicitly asks for a redesign.
6. Avoid introducing arbitrary colors, fonts, spacing systems, component styles, or interaction patterns when the skill provides appropriate guidance.
7. Follow the skill's accessibility, responsive design, interaction, typography, color, performance, and visual consistency recommendations.
8. Use the skill's design-system workflow for substantial new UI work before implementation.
9. Use additional skill searches or domain-specific guidance when the task requires more specific UX, typography, color, chart, landing-page, or framework recommendations.
10. Follow the appropriate stack-specific guidance from the skill when implementing the UI.

## Design System Requirement

For substantial new UI work, generate or consult a design system before implementation.

Consider:

- Product type
- Target users
- Industry/domain
- Visual style
- Color palette
- Typography
- Spacing
- Component hierarchy
- Interaction patterns
- Responsive behavior
- Accessibility
- Animation and motion
- Charts and data visualization when applicable

Do not randomly select a visual style if the skill can provide a suitable recommendation.

## Existing Project Rule

When working on an existing UI:

- Inspect the current implementation first.
- Preserve established visual language and reusable components where appropriate.
- Do not unnecessarily redesign unrelated screens.
- Maintain consistency across existing pages and components.
- Improve the UI according to the `ui-ux-pro-max` guidance without breaking existing functionality.

## Implementation Rule

UI/UX quality must be considered part of implementation correctness.

Before finishing a UI-related task, verify:

- Responsive layout
- Accessibility
- Color contrast
- Typography hierarchy
- Consistent spacing
- Interactive states
- Loading and error states where applicable
- Keyboard accessibility where applicable
- Touch target sizes where applicable
- Icon consistency
- Visual hierarchy
- Component consistency
- No unnecessary layout shifts
- No inappropriate emoji used as UI icons
- Existing functionality remains intact

## Priority

When this rule applies, prefer the following order:

1. User's explicit requirements
2. Existing project architecture and design system
3. `ui-ux-pro-max` skill guidance
4. General implementation preferences

Do not override an explicit user requirement merely because the skill recommends another approach. When there is a conflict, satisfy the user's requirement while applying the skill's guidance wherever possible.

## Important

Do not require the user to explicitly say:

"Use ui-ux-pro-max"

before activating this rule.

Infer UI/UX relevance from the task itself and automatically use the `ui-ux-pro-max` skill when applicable.