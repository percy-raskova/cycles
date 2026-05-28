# Quickstart: Player & Game-Driver Abstraction

Audience: a developer implementing, using, or extending the game driver.
Prereqs: repo cloned, `bun install` done. All commands run from `cycles/`.

---

## Drive a full game headlessly (no UI)

```ts
import { createSession, driveGame, createCpuAgent, createScriptedAgent, strategicBot, randomBot } from "@core";

// CPU vs CPU — benchmarking / regression
const { session, result } = await driveGame({
  initialSession: createSession({ firstPlayer: "HEADS" }),
  agents: {
    HEADS: createCpuAgent("HEADS", strategicBot),  // no clock injected ⇒ deterministic
    TAILS: createCpuAgent("TAILS", randomBot),
  },
  onUpdate: (u) => { if (u.kind === "applied") console.info(u.slot, u.move); },
});
console.info(result.winner, result.heads, result.tails);   // equals computeFinalScore(session)
```

A scripted game (deterministic fixtures / tests):

```ts
await driveGame({
  initialSession: createSession(),
  agents: {
    HEADS: createScriptedAgent("HEADS", headsMoves),
    TAILS: createScriptedAgent("TAILS", tailsMoves),
  },
});
```

`driveGame` performs **no I/O and no wall-clock reads** — the same call runs identically in a Node test,
the browser, or a server runtime. Any pacing (bot "think" delay, auto-pass notice) is injected by the
caller; omit it for instant headless play.

## Feed human input (the deferred agent)

```ts
import { createDeferredAgent } from "@core";

const human = createDeferredAgent("HEADS");
driveGame({ initialSession: createSession(), agents: { HEADS: human.agent, TAILS: cpu }, signal });
// later, when the user commits a (legal) move:
human.submit({ type: "PLACE", position: { row: 3, col: 3 }, face: "heads" });
```

The driver awaits `human.agent.selectMove(...)` during the human's turn; `submit` resolves it. Aborting
`signal` (undo/reset/unmount) discards any pending move.

## Add a new kind of player (the extension seam)

Implement `Agent` — nothing else changes (no engine or driver edits):

```ts
const remote: Agent = {
  slot: "TAILS",
  async selectMove(session, signal) {
    return await fetchMoveFromSomewhere(session, signal); // WebSocket / MCP tool call / etc.
  },
};
await driveGame({ initialSession: createSession(), agents: { HEADS: human.agent, TAILS: remote } });
```

> Real remote/MCP transports are **future work**; this feature ships the seam plus a `FakeRemoteAgent`
> test double that proves an async-from-elsewhere agent runs through the unchanged driver.
> `serializeSession`/`deserializeSession` already exist for shipping sessions over a wire later.

---

## Run it in the app / CLI

```bash
bun run dev          # web app — human vs CPU now runs through driveGame (behavior unchanged)
bun run cli          # CLI hotseat — its loop now delegates to driveGame
```

## Run the test suite (TDD order)

```bash
bun run test:run -- deferred-agent       # 1. external submit / fail / abort
bun run test:run -- scripted-agent       # 2. fixed-list playback
bun run test:run -- cpu-agent            # 3. wraps BotFunction; injected think-delay; abort
bun run test:run -- game-driver          # 4. loop / forced-pass / illegal bound / cancellation / MAX_MOVES / result
bun run test:run -- fake-remote-agent    # 5. US3 — async-from-elsewhere; no core edits
bun run test:run -- useBotGame GamePage  # 6. web migration parity (the SC-001 oracle)
bun run test:run                          # 7. full suite incl. integration/e2e/cli — must be 100% green
bun run test:coverage                     # confirm src/core ≥ 90% (driver included)
bun run typecheck && bun run lint         # gates: tsc + Biome (complexity ≤ 15, engine-purity on src/core/**)
```

---

## Acceptance checklist (maps to spec Success Criteria)

- [x] **SC-001**: full web human-vs-CPU game unchanged — UI/integration/a11y/visual + CLI suites 100% green (415 vitest tests). *e2e (Playwright) needs browser binaries; not run in this environment — run `bun run e2e` in CI/local to fully close.*
- [x] **SC-002**: a two-`Agent` headless game reaches terminal; `result` matches `computeFinalScore` (`headless-game.test.ts`).
- [x] **SC-003**: adding `FakeRemoteAgent` touches only its test file (no engine/driver edits — `src/core/driver/` is wholly new + engine unmodified).
- [x] **SC-004**: the ask→validate→forced-pass loop exists only in `driveGame` (deleted from CLI + `GamePage` + `MobileApp` — only comments remain).
- [x] **SC-005**: `src/core/` ≥ 90% coverage (95.15% lines / 90.87% branches) and `src/core/driver/` has no React/DOM/framework imports.
- [x] **SC-006**: abort tests show zero stale/aborted moves applied (`game-driver` + `deferred-agent` abort cases).
- [x] **SC-007**: an only-illegal agent throws `DriverError("illegal-move-limit")` after the bound (no hang).

## Where things live

| Concern | File |
|---------|------|
| `Agent` interface + driver types | `src/core/driver/types.ts` |
| The single loop (`driveGame`) | `src/core/driver/game-driver.ts` |
| CPU agent (wraps a `BotFunction`) | `src/core/driver/agents/cpu-agent.ts` |
| Deferred/human agent (external `submit`) | `src/core/driver/agents/deferred-agent.ts` |
| Scripted agent (fixed list) | `src/core/driver/agents/scripted-agent.ts` |
| Public exports | `src/core/driver/index.ts` → re-exported by `src/core/index.ts` |
| Web migration | `src/ui/hooks/useBotGame.ts`, `src/ui/hooks/useGameSession.ts`, `src/ui/pages/GamePage.tsx` |
| CLI migration | `src/cli/main.ts` |
