# AGENTS.md

# gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available skills: `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`, `/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`, `/retro`, `/investigate`, `/document-release`, `/codex`, `/cso`, `/autoplan`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`

# codex

Enter `codex` in the command line to use codex for code writing; you need to clearly tell codex what needs to be done.

# language

You must communicate with me in Simplified Chinese, and you must use English for thinking and analysis.

# Design System

Always read `DESIGN.md` before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
- All colors MUST use `hsl(var(--token))` — never hardcode hex values.
- New components must align with `DESIGN.md` component specifications.
- In QA mode, flag any code that doesn't match `DESIGN.md`.
