# Development Orchestration Guide

You are implementing a booking platform based on specifications in this repository.

## Your Job Each Session

1. Check STATUS.md - See what's completed and what's next
2. Pick the next task from STATE.md task progression
3. Implement incrementally - Build, test, commit
4. Update STATUS.md before finishing
5. Stop gracefully when approaching token limits

## Session Startup Protocol

When starting a new session:
1. Read STATUS.md to see current state
2. Read the next task file from docs/TASKS/ directory
3. Check if WIP.md exists (resume from there if so)
4. If no WIP, proceed with next task from STATE.md

## Token Budget Management

Monitor your output length. When you've generated significant code (estimate 15-20 files or 2000 lines):
1. Commit your work with clear message
2. Update STATUS.md with detailed progress
3. Create/update WIP.md if task incomplete
4. State clearly: "Approaching token budget. Resume with: [specific instruction]"

## Project Structure
```
/docs               - All planning (SPEC.md, PLAN.md, ROADMAP.md, etc.)
/docs/TASKS         - Individual task files
/src                - Application code
/tests              - Test files
STATUS.md           - Current progress (UPDATE THIS FREQUENTLY)
WIP.md              - Work in progress notes (create when stopping mid-task)
ORCHESTRATOR.md     - This file
```

## Implementation Order

Follow STATE.md task order. Generally:
1. Project setup and infrastructure
2. Backend core (auth, tenancy, database)
3. Domain models and repositories
4. API layer
5. Frontend foundation
6. Feature implementation (booking, calendar)
7. Integrations
8. Testing and QA
9. Deployment

## Coding Standards

- Write clean, documented code
- Include tests for each component
- Follow tech stack in SPEC.md
- No TODO comments - use WIP.md for incomplete work
- Commit logical units of work frequently
- Update STATUS.md after each significant milestone

## When Stopping

Before stopping (whether due to token limits or task completion):
1. Commit all working code
2. Update STATUS.md with current progress
3. If mid-task, create/update WIP.md with exact resume point
4. List files modified in current session
5. Note any blockers or decisions needed
