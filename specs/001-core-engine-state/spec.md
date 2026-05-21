# Feature Specification: Core Engine — State and Legality

**Feature Branch**: `001-core-engine-state`  
**Created**: 2026-05-20  
**Status**: Draft  
**Input**: User description: "Sprint 1: Core engine — state and legality. Pure TypeScript, zero React. Define the immutable GameState type (coins, edges, supply, current player, pass count). Implement legalPlacements(state) and legalJoins(state) — the latter includes queen-line check, planarity check via integer-coordinate segment intersection, the passes through coin check, and the already connected check. No move application yet. Exit criteria: property tests assert that every move returned by these functions is actually legal under a hand-written oracle, and the planarity check survives adversarial fast-check input."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Query Legal Placements (Priority: P1)

A player or automated system needs to know every empty grid intersection where a coin can legally be placed, given the current board state.

**Why this priority**: Placement is one of the two fundamental actions in CYCLES. Without a reliable list of legal placements, no player or AI can make a valid move.

**Independent Test**: Given any board state with 0–12 coins already placed, the system returns a complete and accurate list of every unoccupied grid intersection. A hand-written oracle independently verifies that each returned position is within the 7×7 grid and not already occupied.

**Acceptance Scenarios**:

1. **Given** a completely empty board with 12 coins in supply, **When** the system queries legal placements, **Then** it returns all 49 grid intersections.
2. **Given** a board with 12 coins already placed and 0 in supply, **When** the system queries legal placements, **Then** it returns an empty list.
3. **Given** a board with coins at (0,0) and (3,3), **When** the system queries legal placements, **Then** the returned list contains exactly 47 positions and excludes both occupied intersections.

---

### User Story 2 - Query Legal Joins (Priority: P1)

A player or automated system needs to know every pair of coins that can be legally joined by a straight edge, respecting all geometric and topological constraints of the game.

**Why this priority**: Join is the second fundamental action. Legal-join computation is the most complex rule in the game and the primary source of bugs in planar-graph games.

**Independent Test**: Given any board state with coins and existing edges, the system returns a complete and accurate list of every legal join. A hand-written oracle independently verifies that each returned join satisfies all four constraints: queen-line alignment, no edge crossing, no coin blocking the straight segment, and no duplicate connection.

**Acceptance Scenarios**:

1. **Given** two coins on the same row with no obstacles, **When** the system queries legal joins, **Then** it includes the pair.
2. **Given** two coins on the same row with a third coin between them, **When** the system queries legal joins, **Then** it excludes the pair because the edge would pass through the intermediate coin.
3. **Given** two coins already connected by an edge, **When** the system queries legal joins, **Then** it excludes the same pair.
4. **Given** two coins whose connecting segment would cross an existing edge, **When** the system queries legal joins, **Then** it excludes the pair.
5. **Given** two coins not aligned horizontally, vertically, or diagonally, **When** the system queries legal joins, **Then** it excludes the pair.

---

### User Story 3 - Property Test Validation (Priority: P1)

The legal-move generators must be provably correct against adversarial input, not just example-based cases.

**Why this priority**: In a game with combinatorial geometry, example tests miss edge cases. Property-based testing guarantees that no matter how bizarre the board configuration, the legal-move functions never claim an illegal move is legal.

**Independent Test**: A property test generates thousands of random board states and verifies that every move returned by `legalPlacements` and `legalJoins` passes an independent hand-written oracle. Another property test bombards the planarity checker with adversarial segment pairs to ensure it never produces false negatives.

**Acceptance Scenarios**:

1. **Given** a property test generating random sequences of legal placements, **When** `legalPlacements` is queried at each step, **Then** every returned move passes the oracle.
2. **Given** a property test generating random coin positions and existing edges, **When** `legalJoins` is queried, **Then** every returned join passes all four oracle checks.
3. **Given** a property test generating arbitrary grid coordinates for two line segments, **When** the planarity checker is asked if they intersect, **Then** its answer matches the mathematical ground truth.

---

### Edge Cases

- What happens when the board has zero coins? (legalJoins must return empty; legalPlacements returns all 49 intersections if supply > 0)
- What happens when two coins are on the same queen-line but at distance 1 (adjacent)? (no coin can block them; planarity check still applies against existing edges)
- What happens when a potential join shares an endpoint with an existing edge? (planarity check must not falsely flag shared endpoints as intersections)
- What happens when the supply is exhausted but coins remain unplaced? (legalPlacements returns empty)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST represent the complete game state as an immutable structure containing: all coins on the board (each with position and face), all drawn edges (each as a pair of coin positions), the number of coins remaining in supply, the current player, and the number of consecutive passes.
- **FR-002**: Given any game state, the system MUST return the complete set of all legal PLACE actions — every empty grid intersection within the 7×7 bounds, provided at least one coin remains in supply.
- **FR-003**: Given any game state, the system MUST return the complete set of all legal JOIN actions — every unordered pair of distinct coins satisfying all four constraints.
- **FR-004**: For a JOIN to be legal, the two coins MUST lie on a shared queen-line (same row, same column, or same 45° diagonal).
- **FR-005**: For a JOIN to be legal, the straight segment between the two coins MUST NOT pass through any other coin on the grid.
- **FR-006**: For a JOIN to be legal, the two coins MUST NOT already be directly connected by an existing edge.
- **FR-007**: For a JOIN to be legal, the new straight segment MUST NOT cross any existing edge segment (shared endpoints are permitted and do not count as crossing).
- **FR-008**: Move-application logic (updating state after a PLACE or JOIN) is explicitly OUT OF SCOPE for this feature.

### Key Entities

- **GameState**: The complete snapshot of a game in progress. Immutable. Contains coin map, edge list, supply count, current player, and pass count.
- **Coin**: A token on a specific grid intersection, showing either heads or tails face.
- **Edge**: A straight line segment connecting exactly two coins.
- **Legal Placement**: An empty grid intersection where a coin from supply can be placed.
- **Legal Join**: An unordered pair of coins that can be connected by a new edge without violating any geometric or topological rule.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The `legalPlacements` function returns a result that passes the hand-written oracle for 100% of randomly generated board states tested by the property-based test suite.
- **SC-002**: The `legalJoins` function returns a result that passes the hand-written oracle for 100% of randomly generated board states tested by the property-based test suite.
- **SC-003**: The planarity checker (segment intersection test) produces zero false negatives across thousands of adversarial random segment pairs generated by property-based testing.
- **SC-004**: Every example-based test for `legalPlacements` and `legalJoins` executes in under 10 milliseconds on standard developer hardware.

## Assumptions

- The game is played on a fixed 7×7 grid with 49 intersections and a shared supply of 12 coins.
- The game engine is implemented as pure functions over immutable data structures; no UI framework is involved in this feature.
- The pass count in GameState is initialized to 0 and increments when a player has no legal action, but pass logic itself is out of scope for this sprint.
- "Already connected" refers only to direct edges, not transitive path connectivity.
- Planarity is enforced at the edge-drawing level; cycle detection and region enclosure are deferred to a later sprint.
