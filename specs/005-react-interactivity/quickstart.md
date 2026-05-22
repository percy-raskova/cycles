# Quickstart: Interactive Browser Gameplay

**Feature**: React Interactivity — Browser Gameplay (Sprint 5)

## Run the Game

```bash
bun run dev
```

Navigate to `http://localhost:5173`. The interactive game page loads by default.

## How to Play

### Place a Coin

1. Click an empty grid intersection.
2. A face selector (H / T) appears.
3. Click heads or tails.
4. The coin is placed and the turn switches.

### Join Two Coins

1. Click a coin to select it (it gets a gold ring).
2. Click a second coin.
   - If the join is legal, an edge appears.
   - If the join is illegal, the first coin stays selected and you see brief red feedback.
3. Click the same coin again or press Escape to cancel the selection.

### Auto-Pass

When a player has no legal moves, a notice appears (e.g., "HEADS has no legal moves — passing") and the turn automatically passes after 1 second.

### Game Over

When both players pass consecutively, the game ends. The final score is displayed with a "New Game" button.

## Keyboard Shortcuts

- **Escape**: Cancel current JOIN selection or face selector.

## Verify Interactivity

1. **Structural**: Run `bun run test` — component tests verify click handlers, state machine transitions, hover states, and game-over flow.
2. **End-to-end**: Play a full game through to terminal state, verifying:
   - Coins place correctly with chosen faces.
   - Edges appear only for legal joins.
   - Auto-pass triggers when no moves exist.
   - Final score matches engine computation.
3. **Animation**: Place a coin that closes a cycle and verify captured coins animate their face flip.

## Switch to Dev Page

To use the read-only dev page from Sprint 4, temporarily change `src/ui/App.tsx` to import `DevPage` instead of `GamePage`.
