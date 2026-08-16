# Repository Guidelines

## Project Structure & Source of Truth
This repository currently runs as a TypeScript React app built with Vite, not Next.js. Treat the checked-in codebase as the source of truth for current runtime behavior. Treat [docs/PROJECT_CONSTRAINTS.md](/Users/admin/project/hackathon/MOLT/docs/PROJECT_CONSTRAINTS.md) and `docs/implementation-audit/` as persistent engineering guidance and target-state constraints for future refactors.

Primary folders:
- `src/pages/`: route-level screens
- `src/components/`: reusable UI components
- `src/components/ui/`: shared UI primitives
- `src/lib/`: domain helpers and utilities
- `src/services/ai/`: AI provider adapters, prompts, and templates
- `src/db/`: Supabase access and local demo storage
- `src/test/`: test setup and shared test utilities
- `public/`: static assets
- `supabase/migrations/`: SQL migrations
- `docs/`: long-lived product, design, audit, and engineering constraints

Generated output such as `coverage/` should not be treated as source.

## Development Commands
Use the scripts defined in `package.json`.

- `npm install`: install dependencies
- `npm start`: start the local Vite dev server on `127.0.0.1:5173`
- `npm test`: run the Vitest suite once
- `npm run test:watch`: run Vitest in watch mode
- `npm run test:coverage`: generate V8 coverage output in `coverage/`
- `npm run typecheck`: run `tsgo`, or fall back to `tsc --noEmit`
- `npm run lint`: run type checks, Biome lint, ast-grep rules, Tailwind validation, and a production smoke check
- `npm run e2e`: run the custom headless Chromium end-to-end check

Do not use `npm run dev` or `npm run build`; both are placeholders in this repository.

## Coding Style & Naming
- Use TypeScript, ESM imports, and 2-space indentation.
- Prefer functional React components.
- Keep tests colocated as `*.test.ts` or `*.test.tsx`.
- Use the `@/` path alias where appropriate.
- Use `PascalCase` for React components and page files.
- Use `camelCase` for hooks, helpers, and utilities.
- Use `UPPER_SNAKE_CASE` only for real constants.
- Follow surrounding formatting conventions; Biome is configured primarily for linting, not wholesale formatting changes.

## Architecture & Product Constraints
The following rules are project-level constraints, not optional suggestions:

- Preserve the core product narrative of "understood -> located -> connected". New features must not break that flow.
- Prefer the smallest stable happy path for MVP work. Do not introduce out-of-scope features such as full IM, native multi-platform apps, live recruitment API integrations, or complex recommendation systems unless explicitly requested.
- Keep provider-specific logic inside adapter/configuration layers. Business logic must not branch on a specific AI provider.
- All AI-driven business outputs should be structured and schema-validated before use.
- Fallback logic must be explicit, testable, and checked into the repository.
- Do not hardcode API keys, provider URLs, or model selection in application code.
- Treat user free-text input as sensitive. Do not expose it publicly by default and do not log secrets or raw sensitive text.
- Prefer tokenized design values. Do not hardcode core color values directly inside feature components when design tokens already exist.

When current code and future-state constraints differ, do not silently "upgrade" the app architecture during unrelated tasks. Record intentional deviations and refactor only when the task explicitly calls for it.

## Testing Expectations
Vitest runs in `jsdom` with setup from `src/test/setup.ts`.

- Add or update tests for utility logic, reducers, route behavior, fallback paths, and regression-prone UI behavior.
- Run `npm test` before handing off meaningful code changes.
- Use `npm run test:coverage` when touching core product flows.
- Fallback paths should be explicitly covered when they affect user-visible behavior.
- Demo-mode paths should remain runnable without external services when local credentials are absent.

## Commit & Pull Request Guidelines
- Use short imperative commit subjects, typically with a prefix such as `chore:`, `fix:`, or `ISSUE:`.
- Keep each commit scoped to one logical change.
- PRs should include a brief summary, affected areas, validation steps, linked issues, and screenshots for UI changes.

## Security & Configuration
- Never commit real secrets. Only examples such as `config.ts.example` or `.env.example` belong in the repository.
- `npm start` falls back to local demo mode when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are unset.
- Document any additional environment requirements when a change depends on external services.

## Agent Workflow Notes
- Read `docs/PROJECT_CONSTRAINTS.md` before making architectural changes or AI-related changes.
- Use `docs/implementation-audit/` as the reference set for planned modifications and gap closure work.
- Prefer incremental, verifiable changes over broad rewrites.
- Do not overwrite user changes you did not make.
