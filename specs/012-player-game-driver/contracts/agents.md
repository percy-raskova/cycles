# Contract: Agent Implementations

Three concrete `Agent`s ship in `src/core/driver/agents/` (all pure, framework-free). A fourth — a
`FakeRemoteAgent` test double — lives only in `__tests__/` and proves the extension seam (US3).

---

## C1 — `createCpuAgent(slot, bot, options?): Agent` (FR-009)

```ts
interface CpuAgentOptions { readonly think?: (signal: AbortSignal | undefined) => Promise<void>; }
function createCpuAgent(slot: Player, bot: BotFunction, options?: CpuAgentOptions): Agent;
```

### Postconditions
- `selectMove(session, signal)` ⇒ `await options.think?.(signal); signal?.throwIfAborted(); return bot(session.state);`
- Returns exactly what the wrapped `bot` returns — bot decision logic is **unchanged** (FR-009).
- `slot` as provided; `maxIllegalRetries === 1` (a bot illegal move is a bug → fail loud).
- Pure when `think` is omitted (used by CLI/tests); the UI injects `think = (s) => delay(2000, s)` (R6).

### Contract tests (`cpu-agent.test.ts`)
- wraps a stub bot: `selectMove` resolves the stub's move; `session` is not mutated.
- with an injected `think` that resolves after a fake-timer tick, the move is delayed until `think` settles.
- abort during `think` ⇒ `selectMove` rejects and the bot is **not** called.
- integration: `createCpuAgent("HEADS", strategicBot)` vs `createCpuAgent("TAILS", randomBot)` driven by
  `driveGame` plays a full legal game (no clock injected ⇒ deterministic Strategic side).

---

## C2 — `createDeferredAgent(slot, options?): DeferredHandle` (FR-008, R7)

```ts
interface DeferredHandle { readonly agent: Agent; submit(move: Move): void; fail(error: Error): void; }
function createDeferredAgent(slot: Player, options?: { readonly maxIllegalRetries?: number }): DeferredHandle;
```

### Postconditions
- `agent.selectMove(session, signal)` returns a pending promise; the next `submit(move)` resolves it with
  `move`; `fail(err)` rejects it; an abort on `signal` rejects it with `AbortError` and clears the resolver.
- `submit`/`fail` with no pending request is a no-op (idempotent, no throw).
- Holds at most one pending resolver (the driver asks one slot at a time); no game state.
- `maxIllegalRetries` defaults to `1`; the embedder (UI/CLI) is responsible for only submitting legal moves
  (the UI pre-validates with engine queries — R5).

### Contract tests (`deferred-agent.test.ts`)
- `selectMove` stays pending until `submit`; resolves with the submitted move.
- `fail(e)` rejects the pending `selectMove` with `e`.
- abort rejects the pending `selectMove` with `AbortError`; a subsequent `submit` is a no-op (no late resolve → SC-006).
- `submit` before any `selectMove` call is a harmless no-op.

---

## C3 — `createScriptedAgent(slot, moves): Agent` (FR-012)

```ts
function createScriptedAgent(slot: Player, moves: readonly Move[]): Agent;
```

### Postconditions
- `selectMove` returns `moves[i]` then `moves[i+1]` … on successive calls; resolves synchronously
  (`Promise.resolve`). Exhausting the list throws `DriverError` (a scripted game must reach terminal).
- Totally deterministic; `maxIllegalRetries === 1`.

### Contract tests (`scripted-agent.test.ts`)
- plays its list in order; pairing two scripted agents through `driveGame` reproduces a known game.
- advancing past the end throws `DriverError`.

---

## C4 — `FakeRemoteAgent` (test double only — US3 / SC-003)

Not shipped. Defined in `src/core/driver/__tests__/fake-remote-agent.test.ts`. Resolves `selectMove` from an
injected `Promise<Move>` (settling after an awaited external signal), standing in for a future network/MCP
opponent that delivers moves asynchronously "from elsewhere."

### Contract tests
- a full game runs through the **unchanged** `driveGame` with a `FakeRemoteAgent` on one slot; turn order and
  the terminal result are correct (FR-010).
- a `FakeRemoteAgent` whose `selectMove` rejects (simulated disconnect) surfaces the failure from `driveGame`
  without corrupting the last good session (Edge: move-selection failure).
- **diff assertion (documented, human-verified at review)**: introducing this double required **zero** edits to
  `game-driver.ts`, the engine, or the shipped agents — the change set is the single test file (SC-003).
