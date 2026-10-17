# KinevoX

KinevoX helps beginners build a practical fitness routine, explore simple movements, and track progress. Tagline: “Evolve Your Potential.”

## Run & Operate

- Use the managed `artifacts/kinevox: web` workflow to run the app in Replit.
- On Windows, follow `artifacts/kinevox/README.md` to run the app in a local browser.
- `pnpm --filter @workspace/kinevox run typecheck` — typecheck the KinevoX frontend.
- `pnpm run typecheck` — typecheck all workspace packages.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React, Vite, TypeScript, and Wouter
- Local persistence: browser `localStorage`
- The shared API server and PostgreSQL packages exist in the workspace but are not used by the first KinevoX MVP.

## Where things live

- `artifacts/kinevox/src/App.tsx` — app routes, bilingual copy, demonstration content, onboarding, recommendation rules, and local progress tracking.
- `artifacts/kinevox/src/index.css` — KinevoX visual theme and responsive layout.
- `artifacts/kinevox/README.md` — local Windows run instructions and first-version boundaries.

## Architecture decisions

- The first version is a browser app intended to run locally on Windows, not a packaged desktop executable.
- Keep the MVP free and local-first: no accounts, API services, or backend persistence.
- Save only language, non-sensitive exercise preferences, and completed-session history in the browser.

## Product

- English and Arabic interface with LTR/RTL direction.
- Preference onboarding, rule-based demonstration routine matching, exercise search/filter, session completion, and progress history.
- Privacy page with a local-data clear action.

## User preferences

- Build a free Windows-first prototype and improve it gradually from user feedback.
- Keep Arabic and English support from the start.

## Gotchas

- The KinevoX Vite config requires both `PORT` and `BASE_PATH`; the Replit workflow supplies them. Set both in PowerShell for local Windows use.
- The app's preference and progress data belongs to the browser profile on the device where it was entered.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
