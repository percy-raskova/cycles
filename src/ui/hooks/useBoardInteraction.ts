import type { CoinFace, GameSession, Move, Position } from "@core";
import { canJoin, legalJoins, legalPlacements, positionBlockedByEdge, positionKey } from "@core";
import { createLogger } from "@ui/lib/logger";
import {
  type GamePageAction,
  gamePageReducer,
  initialGamePageState,
  type Phase,
} from "@ui/pages/gamePageReducer";
import {
  type Dispatch,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";

const log = createLogger("ui:board");

/** Empty-set singleton so equality stays stable across renders when nothing is flipping. */
const EMPTY_FLIPPING: ReadonlySet<string> = new Set();

/** Coins joinable from `first` — i.e. the second-coin candidates highlighted on the board. */
function buildHighlightedCoins(state: GameSession["state"], movePhase: Phase): ReadonlySet<string> {
  const highlighted = new Set<string>();
  if (movePhase.kind !== "SELECTING_SECOND_COIN") return highlighted;
  const first = movePhase.first;
  for (const [a, b] of legalJoins(state)) {
    if (a.row === first.row && a.col === first.col) {
      highlighted.add(positionKey(b));
    } else if (b.row === first.row && b.col === first.col) {
      highlighted.add(positionKey(a));
    }
  }
  return highlighted;
}

/** The dashed JOIN preview line shown while hovering after picking the first coin. */
function buildPreviewEdge(
  state: GameSession["state"],
  movePhase: Phase,
  hoveredPosition: Position | null,
): { readonly from: Position; readonly to: Position } | null {
  if (
    movePhase.kind === "SELECTING_SECOND_COIN" &&
    hoveredPosition &&
    canJoin(state, movePhase.first, hoveredPosition)
  ) {
    return { from: movePhase.first, to: hoveredPosition };
  }
  return null;
}

function isLegalPlacement(state: GameSession["state"], position: Position): boolean {
  return legalPlacements(state).some((p) => p.row === position.row && p.col === position.col);
}

/**
 * Everything a board-rendering layout needs to drive the engine.
 *
 * The hook owns the ephemeral UI reducer + its lifecycle effects + the click handlers +
 * the memoized derived sets. Layouts (GamePage, MobileApp) keep only their layout-specific
 * concerns (chrome, drawers, new-game orchestration). The ask→validate→pass loop itself
 * lives in the driver (SC-004), not here.
 */
export interface BoardInteraction {
  /** Ref forwarded to the BoardView so floating popups can measure board coordinates. */
  readonly svgRef: RefObject<SVGSVGElement>;
  /** Current interaction phase — layouts read this to conditionally render face popups. */
  readonly movePhase: Phase;
  /** Hovered intersection (desktop only; mobile passes `null` since there's no hover). */
  readonly hoveredPosition: Position | null;
  /** Coin briefly flagged after an illegal click, for the shake animation. */
  readonly illegalMoveCoin: Position | null;
  /** Coins currently in the flip animation (post-move). */
  readonly flippingCoins: ReadonlySet<string>;
  /** First coin of an in-progress JOIN (null when not joining). */
  readonly selectedCoin: Position | null;
  /** True while the flip animation is running — used to gate further input. */
  readonly isAnimating: boolean;
  /** Set of positionKeys that are legal placements right now (memoized). */
  readonly legalPlacementSet: ReadonlySet<string>;
  /** Positions joinable from the first selected coin (memoized). */
  readonly highlightedCoins: ReadonlySet<string>;
  /** Preview JOIN edge shown while hovering (memoized). */
  readonly previewEdge: { readonly from: Position; readonly to: Position } | null;
  readonly handleIntersectionClick: (position: Position) => void;
  readonly handleIntersectionHover: (position: Position | null) => void;
  readonly handleCoinClick: (position: Position) => void;
  readonly handleFaceSelect: (face: CoinFace) => void;
  readonly handleFaceCancel: () => void;
  /** Reset the ephemeral UI (used by "New Game" orchestration). */
  readonly resetUi: () => void;
  /** Cancel any in-progress phase (used by the mobile "tap" toolbar button). */
  readonly cancelPhase: () => void;
  /** Escape hatch for advanced cases — most layouts won't need this. */
  readonly dispatch: Dispatch<GamePageAction>;
}

/**
 * Wire the four lifecycle effects (history-growth ↔ animation, Escape, illegal-clear).
 * Split out of `useBoardInteraction` to keep that function under Biome's 100-line cap;
 * the behavior is identical to having them inlined.
 */
function useBoardLifecycle(
  session: GameSession,
  lastFlipped: ReadonlySet<string>,
  illegalMoveCoin: Position | null,
  isAnimating: boolean,
  dispatch: Dispatch<GamePageAction>,
): void {
  const prevHistoryLength = useRef(session.history.length);

  // History growth ⇒ a move was applied (animate `lastFlipped`); shrink ⇒ undo/reset
  // (clear ephemeral UI). The ask→validate→pass loop itself lives in the driver (SC-004).
  useEffect(() => {
    const current = session.history.length;
    const previous = prevHistoryLength.current;
    if (current > previous) {
      dispatch({ type: "MOVE_RESOLVED", flipped: lastFlipped });
    } else if (current < previous) {
      dispatch({ type: "RESET_UI" });
    }
    prevHistoryLength.current = current;
  }, [session.history.length, lastFlipped, dispatch]);

  // End the flip animation after its CSS duration.
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => dispatch({ type: "ANIMATION_END" }), 500);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, dispatch]);

  // Escape cancels any pending phase, anywhere on the page.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dispatch({ type: "CANCEL_PHASE" });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

  // Clear the illegal-move highlight after its shake-animation duration.
  useEffect(() => {
    if (illegalMoveCoin) {
      const timer = setTimeout(() => dispatch({ type: "CLEAR_ILLEGAL" }), 300);
      return () => clearTimeout(timer);
    }
  }, [illegalMoveCoin, dispatch]);
}

/**
 * Memoize the three sets derived from `state + movePhase + hoveredPosition`. Split out
 * so `useBoardInteraction` stays under Biome's per-function line cap; behavior identical
 * to having the useMemos inlined. Also fixes the prior GamePage missing-memo regression
 * (previous GamePage recomputed `legalPlacements` every render).
 */
function useBoardDerived(
  state: GameSession["state"],
  movePhase: Phase,
  hoveredPosition: Position | null,
) {
  const legalPlacementSet = useMemo(
    () => new Set(legalPlacements(state).map((p) => positionKey(p))),
    [state],
  );
  const highlightedCoins = useMemo(
    () => buildHighlightedCoins(state, movePhase),
    [state, movePhase],
  );
  const previewEdge = useMemo(
    () => buildPreviewEdge(state, movePhase, hoveredPosition),
    [state, movePhase, hoveredPosition],
  );
  return { legalPlacementSet, highlightedCoins, previewEdge };
}

export function useBoardInteraction(
  session: GameSession,
  submitMove: (move: Move) => void,
  lastFlipped: ReadonlySet<string>,
): BoardInteraction {
  const [ui, dispatch] = useReducer(gamePageReducer, initialGamePageState);
  const { phase: movePhase, hovered: hoveredPosition, illegalMoveCoin } = ui;
  const isAnimating = ui.animation !== null;
  const flippingCoins = ui.animation?.flipping ?? EMPTY_FLIPPING;
  const svgRef = useRef<SVGSVGElement>(null);

  useBoardLifecycle(session, lastFlipped, illegalMoveCoin, isAnimating, dispatch);
  const { legalPlacementSet, highlightedCoins, previewEdge } = useBoardDerived(
    session.state,
    movePhase,
    hoveredPosition,
  );

  const handleIntersectionHover = useCallback(
    (position: Position | null) => dispatch({ type: "HOVER", position }),
    [],
  );

  const handleIntersectionClick = useCallback(
    (position: Position) => {
      log.debug("intersection click", position);
      if (session.isTerminal || isAnimating) {
        log.debug("intersection ignored", { isTerminal: session.isTerminal, isAnimating });
        return;
      }
      if (movePhase.kind === "SELECTING_SECOND_COIN") {
        log.debug("intersection cancels pending join");
        dispatch({ type: "CANCEL_PHASE" });
        return;
      }
      if (movePhase.kind !== "IDLE") {
        log.debug("intersection ignored — busy phase", movePhase.kind);
        return;
      }

      const key = positionKey(position);
      if (session.state.coins.has(key)) {
        log.debug("intersection ignored — occupied", position);
        return;
      }
      if (positionBlockedByEdge(position, session.state.edges)) {
        log.debug("intersection ignored — blocked by edge", position);
        return;
      }

      dispatch({ type: "SELECT_INTERSECTION", position });
    },
    [session.isTerminal, isAnimating, movePhase.kind, session.state.coins, session.state.edges],
  );

  const handleCoinClick = useCallback(
    (position: Position) => {
      log.debug("coin click", position);
      if (session.isTerminal || isAnimating) {
        log.debug("coin ignored", { isTerminal: session.isTerminal, isAnimating });
        return;
      }

      if (movePhase.kind === "SELECTING_SECOND_COIN") {
        // Self-click cancels the in-progress JOIN.
        if (movePhase.first.row === position.row && movePhase.first.col === position.col) {
          dispatch({ type: "CANCEL_PHASE" });
          return;
        }
        // Gate JOIN via the engine query only (Constitution III: no inline rule logic).
        if (!canJoin(session.state, movePhase.first, position)) {
          log.warn("join rejected (pre-validation)", { from: movePhase.first, to: position });
          dispatch({ type: "ILLEGAL_MOVE", position });
          return;
        }
        dispatch({ type: "CANCEL_PHASE" });
        submitMove({ type: "JOIN", a: movePhase.first, b: position });
        return;
      }

      if (movePhase.kind !== "IDLE") {
        log.debug("coin ignored — busy phase", movePhase.kind);
        return;
      }

      dispatch({ type: "BEGIN_JOIN", first: position });
    },
    [session.isTerminal, isAnimating, movePhase, session.state, submitMove],
  );

  const handleFaceSelect = useCallback(
    (face: CoinFace) => {
      if (session.isTerminal || isAnimating) return;
      if (movePhase.kind !== "SELECTING_FACE") return;
      const position = movePhase.position;

      // Position was gated for occupancy/edges on selection; confirm a legal placement
      // via the engine query before submitting (Constitution III).
      if (!isLegalPlacement(session.state, position)) {
        // Legacy behavior: a non-placeable spot just closes the selector.
        log.warn("place rejected (pre-validation)", position);
        dispatch({ type: "CANCEL_PHASE" });
        return;
      }

      dispatch({ type: "CANCEL_PHASE" });
      submitMove({ type: "PLACE", position, face });
    },
    [session.isTerminal, isAnimating, movePhase, session.state, submitMove],
  );

  // `handleFaceCancel` and `cancelPhase` are intentionally the same function — both
  // dispatch CANCEL_PHASE; merging them avoids redundant useCallback identities.
  const cancelPhase = useCallback(() => dispatch({ type: "CANCEL_PHASE" }), []);
  const resetUi = useCallback(() => dispatch({ type: "RESET_UI" }), []);

  const selectedCoin: Position | null =
    movePhase.kind === "SELECTING_SECOND_COIN" ? movePhase.first : null;

  return {
    svgRef,
    movePhase,
    hoveredPosition,
    illegalMoveCoin,
    flippingCoins,
    selectedCoin,
    isAnimating,
    legalPlacementSet,
    highlightedCoins,
    previewEdge,
    handleIntersectionClick,
    handleIntersectionHover,
    handleCoinClick,
    handleFaceSelect,
    handleFaceCancel: cancelPhase,
    resetUi,
    cancelPhase,
    dispatch,
  };
}
