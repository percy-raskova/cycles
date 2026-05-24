# Feature Specification: Comprehensive E2E Edge-Case Testing

**Feature Branch**: `007-e2e-edge-testing`  
**Created**: 2026-05-22  
**Status**: Draft  
**Input**: User description: "Rigorous E2E testing for the CYCLES game, focusing on edge behavior, edge cases, boundary conditions, and server verification. Must verify all game rules including edge intersection, cycle closure, auto-pass, move validation, and find bugs like placing coins along drawn edges."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Verify Edge Drawing Rules (Priority: P1)

As a player, I want the game to correctly enforce all edge-drawing rules so that invalid joins are rejected and valid joins are accepted, preserving game integrity.

**Why this priority**: Edge drawing is the most complex game mechanic. Bugs here (e.g., edges passing through coins, crossing edges, non-queen-line joins) break the core gameplay. A known bug already exists: coins can be placed on intersections that lie along a drawn edge.

**Independent Test**: Can be fully tested by programmatically constructing board states with various edge configurations and asserting `isLegalJoin` and `legalJoins` return correct results.

**Acceptance Scenarios**:

1. **Given** two coins on a queen-line with no blocking coins and no existing edge between them, **When** a JOIN is attempted, **Then** it is accepted.
2. **Given** two coins not on a queen-line, **When** a JOIN is attempted, **Then** it is rejected.
3. **Given** two coins on a queen-line with a third coin lying between them on that line, **When** a JOIN is attempted, **Then** it is rejected (edge would pass through a coin).
4. **Given** two coins on a queen-line with an existing edge already connecting them, **When** a JOIN is attempted, **Then** it is rejected (no duplicate edges).
5. **Given** a proposed edge that would cross an existing edge at a non-shared point, **When** a JOIN is attempted, **Then** it is rejected.
6. **Given** a proposed edge that shares an endpoint with an existing edge but does not otherwise intersect, **When** a JOIN is attempted, **Then** it is accepted.
7. **Given** an edge drawn along a boundary rank or file, **When** a PLACE is attempted at any empty intersection that lies on the geometric line of that existing edge (between its endpoints), **Then** the placement is rejected (edges block placement along their line).
8. **Given** a full board with no remaining coins, **When** a PLACE is attempted, **Then** it is rejected.

---

### User Story 2 - Verify Cycle Closure and Coin Flipping (Priority: P1)

As a player, I want cycle-closing joins to correctly identify enclosed regions and flip exactly the right coins, so that the scoring outcome is deterministic and fair.

**Why this priority**: Cycle closure is the most strategically significant mechanic. Incorrect flip detection or boundary handling can completely change game outcomes.

**Independent Test**: Can be fully tested by constructing known polygon cycles, closing them, and asserting exactly the expected coins (interior + boundary) are flipped.

**Acceptance Scenarios**:

1. **Given** a square cycle of four coins with one coin strictly inside the square, **When** the cycle is closed, **Then** all four boundary coins and the interior coin are flipped exactly once.
2. **Given** a cycle-closing join that does not form a cycle, **When** the join is applied, **Then** only the two endpoint coins are flipped.
3. **Given** a cycle with coins strictly outside the new region, **When** the cycle is closed, **Then** coins outside the region remain unchanged.
4. **Given** a coin lying exactly on an edge of the cycle polygon (but not a vertex), **When** the cycle is closed, **Then** it is treated as outside the region and not flipped (strict interior semantics).
5. **Given** a nested cycle structure where a new cycle encloses a previously enclosed region, **When** the new cycle is closed, **Then** only coins in the newly enclosed region flip; previously flipped coins outside the new region do not re-flip.

---

### User Story 3 - Verify Terminal Conditions and Auto-Pass (Priority: P2)

As a player, I want the game to correctly detect when no moves are available, trigger auto-pass with a notice, and end the game after two consecutive passes, so that games terminate correctly and scores are computed accurately.

**Why this priority**: Terminal detection ensures games don't hang. Auto-pass provides clear UX when a player is stuck. Score computation must be correct.

**Independent Test**: Can be fully tested by constructing blocked board states and asserting the session transitions through auto-pass to terminal with correct scores.

**Acceptance Scenarios**:

1. **Given** a board state with zero legal placements and zero legal joins, **When** it becomes a player's turn, **Then** an auto-pass is triggered after a brief notice.
2. **Given** a board where one player has no legal moves but the other does, **When** the stuck player's turn begins, **Then** auto-pass fires and play passes to the opponent.
3. **Given** a board state where both players have no legal moves, **When** the first player auto-passes, **Then** the second player also auto-passes and the game ends.
4. **Given** a terminal game state, **When** the game ends, **Then** the final score correctly counts heads and tails coins, and the winner (or draw) is accurate.
5. **Given** a board with exactly one legal move remaining, **When** it is the current player's turn, **Then** no auto-pass occurs and the player must make that move.

---

### User Story 4 - Verify Boundary and Corner Behaviors (Priority: P2)

As a developer, I want all boundary positions and corner cases to behave correctly so that edge effects (grid edges, first/last moves, coin supply exhaustion) don't introduce bugs.

**Why this priority**: Boundary positions (row 0, row 6, col 0, col 6) are often sources of off-by-one bugs. Coin supply exhaustion changes available actions.

**Independent Test**: Can be fully tested by placing coins and drawing edges along and near grid boundaries, asserting all rules hold.

**Acceptance Scenarios**:

1. **Given** coins placed on boundary intersections, **When** joins are attempted along boundary lines, **Then** they are accepted (boundary is not off-limits).
2. **Given** the coin supply is exhausted (12 coins placed), **When** a PLACE move is attempted, **Then** it is rejected.
3. **Given** the coin supply is exhausted, **When** a JOIN move is attempted between existing coins, **Then** it is accepted if legal.
4. **Given** a game with all 12 coins placed and no possible joins, **When** play continues, **Then** both players auto-pass consecutively and the game ends.
5. **Given** a single coin on the board, **When** a JOIN is attempted from that coin to any other, **Then** it is rejected (no second coin exists).
6. **Given** two adjacent coins sharing a row, column, or diagonal, **When** a JOIN is attempted between them, **Then** it is accepted if no edge exists and they are on a queen-line.

---

### User Story 5 - Verify Dev Server and Build Integrity (Priority: P3)

As a developer, I want the Vite dev server to start without errors, the production build to succeed, and all test suites to pass, so that the project is deployable and trustworthy.

**Why this priority**: While lower priority than game rules, a broken build or dev server blocks all development and deployment.

**Independent Test**: Can be fully tested by running the build command and dev server startup in a clean environment.

**Acceptance Scenarios**:

1. **Given** a clean checkout with dependencies installed, **When** `bun run dev` is executed, **Then** the Vite dev server starts without errors on the expected port.
2. **Given** a clean checkout, **When** `bun run build` is executed, **Then** it completes with exit code 0 and outputs to `dist/`.
3. **Given** the test suite, **When** `bun run test:run` is executed, **Then** all tests pass with no failures.
4. **Given** the source code, **When** `bun run lint` and `bun run typecheck` are executed, **Then** both complete with no errors.
5. **Given** a running dev server or static build, **When** Playwright E2E tests are executed, **Then** they cover placing a coin, joining coins, closing a cycle, auto-pass, and terminal state with zero failures.

---

### Edge Cases

- **Edge intersection with placement**: A coin placed at an empty intersection that lies on the geometric line of an existing edge (between its endpoints) must be rejected. Edges block placement along their entire line segment. Coins may only be placed on intersections that are not collinear with any existing edge's endpoints.
- **Collinear overlapping edges**: Two edges on the same queen-line that share a partial overlap (not just a point) must be rejected.
- **Diagonal edge through a coin**: An edge from (0,0) to (2,2) must be rejected if (1,1) has a coin, even though (1,1) is not between them on a strict queen-line segment in the geometric sense — the `passesThroughCoin` function must detect this.
- **Zero-degree coin at game end**: A coin with no incident edges must retain its last-set face in scoring.
- **Simultaneous cycle and endpoint flip**: When a cycle is closed, the endpoint flip is subsumed by the region flip; endpoints must not flip twice.
- **Non-simple cycle (figure-eight)**: The game uses planar graphs; a single JOIN can only close one simple cycle. The BFS pathfinding must return the shortest cycle path.
- **Maximum grid boundary**: All positions must satisfy `0 ≤ row < 7` and `0 ≤ col < 7`; positions outside this range must be rejected.
- **Pass when moves exist**: A voluntary PASS must be rejected when legal moves are available.
- **Game over interaction**: After the game is terminal, all board interactions (place, join) must be ignored.
- **Escape key during face selection**: Pressing Escape while the FaceSelector is open must cancel selection and return to IDLE phase.
- **Clicking the same coin twice during JOIN**: Clicking the initially selected coin a second time must cancel the JOIN selection.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game engine MUST correctly identify all legal joins for any given board state, considering queen-lines, blocking coins, existing edges, and edge crossings.
- **FR-002**: The game engine MUST correctly reject all illegal joins, including non-queen-line attempts, duplicate edges, edges passing through coins, and crossing edges.
- **FR-003**: The game engine MUST correctly detect when a JOIN closes a cycle, identify all coins within the enclosed region (including boundary coins), and flip each exactly once.
- **FR-004**: The game engine MUST correctly detect terminal conditions: both players passing consecutively (passCount ≥ 2).
- **FR-005**: The game engine MUST correctly compute final scores by counting heads and tails coins.
- **FR-006**: The game UI MUST display a clear notice when a player has no legal moves and is being auto-passed.
- **FR-007**: The game UI MUST block all input during the coin-flip animation (500ms) after a cycle-closing join.
- **FR-008**: The game UI MUST allow players to cancel face selection and JOIN selection via the Escape key or by re-clicking the selected coin.
- **FR-009**: The game UI MUST correctly highlight all legal JOIN targets when a coin is selected for joining.
- **FR-010**: The dev server (`bun run dev`) MUST start successfully and the production build (`bun run build`) MUST complete without errors.
- **FR-011**: The full test suite (unit + integration + new E2E/edge-case tests) MUST pass with no failures.
- **FR-012**: Property-based tests MUST verify geometric invariants (e.g., `edgeIntersects` is symmetric, `pointInPolygon` handles all grid points correctly) for thousands of random inputs.
- **FR-013**: The game engine MUST reject placing a coin on any empty intersection that lies on the geometric line of an existing edge (between the edge's endpoints). This prevents coins from being placed "along" a drawn edge.
- **FR-014**: Browser-based end-to-end tests using Playwright MUST cover the critical user journeys: placing a coin, joining two coins, closing a cycle, triggering auto-pass, and reaching a terminal game state.
- **FR-015**: Playwright tests MUST run against a locally served build of the application (either `bun run dev` or a static preview of `dist/`).

### Key Entities

- **Board State**: A 7×7 grid with up to 12 placed coins and a set of drawn edges. Key attributes: coin positions/faces, edge endpoints, current player, remaining coins, pass count.
- **Edge**: A straight line segment between two coins on a queen-line. Key constraints: no duplicates, no crossings, no passing through intermediate coins.
- **Cycle**: A closed loop of edges enclosing a region. Key behavior: closing a cycle triggers a region flip of all coins on and inside the boundary.
- **Game Session**: Tracks state, move history, terminal status, and winner. Key behavior: auto-pass when no legal moves exist; terminal after two consecutive passes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All existing unit and integration tests continue to pass (179 tests as of Sprint 6).
- **SC-002**: New edge-case and boundary tests achieve 100% branch coverage for `src/core/geometry.ts`, `src/core/state.ts` (join/placement logic), and `src/core/move.ts` (cycle detection and flipping).
- **SC-003**: Property-based tests (`fast-check`) run at least 1,000 random board configurations without finding a violation of game invariants.
- **SC-004**: The known bug "placing coins along a drawn edge" is fixed: the engine rejects placement on any empty intersection that lies along an existing edge's line, and a reproducible test confirms this behavior.
- **SC-005**: `bun run build` completes in under 30 seconds with zero errors.
- **SC-006**: The full test suite completes in under 30 seconds with zero failures.
- **SC-007**: Edge-case testing findings are thoroughly documented. If bugs are discovered, they are reproduced with failing tests and tracked for resolution. If no bugs are found, the exhaustive testing effort is documented as evidence of correctness.

## Clarifications

### Session 2026-05-22

- **Q**: Is "placing coins along a drawn edge" a bug, a UI confusion, or a misunderstanding of the rules? → **A**: Bug — the engine should reject placing a coin on any empty intersection that lies along the geometric line of an existing edge. This is a new rule not explicitly stated in `cycles-spec.md`, but it is required for correct planar-graph gameplay. Tests must confirm rejection, and the engine must be updated to enforce this.
- **Q**: When you say "rigorous e2e testing," do you mean unit/property/integration only, browser-based E2E with Playwright, or both? → **A**: Both — comprehensive unit, property-based, and integration tests (no new tools) AND browser-based end-to-end tests using Playwright for critical user journeys.
- **Q**: If thorough testing reveals no new bugs, should the sprint still be considered successful? → **A**: Yes — document findings regardless. The sprint succeeds if coverage targets are met and the testing infrastructure is robust. If bugs are found, they are documented and fixed. If none are found, the exhaustive testing effort itself is documented as evidence of correctness.

## Assumptions

- The game rules from `cycles-spec.md` are the canonical source of truth and are correctly interpreted.
- The 7×7 grid and 12-coin supply are fixed constants; tests do not need to parameterize grid size.
- The Vite dev server and build process use the existing `vite.config.ts` and `tsconfig.json` without modification.
- Tests will be written using Vitest + `@testing-library/react` + `fast-check`, consistent with the existing test infrastructure.
- Property-based tests may use smaller grid sizes (e.g., 3×3 or 4×4) for efficiency, but the core invariants must hold.
- Browser-based end-to-end tests will use Playwright to test critical user journeys (place coin, join coins, close cycle, auto-pass, game over) against the running dev server or a static build.
