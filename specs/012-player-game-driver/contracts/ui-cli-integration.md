# Contract: UI & CLI Integration (the migration)

How the browser game (FR-011) and the CLI (SC-004) are re-routed onto `driveGame`. The behavioral
contract here is **"no observable change"**, enforced by keeping the existing UI/integration/e2e/CLI
suites 100% green (SC-001).

---

## C1 — `useBotGame` rework (`src/ui/hooks/useBotGame.ts`)

The hook keeps a **compatible return surface** so `GamePage`/`App` change minimally:

```ts
interface UseBotGameReturn {
  readonly session: GameSession;
  readonly submitMove: (move: Move) => void;     // REPLACES the old applyMove dispatch (human input → DeferredAgent)
  readonly reset: () => void;
  readonly undo: () => void;
  readonly canUndo: boolean;
  readonly finalScore: FinalScore | null;
  readonly botThinking: boolean;
  readonly lastFlipped: ReadonlySet<string>;     // flips from the most recent applied move (for animation)
}
```

### Behavior
- On mount / new options, build `agents`:
  - human slot → `createDeferredAgent(humanSlot)` (its `submit` is exposed as `submitMove`);
  - opponent slot → `createCpuAgent(oppSlot, getBotFunction(opponent), { think: (s) => delay(2000, s) })`
    for a bot opponent, or a second `DeferredAgent` for human-vs-human (both fed by `submitMove`,
    routed to the current slot).
- Start `driveGame({ initialSession, agents, onUpdate, signal, hooks })` in an effect; `onUpdate`:
  - `applied`/`start` ⇒ compute `flipped = findFlippedCoins(prev, next)`, `setSession(next)`, store `lastFlipped`;
  - `applied{forced:true}` is preceded by `hooks.beforeForcedPass` setting the auto-pass notice;
  - `end` ⇒ `setSession` (terminal) — `finalScore` derives from `session.isTerminal`.
- `botThinking = !session.isTerminal && session.state.currentPlayer === oppSlot && opponent !== "human"` (derived; R6).
- `reset()` / `undo()`: abort the current run's `AbortController`, compute the target session
  (`createSession(...)` / `undo(session)`), and start a **new** `driveGame` run from it (agents persist).
  A pending bot/human move is discarded by the abort (SC-006).
- `hooks.beforeForcedPass = (slot, signal) => { setNotice(`${slot} has no legal moves — passing`); return delay(1000, signal); }`.

### Contract tests (`useBotGame.test.tsx`, updated)
- a `submitMove(legalMove)` advances the session and exposes the resulting `lastFlipped`.
- it becomes the bot's turn ⇒ `botThinking` is true until the bot move lands (fake timers advance the 2s `think`).
- `undo()` while `botThinking` aborts the pending bot move (no extra move applied) and rewinds the session.
- forced-pass turn sets the auto-pass notice then advances after the injected 1s delay.
- human-vs-human: `submitMove` routes to whichever slot is current; no bot turn occurs.

---

## C2 — `GamePage` move dispatch (`src/ui/pages/GamePage.tsx`)

- `handleFaceSelect` / `handleJoinAttempt` **pre-validate** with engine queries and call `submitMove(move)`
  instead of `applyMove(move)`:
  - PLACE: position already gated by `legalPlacements`/occupancy/`positionBlockedByEdge` (existing checks);
  - JOIN: gate on `canJoin(state, first, second)` before submitting; if illegal, dispatch `ILLEGAL_MOVE`
    (existing reducer path) and do **not** submit.
- Flip animation is driven by the existing `session.history.length` effect: when history **grows**, dispatch
  `MOVE_RESOLVED` with `lastFlipped`; when it **shrinks** (undo/reset), dispatch `RESET_UI` (unchanged).
- The standalone auto-pass effect in `GamePage` is **removed** — forced pass + notice now come from the driver
  via `useBotGame` (SC-004). `gamePageReducer` is otherwise unchanged.

### Contract tests (`GamePage.test.tsx` / `.a11y`, must stay green)
- placing/joining a coin animates flips and advances the turn (same assertions as today).
- an illegal join shows illegal feedback and does not advance (now via pre-validation).
- the existing a11y assertions are unaffected (no DOM/role changes).

---

## C3 — CLI `runGame` migration (`src/cli/main.ts`, R9)

```ts
export async function runGame(inputSource: AsyncIterable<string>, output: (s: string) => void): Promise<void>;
```

- **Signature preserved** (CLI tests depend on it). New body:
  - one shared line iterator over `inputSource`; a stdin-fed `Agent` per slot whose `selectMove` reads a line
    and `parseMove`s it, **re-reading on parse error** (printing `Error: …`) until it yields a parseable `Move`;
  - `onUpdate` ⇒ print board (`render`) + turn prompt; `applied{forced:true}` prints the forced-pass line;
    `rejected` prints `Error: <engine error>` (re-prompt, matching today's `continue`);
  - own an `AbortController`; on input **EOF** the stdin agent aborts it; `runGame` catches `AbortError` and
    prints `Goodbye!`;
  - delegate the loop to `driveGame`; on `end` print the game-over summary (winner/score) as today.
- The hand-rolled `while (!isTerminal)` loop and the CLI's own forced-pass branch are **deleted** (SC-004).

### Contract tests (`cli` suite, must stay green)
- a scripted input transcript produces the same board renders, prompts, error messages, forced-pass lines,
  and game-over summary as before the migration.
- EOF mid-game prints `Goodbye!` and returns.
- an illegal-but-parseable line prints the engine error and re-prompts (no turn advance).
