# Feature Specification: React Read-Only SVG Renderer

**Feature Branch**: `004-react-readonly-render`
**Created**: 2026-05-22
**Status**: Draft
**Input**: User description: "Sprint 4: React rendering — read-only first. Render GameState as SVG. No interactivity yet. Coins as circles with H/T labels, edges as line segments, grid as background. The point of read-only first is to nail the visual model before introducing input complexity. Exit criteria: you can paste any GameState from a test into a Storybook-less dev page and see it render correctly."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Render Empty Board (Priority: P1)

As a developer, I want to see an empty 7×7 grid rendered as SVG so I can verify the baseline visual layout before any coins are placed.

**Why this priority**: The empty board is the simplest possible render target and validates the coordinate system, SVG viewport, and grid styling. If this doesn't work, nothing else can.

**Independent Test**: Can be fully tested by mounting the renderer with a fresh `createInitialState()` and verifying that a 7×7 grid of intersection points is visible in the SVG output.

**Acceptance Scenarios**:

1. **Given** an empty `GameState`, **When** the read-only renderer receives it, **Then** an SVG with a 7×7 grid of intersection points is rendered with no coins and no edges.
2. **Given** an empty `GameState`, **When** rendered, **Then** the SVG has a predictable aspect ratio and all 49 grid intersections are visually distinguishable.

---

### User Story 2 - Render Coins with Face Labels (Priority: P1)

As a developer, I want to see placed coins rendered as circles with H (heads) or T (tails) labels so I can visually verify coin placement and face orientation.

**Why this priority**: Coins are the primary game entities. Rendering them correctly — including their face orientation — is the core visual requirement of this sprint.

**Independent Test**: Can be fully tested by providing a `GameState` with a mix of heads and tails coins at various positions, then asserting that each position shows a circle containing the correct letter.

**Acceptance Scenarios**:

1. **Given** a `GameState` with coins at A1 (heads) and B2 (tails), **When** rendered, **Then** A1 shows a circle labeled "H" and B2 shows a circle labeled "T".
2. **Given** a `GameState` with overlapping visual potential, **When** rendered, **Then** each coin is drawn at the correct grid intersection without collision or misalignment.
3. **Given** a `GameState` with all 49 positions filled, **When** rendered, **Then** all 49 coins are visible and correctly labeled.

---

### User Story 3 - Render Edges as Line Segments (Priority: P1)

As a developer, I want to see JOIN moves rendered as line segments between coins so I can visually verify the planar graph structure.

**Why this priority**: Edges define the game topology. Without them, the renderer is just a coin collector, not a game board. Rendering edges correctly validates the entire geometric model.

**Independent Test**: Can be fully tested by providing a `GameState` with multiple edges and asserting that each edge is drawn as a straight line between the correct two coin centers.

**Acceptance Scenarios**:

1. **Given** a `GameState` with an edge between A1 and A2, **When** rendered, **Then** a visible line segment connects the centers of the A1 coin and the A2 coin.
2. **Given** a `GameState` with edges forming a closed polygon, **When** rendered, **Then** the polygon is visually closed (the last edge connects back to the first).
3. **Given** a `GameState` with many edges, **When** rendered, **Then** no edge overlaps obscure another edge to the point of indistinguishability.

---

### User Story 4 - Dev Page Integration (Priority: P2)

As a developer, I want a simple dev page where I can paste a `GameState` object and see it render so I can validate arbitrary board configurations during testing without setting up Storybook.

**Why this priority**: This is the exit criteria for the sprint. It enables manual visual verification of any board state produced by the engine or tests.

**Independent Test**: Can be fully tested by navigating to the dev page, pasting a JSON `GameState` from an existing test, and visually confirming the output matches expectations.

**Acceptance Scenarios**:

1. **Given** the dev server is running, **When** I navigate to the dev page, **Then** I see an empty board rendered by default.
2. **Given** the dev page is loaded, **When** I paste a `GameState` object into a provided text area, **Then** the board re-renders to match the pasted state.
3. **Given** the dev page is loaded with a pasted `GameState`, **When** I paste a different `GameState`, **Then** the board updates without requiring a page refresh.

---

### Edge Cases

- What happens when the `GameState` has no coins? → Empty grid should still render cleanly.
- What happens when coins are placed at every grid intersection? → All 49 coins must be visible; labels must remain readable.
- What happens when edges cross? → Edges may cross (this is a planar graph game, but crossings are part of valid states); rendering must handle them without visual glitches.
- What happens when a coin is removed from the state between renders? → The coin must disappear on the next render; no phantom elements must remain.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The renderer MUST accept a `GameState` object as its sole input and produce an SVG representation without modifying the input state.
- **FR-002**: The renderer MUST draw a 7×7 grid of intersection points as the background of the SVG.
- **FR-003**: The renderer MUST draw each coin in `GameState.coins` as a circle positioned at the corresponding grid intersection.
- **FR-004**: Each coin circle MUST display a text label showing "H" for heads or "T" for tails based on `coin.face`.
- **FR-005**: The renderer MUST draw each edge in `GameState.edges` as a straight line segment connecting the two corresponding coin positions.
- **FR-006**: The renderer MUST update its visual output when the `GameState` prop changes (reactive rendering).
- **FR-007**: The renderer MUST be usable in a plain Vite dev page without requiring Storybook or any additional story tooling.

### Key Entities

- **BoardView**: The top-level SVG container component. Responsible for setting up the SVG viewport, coordinate system, and rendering all child elements.
- **CoinView**: A sub-component (or SVG group) representing a single coin. Attributes: position (grid coordinates), face (heads/tails), visual style (circle + text label).
- **EdgeView**: A sub-component (or SVG element) representing a single edge. Attributes: start position, end position, visual style (line stroke).
- **GridView**: The background grid layer. Attributes: grid dimensions (7×7), intersection point style.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Any `GameState` object from existing engine tests can be pasted into the dev page and renders visually indistinguishable from the expected board configuration.
- **SC-002**: The renderer displays every coin and every edge present in the input `GameState` with 100% accuracy — no missing elements, no phantom elements, no incorrect face labels.
- **SC-003**: Rendering a maximum-density board (49 coins, all possible edges) completes in under 100ms on a modern development machine.
- **SC-004**: The dev page requires zero additional tooling beyond the existing Vite dev server to display and interact with the renderer.

## Assumptions

- The existing `GameState` type from `src/core/types.ts` is the canonical data model for this renderer.
- SVG is the chosen rendering technology; Canvas or DOM-based alternatives are out of scope.
- The dev page is for developer visual verification only; end-user-facing UI polish (animations, themes, responsive design) is out of scope for this sprint.
- No interactivity (click handlers, drag-and-drop, hover states) will be added; the renderer is strictly presentational.
- Storybook will not be introduced; a simple Vite page component is sufficient.
