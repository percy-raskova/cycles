# Contract: Game Driver & Agent

The driver's external surface is exported from `src/core/driver/` and re-exported through the `@core`
barrel. Consumed by the UI hook, the CLI, headless tests, and (later) a server/MCP layer.

---

## C1 — `Agent` interface

```ts
interface Agent {
  readonly slot: Player;                                              // "HEADS" | "TAILS"
  selectMove(session: GameSession, signal?: AbortSignal): Promise<Move>;
  readonly maxIllegalRetries?: number;                               // default 1
}
```

### Obligations on implementers
- `selectMove` MUST resolve with a `Move` or reject; it MUST reject (e.g. `AbortError`) if `signal` aborts.
- It MUST NOT mutate `session` (deep-equality property-tested for the in-core agents).
- It is only ever called when `session.state.currentPlayer === this.slot` and the slot has ≥ 1 legal move.

### Guarantees provided to implementers
- Never called on a terminal session, nor on a forced-pass turn (driver auto-passes — FR-004).
- The returned move is validated by the driver via `step`; an implementer need not re-check legality.

---

## C2 — `driveGame(options): Promise<GameResult>`

```ts
function driveGame(options: GameDriverOptions): Promise<GameResult>;
```

### Preconditions
- `options.agents` has both slots; `agents[s].slot === s` (else throws `DriverError("bad-agents")`).
- `options.initialSession` is a valid `GameSession` (typically from `createSession`).

### Postconditions
- Resolves with `{ session, result }` where `session.isTerminal === true` and
  `result === computeFinalScore(session)` (FR-006).
- Drives the canonical loop until terminal (FR-002): for the current slot `p = session.state.currentPlayer`
  (FR-003) —
  - if `!hasLegalMoves(session)`: `await hooks?.beforeForcedPass?.(p, signal)`, then
    `session = step(session, { type:"PASS" }).session`, emit `applied{forced:true}` (FR-004);
  - else: `move = await agents[p].selectMove(session, signal)`; `signal?.throwIfAborted()`;
    `r = step(session, move)`; if `ok` advance + emit `applied{forced:false}`; if `error` emit
    `rejected` and re-ask the same slot, up to `agents[p].maxIllegalRetries ?? 1` times (FR-005).
- Emits updates in the order `start (applied|rejected)* end` (the only `onUpdate` contract).
- **Cancellation** (FR-007): if `signal` aborts at any await point, `driveGame` rejects with `AbortError`
  and applies no further move; a move already resolved by an aborted turn is discarded by the
  `throwIfAborted()` guard *before* `step` (SC-006).
- **Statically bounded** (FR-014): the outer loop runs at most `options.maxMoves ?? MAX_MOVES` (200)
  iterations; exceeding it throws `DriverError("max-moves-exceeded")`. Illegal retries per turn are
  bounded by a constant.
- **Purity** (FR-013): performs no I/O, no DOM, no wall-clock reads; identical behavior in browser, Node,
  and a server runtime. Any timing is supplied by the caller via `hooks`/agent `think`.

### Behavioral guarantees
| Requirement | Guarantee |
|-------------|-----------|
| FR-002/003 | One loop; current slot read from `session.state.currentPlayer` every turn. |
| FR-004 | Forced pass via `step(_,PASS)`; the slot's agent is **not** asked. |
| FR-005/SC-007 | Illegal move ⇒ `rejected` + re-ask same slot; after `maxIllegalRetries` ⇒ `DriverError("illegal-move-limit")`. |
| FR-006 | Stops exactly at `isTerminal`; `GameResult.result` equals the engine's score. |
| FR-007/SC-006 | Abortable; aborted-turn move never applied. |
| FR-014 | `MAX_MOVES` + retry bound — no unbounded loop. |
| FR-015 | Only calls `step`/`hasLegalMoves`/`computeFinalScore`; no rule logic of its own. |

### Contract tests (write first — TDD)
`game-driver.test.ts`:
- two `ScriptedAgent`s drive a hand-built game to terminal; `result` equals `computeFinalScore` and the
  emitted `applied` sequence matches the scripted moves.
- **property**: for N random legal scripted games, `driveGame`'s terminal session equals replaying the
  same moves through `step` directly (driver adds no behavioral change).
- forced pass: a fixture where one slot has no legal moves emits `applied{forced:true}` without calling
  that slot's agent (spy asserts `selectMove` not invoked).
- illegal move: a `ScriptedAgent` (or stub) returning an illegal move emits `rejected`, then a
  `DriverError("illegal-move-limit")` after the bound; a stub that returns illegal-then-legal recovers.
- cancellation: abort during a pending `selectMove` ⇒ `driveGame` rejects `AbortError` and the post-abort
  session is unchanged (no move applied) — covers SC-006.
- bound: an agent pair that never reaches terminal trips `DriverError("max-moves-exceeded")` at `maxMoves`.
- bad agents: mismatched `agents[s].slot` ⇒ `DriverError("bad-agents")`.

---

## C3 — Types & barrel

```ts
// re-exported from @core
export type { Agent, GameDriverOptions, DriverHooks, DriverUpdate, GameResult } from "./driver";
export { driveGame, DriverError, createCpuAgent, createDeferredAgent, createScriptedAgent } from "./driver";
```
`src/core/index.ts` gains `export * from "./driver/index";` (the only engine-barrel change).
