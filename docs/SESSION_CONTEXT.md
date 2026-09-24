# ERJA Session Context

Last updated: 2026-09-24

This is a compact handoff note to restore project context if a conversation is lost. Update it when meaningful project decisions or work are completed.

## Owner and project

- Owner: Charan Jee
- Project name: ERJA — Emergency Railway Journey Assistant
- Workspace: `C:\Projects\EmergencyRailwayJourneyAssistant`
- Goal, as currently understood: help Indian railway passengers monitor a specified train journey and receive route-aware booking suggestions when a direct reservation may not be available.

## What the current workspace contains

- `frontend/`: React 19 + Vite application, with pages for login/signup, dashboard, journeys, journey creation/details, recommendations, profile, notifications, and PNR.
- `backend/`: Node.js/Express 5 CommonJS API, with MongoDB/Mongoose models and modules for authentication, journeys, trains/stations, chart data, recommendations, notifications, PNR, and profiles/settings.
- `docs/PROJECT_STATE.md`: extensive prior handoff and technical audit, dated 2026-09-19. Read this before substantial implementation work, then verify relevant details against current source files.
- `docs/`: several architecture/specification document names exist, but `PROJECT_STATE.md` is the populated project overview. The other listed design documents were empty at inspection time.
- Root `package.json` only lists a small number of dependencies; frontend and backend have their own package files and scripts.

## Project behavior and design captured so far

The documented main workflow is: authenticate, create a journey (train number, date, boarding/destination stations, class preferences, mixed-class permission), verify train and classes, store journey, monitor chart preparation, obtain vacancy data, then calculate and rank recommendations.

The key domain rule is route-specific vacancy: an available berth must cover the passenger's requested station interval. Coach labels are not availability counts. Train numbers must remain strings to preserve leading zeros. Mixed-class suggestions must only be considered when the user opted in. Split tickets must cover the whole route without gaps and must not reuse the same berth.

The documented optimizer includes direct-seat, same-class split, mixed-class split, multi-hop, wait-for-chart, and TTE-related strategies. The documentation says real NTES/IRCTC integrations and mock chart/vacancy paths exist. It records a monitoring schedule of every 2 minutes and flags a historical 30-second expectation as unresolved. Treat those as findings from the 2026-09-19 audit until code is checked again.

## Working preferences from Charan

1. Inspect a file before proposing code changes to it.
2. When code for a file is needed, provide the **complete replacement contents for that file** in the chat so Charan can copy it, clear the old contents, and paste the replacement. Explain the file path and purpose. Do not assume a partial snippet is preferred.
3. Build shared project context before starting implementation; ask questions only when needed to resolve a real ambiguity.
4. When Charan says to pause, goodbye, or continue another day after a work session, provide a brief note of what was done today and what to do next session.
5. Keep this document updated as durable project memory. Charan can provide it again to resume after lost conversation context.

## Current account usage snapshot (2026-09-24)

The Codex account usage tool reported:

- Plan: Free
- Codex usage window: 0% used at the time of checking
- Window duration: 43,200 minutes (30 days)
- No reset credits available

Usage limits can change; re-check them when Charan asks. This snapshot is not a promise of unlimited use. The tool did not report a separate per-message token allowance. Conversations still have context limits, so this handoff file should hold durable project facts and decisions.

## Current session status

- Read the root structure, backend/frontend package manifests, and the existing project-state handoff.
- No application code has been changed in this session.
- Created this file as the compact session-recovery note.
- Next useful step: with Charan, confirm the intended product scope and what is already working, then pick one small project area to review directly in source before making changes.

## Resume checklist

1. Read this file and `docs/PROJECT_STATE.md`.
2. Check current source before relying on historical claims, especially for the first task chosen.
3. Preserve the route-aware vacancy and train-number rules above unless Charan changes the requirements.
4. Before code proposals, inspect the target file and provide the entire updated file contents for Charan to paste.
5. At a session pause, update this context with completed work, decisions, and the next step, then give Charan a short daily handoff.
