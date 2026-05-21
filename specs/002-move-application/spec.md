# Feature Specification: Move Application — Flips and Encirclement

**Feature Branch**: `002-move-application`  
**Created**: 2026-05-21  
**Status**: Draft  
**Input**: User description: "Sprint 2: Move application — flips and encirclement. Implement applyMove(state, move) → state. The simple cases first (PLACE, JOIN with no cycle closure), then the encirclement detector. Cycle detection is the hard part: when JOIN connects two coins already in the same component, you've created a cycle, and you need to identify which coins are inside the new bounded region. Approach: find the cycle via BFS/DFS on the graph, then do a point-in-polygon test for every coin not on the cycle. Exit criteria: property test asserts coin count is conserved, parity invariants hold, and a handful of hand-constructed encirclement scenarios produce the expected flips."

## Clarifications

### Session 2026-05-21

- **Q**: Should `applyMove` enforce that a PLACE move's coin face matches the current player?  
  **A**: No — the caller specifies any face, and `applyMove` does not enforce player-face alignment. Face validity is the caller's responsibility.
- **Q**: For a cyclic JOIN, should the spec require extracting the full simple cycle path?  
  **A**: Yes — the full simple cycle must be extracted as a closed polygon boundary to perform the interior-coin detection.
- **Q**: For a JOIN move, does the order of the two Position values in the payload matter?  
  **A**: No — the two positions form an unordered pair. The engine treats both orders identically and normalizes before processing.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Apply Simple Moves (Priority: P1) 🎯 MVP

A player or automated system executes a legal PLACE, JOIN (no cycle), or PASS move and receives an updated game state reflecting the move's direct effects.

**Why this priority**: Simple moves are the foundation of all gameplay. Without reliable move application, no game can progress regardless of how sophisticated the cycle logic becomes.

**Independent Test**: Given any legal move, `applyMove` returns a new `GameState` with the expected changes: placed coins appear on the board, joined coins flip face, supply and player are updated correctly. A property test verifies coin-count conservation and face-parity invariants across random move sequences.

**Acceptance Scenarios**:

1. **Given** a legal PLACE move targeting an empty intersection with coins remaining in supply, **When** `applyMove` is called, **Then** the coin appears at the target position, supply decreases by 1, the current player switches, and `lastAction` is set to PLACE.
2. **Given** a legal JOIN move between two unconnected coins on the same queen-line with no blocking coin and no edge crossing, **When** `applyMove` is called, **Then** the new edge exists in `state.edges`, both endpoint coins have flipped face, the current player switches, and `lastAction` is set to JOIN.
3. **Given** a PASS move when the current player has no legal placements or joins, **When** `applyMove` is called, **Then** `passCount` increments by 1, the current player switches, and `lastAction` is set to PASS.

---

### User Story 2 — Apply Cyclic Join with Encirclement (Priority: P1)

A player joins two coins that are already in the same connected component, closing a cycle and enclosing a bounded planar region. All coins inside that region flip face.

**Why this priority**: Cycle closure is the defining tactical mechanism of CYCLES. Correctly identifying enclosed coins distinguishes a working engine from a broken one.

**Independent Test**: Given hand-constructed board states where a JOIN creates a cycle around a known set of coins, `applyMove` flips exactly those enclosed coins plus the two endpoint coins. Example scenarios with rectangular, triangular, and irregular polygon cycles all produce correct results.

**Acceptance Scenarios**:

1. **Given** four coins forming a rectangle with one coin strictly inside the rectangle, and the four boundary coins partially connected by three edges, **When** the fourth edge is joined closing the rectangle, **Then** the interior coin flips face in addition to the two new endpoint coins.
2. **Given** a cycle-closing JOIN where no coins lie strictly inside the enclosed region, **When** `applyMove` is called, **Then** only the two endpoint coins flip face.
3. **Given** a cycle-closing JOIN where multiple coins lie inside the enclosed region, **When** `applyMove` is called, **Then** every interior coin flips face.
4. **Given** a JOIN that does not create a cycle (endpoints in different components), **When** `applyMove` is called, **Then** only the two endpoint coins flip face and no interior detection is performed.

---

### User Story 3 — Property Test Validation (Priority: P1)

Move application must preserve fundamental game invariants regardless of move sequence or board configuration.

**Why this priority**: Invariants are the safety net that prevents subtle bugs from corrupting game state. Property-based testing catches edge cases that example tests miss.

**Independent Test**: A property test generates random legal move sequences and asserts that every intermediate state satisfies coin-count conservation, face-parity constraints, and move-legality preservation.

**Acceptance Scenarios**:

1. **Given** any sequence of randomly generated legal moves starting from the initial state, **When** `applyMove` is applied at each step, **Then** `coins.size + coinsRemaining` always equals 12.
2. **Given** any sequence of randomly generated legal moves, **When** faces are tracked, **Then** the parity (number of heads vs tails) changes in a way consistent with the number of flipped coins at each step.
3. **Given** any state produced by `applyMove`, **When** `legalPlacements` and `legalJoins` are queried, **Then** they return valid results consistent with the new board configuration.

---

### Edge Cases

- What happens when `applyMove` receives an illegal move (position occupied for PLACE, blocked join, duplicate edge, etc.)? (It MUST throw an error indicating the move is illegal.)
- What happens when a PASS is executed while legal moves still exist? (It MUST still apply — the caller is responsible for move selection; the engine enforces only mechanical validity.)
- What happens when a cycle is formed but its interior contains no coins? (No additional flips beyond the two endpoints.)
- What happens when multiple distinct cycles are formed by a single JOIN? (In a planar graph on a grid with existing planarity constraints, a single new edge in a connected component creates exactly one simple cycle; no ambiguity arises.)
- What happens when a coin lies exactly on the boundary of the enclosed region but is not an endpoint of the closing edge? (Coins on existing edges of the cycle are part of the boundary and do not flip as "interior" coins. Only strictly interior coins flip.)
- What happens when `passCount` reaches 2 and the next player also has no moves? (The game ends by exhaustion, but game-end detection is deferred to Sprint 3. `passCount` simply increments to 2.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose an `applyMove(state, move)` function that accepts a `GameState` and a `Move`, and returns a new immutable `GameState`.
- **FR-002**: For a PLACE move, the system MUST place the specified coin face at the target position, decrement `coinsRemaining` by 1, switch `currentPlayer`, reset `passCount` to 0, and set `lastAction` to PLACE.
- **FR-003**: For a JOIN move that does not create a cycle, the system MUST add the new edge to `state.edges`, flip the face of both endpoint coins, switch `currentPlayer`, reset `passCount` to 0, and set `lastAction` to JOIN.
- **FR-004**: For a JOIN move that creates a cycle, the system MUST extract the full simple cycle path (closed polygon boundary), identify all coins strictly inside that enclosed planar region, and flip their faces in addition to flipping the two endpoint coins. All other state updates (edge addition, player switch, passCount reset, lastAction) follow FR-003.
- **FR-005**: For a PASS move, the system MUST increment `passCount` by 1, switch `currentPlayer`, and set `lastAction` to PASS. `coinsRemaining` and `coins` remain unchanged; `edges` remains unchanged.
- **FR-006**: `applyMove` MUST validate that the move is legal before applying it. If the move is illegal, it MUST throw a descriptive error.
- **FR-007**: The coin-count invariant (`coins.size + coinsRemaining === 12`) MUST hold for every state returned by `applyMove`.
- **FR-008**: The system MUST support a `Move` type that discriminates between PLACE, JOIN, and PASS variants with appropriate payload fields.

### Key Entities

- **Move**: A discriminated union representing a player action.
  - `PLACE`: Contains target `Position` and `CoinFace`.
  - `JOIN`: Contains two `Position` values representing the coins to connect, treated as an unordered pair.
  - `PASS`: Contains no payload.
- **GameState**: Inherited from Sprint 1. Complete game snapshot including coins, edges, supply, player, pass count, and last action.
- **Enclosed Region**: The set of grid points (and coins occupying them) strictly inside the simple polygon formed by a newly created cycle.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The `applyMove` function returns a valid `GameState` that passes invariant checks for 100% of randomly generated legal move sequences tested by the property-based test suite.
- **SC-002**: Every hand-constructed encirclement scenario produces exactly the expected set of flipped coins (endpoints + interior) with zero false positives or false negatives.
- **SC-003**: Illegal moves are rejected by `applyMove` with a descriptive error in 100% of tested illegal move cases.
- **SC-004**: The coin-count invariant (`coins.size + coinsRemaining === 12`) holds for every state produced by `applyMove` across all example and property tests.
- **SC-005**: Example-based tests for all three move types (PLACE, simple JOIN, cyclic JOIN, PASS) execute in under 20 milliseconds per test on standard developer hardware.

## Assumptions

- The underlying `GameState`, `legalPlacements`, and `legalJoins` from Sprint 1 are correct and immutable.
- Planarity is already enforced by `legalJoins`; `applyMove` can assume the resulting graph remains planar.
- A single JOIN creates at most one new simple cycle because planarity prevents multiple simultaneous cycle closures from one edge addition.
- Coins lying exactly on cycle edges (other than endpoints) cannot exist because the "no coin blocking" rule from Sprint 1 prevents coins on the straight segment between joined coins, and cycle edges are a subset of such segments.
- The point-in-polygon test operates on the planar embedding of the cycle edges using integer grid coordinates. Coins at integer grid intersections inside the polygon are considered enclosed.
- Game-end detection (win/loss/draw) is out of scope for this sprint.
- The engine does not validate that a PLACE move's face matches the current player; the caller is responsible for face validity.
- Move history or undo functionality is out of scope for this sprint.
