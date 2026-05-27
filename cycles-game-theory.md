# A Game-Theoretic Analysis of CYCLES

## 1. Classification

CYCLES is:

- **Finite**: the state space is bounded. Coins ≤ 12; positions ≤ 49; edges ≤ C(12,2) = 66 (further bounded by planarity to ≤ 3·12 − 6 = 30); turns terminate via the two-consecutive-passes rule, which is forced once no legal move exists (per spec 003 clarification, voluntary passing is forbidden).
- **Perfect-information, deterministic, sequential, two-player.**
- **Zero-sum scoring**: the value is `count(heads) − count(tails) ∈ [−12, +12]`. Heads maximizes, Tails minimizes.
- **Impartial in move-availability, partisan in objective**: either player can place either face and join any pair. The asymmetry lives entirely in the terminal scoring function. This places CYCLES *outside* classical Sprague-Grundy theory (which applies to impartial games under normal/misère play conventions) but inside the broader framework of **scoring combinatorial games** (Milnor 1953; Ettinger 1996; Larsson, Nowakowski, Santos 2018+).

By Zermelo's theorem the game has a determined value: either Heads has a winning strategy, Tails has a winning strategy, or both have strategies guaranteeing at least a draw.

## 2. State and Move Algebra

Let `S = (C, E, t, p)` where `C` is the coin map (position → face), `E` the planar edge set, `t ∈ {H, T}` the player to move, `p ∈ {0, 1, 2}` the consecutive pass counter. Terminal iff `p = 2`.

Define the *score functional*

```
σ(S) = #{c ∈ C : c.face = H} − #{c ∈ C : c.face = T}
```

For player `t`, the *signed score* is `+σ` if `t = H` else `−σ`. The value function `v(S)` satisfies

```
v(S) = σ(S)                                    if S terminal
v(S) = max_{m ∈ Legal_H(S)}   v(apply(S, m))   if t = H
v(S) = min_{m ∈ Legal_T(S)}   v(apply(S, m))   if t = T
```

with `v(S) ∈ [−12, +12] ∩ ℤ`.

## 3. Move Value Decomposition

Each move type contributes a deterministic `Δσ`:

**PLACE** (face f at empty position): `Δσ = +1` if `f = H`, else `−1`. No other coins are affected. This is the only move that increases `|C|`.

**JOIN, non-cycle**: flips both endpoints. Let endpoints have faces `(a, b)`. Then

```
Δσ = (flipped count of H) − (flipped count of T) − (previous count delta)
   = (1[¬a = H] − 1[a = H]) + (1[¬b = H] − 1[b = H])
   = 2·(1[a = T] − 1[a = H]) + 2·(1[b = T] − 1[b = H])  /* divided by 2 because each endpoint */
```

Concretely:

- both endpoints T: `Δσ = +2` (good for Heads)
- both endpoints H: `Δσ = −2`
- mixed: `Δσ = 0`

**JOIN, cycle-closing**: flips all coins in the newly bounded region (interior + boundary of that one new face). If the region contains `h` heads and `t` tails before the move, then

```
Δσ_post − Δσ_pre = (t − h) − (h − t) = 2(t − h)
```

So a cycle close swings `σ` by `2(t − h)`. **Heads wants to close cycles enclosing heads-deficient regions; Tails the inverse.**

This decomposition is exact and additive, which means: at any node of the game tree, a player's move value is the sum of its `Δσ` and the optimal sub-game value of the successor.

## 4. The Zugzwang Structure of Non-Cycle JOINs

Among non-cycle JOINs, the `Δσ ∈ {−2, 0, +2}` partition reveals that **a player will never voluntarily play a non-cycle JOIN that flips two of their own faces** unless forced. Conversely, both players actively *want* to play non-cycle JOINs that flip two opponent faces.

This produces classical Zugzwang dynamics: each player tries to exhaust the "good" JOINs for themselves while leaving only "bad" JOINs for the opponent. The pure-JOIN phase (after supply exhaustion) is therefore strategically equivalent to a parity game where players alternate picking edges from a partially ordered set with sign labels, subject to planarity constraints.

A useful invariant: define for each edge candidate `e = (u, v)` the *static value* `δ(e) ∈ {−2, 0, +2}` given the current faces. A position with no `+2` edges available to Heads but with `+2` edges available to Tails after any Heads move is a *losing tempo* for Heads in the JOIN phase.

## 5. Two-Phase Decomposition

The game cleanly factors into:

**Phase I (Placement-permissive)**: `|C| < 12` and at least one placement is legal. Both move classes available.

**Phase II (Pure JOIN)**: `|C| = 12` OR every empty intersection is blocked (rare but possible). Only JOIN moves remain. Phase II is a sub-game whose value depends only on the placed faces and the existing edge set.

This factorization matters because Phase II is *finite-depth and computationally tractable* for analysis: edges ≤ 30 (planarity), and each play strictly grows `|E|`, so depth ≤ 30. Phase II sub-games on small instances can be solved exhaustively.

In Phase I, optimal play must reason about the Phase II sub-game value induced by each placement choice. A coin placed at position `(r, c)` with face `f` contributes:

- `+1·sign(f)` to baseline `σ`.
- A potential flip liability if it lies in regions likely to be later enclosed by cycles.
- A geometric constraint on future JOINs (a placed coin blocks queen-line joins through it).

## 6. Parity and Counting

The supply is exactly 12 coins. If no player passes during placement (which is the typical case until very late), placements alternate: Heads places coins 1, 3, 5, 7, 9, 11 (6 coins); Tails places 2, 4, 6, 8, 10, 12 (6 coins). If each player always self-faces, the *baseline* `σ` after placement is `+6 − 6 = 0`. The entire margin then comes from net flip swings during the game.

Because every flip is `±1` to `σ`, and total flips = (non-cycle JOIN endpoints) + (cycle-closed region cardinalities summed), the final margin is

```
σ_final = (baseline_from_placements) + Σ Δσ_join_moves
```

The number of edges drawable is bounded by `3n − 6 ≤ 30` for `n = 12`, so the game ends in at most 12 + 30 = 42 moves.

## 7. Strategy-Stealing: Why It Does Not Cleanly Apply

In games like Hex or Chomp, strategy-stealing shows first player wins (or at least doesn't lose) because an extra friendly piece is always at worst neutral. The argument: if second player had a winning strategy, first player makes an arbitrary move, then plays second's strategy, treating the extra move as a "free helper" — contradiction.

In CYCLES, an extra friendly-faced coin is **not monotonically beneficial**:

1. It can be flipped to the opponent's face by future cycle-closes.
2. It can block future queen-line JOINs your strategy might require.
3. It occupies a position your stolen strategy might have wanted for a tactical placement.

Therefore the standard strategy-stealing argument is *invalid* for CYCLES. The first-move "advantage" of +1 to `σ` is real, but it does not directly imply Heads-wins-or-draws.

This places CYCLES in the same difficulty class as misère games and certain scoring games where strategy-stealing fails.

## 8. The Pairing/Reflection Strategy: A Negative Result

A natural attempt at proving Tails draws: reflect Heads's moves through the board center `(3, 3)`. The 7×7 grid has central symmetry: `(r, c) ↔ (6−r, 6−c)`.

**Mirror strategy candidate**: After Heads plays move `m`, Tails plays the central reflection `ρ(m)`:

- PLACE at `(r, c)` with face `H` → Tails PLACEs at `(6−r, 6−c)` with face `T`.
- JOIN `(a, b)` → Tails JOINs `(ρ(a), ρ(b))`.

This preserves rotational antisymmetry of `σ` (faces are antisymmetrically placed), and would force `σ_final = 0`, a draw.

**Why it fails**:

1. The center cell `(3, 3)` is fixed under `ρ`. If Heads places at the center, Tails cannot mirror (the square is now occupied). Tails could place anywhere, but loses antisymmetry.
2. Any edge through the center (e.g., from `(0, 0)` to `(6, 6)`, or `(0, 3)` to `(6, 3)`) maps to itself. If Heads draws such an edge, Tails cannot duplicate it (no duplicate-edge rule).
3. Edges that pass *through* `(3, 3)` even without being symmetric (e.g., `(2, 0)` to `(4, 6)`) interact with the center coin if one is placed there.

So center-fixed elements break the pairing. A patched strategy might handle the center as a special case, but I don't see a clean fix without solving the residual sub-game.

**Alternative**: axis reflection (e.g., over row 3) has analogous problems — the entire middle row is self-mapped.

This suggests that if a forced-draw strategy exists, it's *non-trivial* — not a simple geometric symmetry.

## 9. Optimal Strategy Heuristics (when full game-tree search is intractable)

In absence of an exact solution (the state space exceeds 10²⁰ and direct minimax is infeasible), the following heuristics follow from the analysis above. Confidence: 70–85% these are correct optimality directions; the exact crossover points are uncertain.

**(a) Placement-phase principles**

- *Place on the boundary, self-faced, early*. Boundary coins are harder to enclose: any cycle containing a corner must use both incident boundary edges, severely constraining its closure. A corner-placed self-faced coin is the most flip-resistant asset. (90% confidence.)
- *Avoid placing self-faced coins in the geometric center cluster* (rows/cols 2–4). The center is enclosable by many small cycles. (80% confidence.)
- *Consider placing opponent-faced coins in the center as bait* — they are flip-targets for non-cycle JOINs that your opponent now has to play carefully around. (60% confidence — this is double-edged because such coins also seed your opponent's `+2` JOINs.)

**(b) JOIN-phase principles**

- *Never play a non-cycle JOIN with `Δσ ≤ 0` for you unless it forces a worse position on the opponent.* (95% confidence — direct from the algebra.)
- *Evaluate cycle-closing moves by `Δσ_close + v(successor_subgame)`.* The latter requires lookahead; in practice, prefer closing cycles that enclose more opponent-faced coins than yours. (90% confidence.)
- *Defer JOINs when you have no `+2` move and the opponent has no `+2` move either*. Forcing the opponent into Phase II first can grant tempo. But: you must have a placement available. (Confidence 70%.)

**(c) Cycle-control principles**

- *Track the planar dual*. Each closed cycle creates a new bounded face. The total number of bounded faces in the final planar graph is `|E| − |V| + 1` (Euler's formula for the connected component, summed over components). The player who closes the final region often controls the largest swing.
- *Avoid drawing edges that complete a cycle when the cycle's interior is heads-heavy and you are Tails* (and vice versa).

**(d) Tempo and parity**

- 12 coins, ≤ 30 edges in the planar graph: total move budget ≤ 42. If both players self-face all placements, the parity of *flip moves* matters. After 12 placements, the player who placed the 12th coin (Tails under default alternation) must move next in Phase II. This is generally a *disadvantage* if `+2` JOINs are scarce.
- Heads can attempt to *delay* placement (by interspersing JOINs in Phase I) to invert the Phase II move parity. But this only works if the JOINs are favorable.

## 10. Open Questions and Computational Tractability

1. **Is CYCLES a draw?** I conjecture yes, but have no proof. The symmetric move set and even coin count are suggestive.

2. **Reduced-board analysis**: A 3×3 grid with 3 coins, or 4×4 with 4 coins, is exhaustively solvable. Computing exact values for these would either confirm the draw conjecture or produce a counterexample. The engine in this repo (`src/core/`) is well-suited to implementing such a solver: it's pure, immutable, and exposes legal-move enumeration.

3. **Phase II as a standalone problem**: Given a fixed placement of 12 coins, what is the game value of the pure-JOIN sub-game? This is computationally tractable (≤ 30 edges, small branching factor). Solving this sub-game family would reduce CYCLES to a Phase-I-only search over placement strategies.

4. **Approximation via Monte Carlo Tree Search**: For practical play, MCTS with the move-value decomposition in §3 as a rollout heuristic should produce strong play. The engine's purity makes it ideal for MCTS implementation.

5. **Connection to known games**: CYCLES has structural cousins in:
   - **Sprouts** (planar topology, finite combinatorial game)
   - **Y / Havannah** (cycle/connection objectives)
   - **Mock Turtles / Mogul** (parity-flip nim variants)
   - **Reversi / Othello** (region flipping)
   
   None are direct analogues, but Reversi's region-flip parity-and-territory dynamics are closest in spirit, and Reversi is known to be a second-player game on small boards and conjectured-draw on 8×8.

## 11. Practical Recommendation

For a human player aiming for strong play without computation:

1. Open in a corner with your face up.
2. Mirror opponent's placement geometrically when it doesn't violate rule constraints — even though true mirror strategy doesn't work, it produces approximately balanced positions.
3. Never close a cycle that flips a net deficit of your faces.
4. In the late JOIN phase, count the `+2` edges available to each side. If you have more, play aggressively. If you have fewer, look for cycle-closing pivots that swing the count.
5. The final 2–3 moves are usually forced or near-forced; read them exhaustively.

---

**Bottom line on rigor**: the game is provably determined (Zermelo), the move algebra is fully explicit (§3), Phase II is computationally tractable, but the full game value of CYCLES on the 7×7 board with 12 coins is — to my knowledge — unknown and would require either a clever invariant or substantial compute to resolve. The repository's pure-function engine is the right substrate for the computational route.
