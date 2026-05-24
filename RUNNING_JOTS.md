# Deferred Ideas & Running Notes

**Project**: CYCLES — Vaporwave Win95 UI Theme Sprint
**Date**: 2026-05-24

## Approved for This Sprint (MVP)

- **Reset/Undo**: Pure client-side via move-history replay. No database, no persistence.
- **Session management**: Lifted into `App.tsx` via custom hook (`useGameSession`). Pass callbacks to `MenuBar` and `GamePage`.
- **Deployment**: Static SPA on Cloudflare Pages. No Workers, Durable Objects, or KV needed.

## Deferred to Next Sprint / Future

### React Context Refactor
**Idea**: Replace prop-drilling between `App` → `MenuBar` → `GamePage` with a `GameSessionContext`.
**Why deferred**: Not needed for single-player local state. Adds complexity without MVP value.
**When to revisit**: If we add multiplayer, save/resume across browser sessions, or deeply nested component trees.

### Save/Resume Game State
**Idea**: Persist `GameSession` to `localStorage` or `IndexedDB` so players can resume after refresh.
**Why deferred**: Not in spec. `localStorage` is trivial to add later.
**When to revisit**: User story explicitly requests it, or as a polish item post-launch.

### Multiplayer / Shared State
**Idea**: Real-time two-player over network using WebSockets + Cloudflare Durable Objects.
**Why deferred**: Massive scope increase. Requires backend, matchmaking, reconnection logic, conflict resolution.
**When to revisit**: Dedicated multiplayer spec. Infrastructure needed: Durable Objects, WebSocket Worker, D1 for match history.

### Leaderboards / High Scores
**Idea**: Global or per-device score tracking.
**Why deferred**: No competitive scoring mechanism in current rules.
**When to revisit**: If scoring rules evolve or tournament mode is added.

## Technical Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-24 | No database for Reset/Undo | Move-history replay is pure, immutable, and sufficient. |
| 2026-05-24 | Static SPA on Cloudflare Pages | PWA requirements (manifest, service worker) are build-time artifacts. No runtime server needed. |
| 2026-05-24 | Custom hook over Context for MVP | Props are manageable at current depth. Context is premature abstraction. |

## Reminders

- **Do not** add `localStorage` persistence without a spec covering save/resume UX (e.g., "Continue Game?" modal on load).
- **Do not** refactor to Context until at least 3+ components need session access at different tree depths.
