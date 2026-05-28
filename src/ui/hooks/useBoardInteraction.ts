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
 * Owns the ephemeral UI reducer + its lifecycle effects + the click handlers +
 * the memoized derived sets. Layouts (GamePage, MobileApp) keep only their
 * layout-specific concerns (chrome, drawers, new-game orchestration). The
 * ask→validate→pass loop itself lives in the driver (SC-004), not here.
 *
 * Flip animation is intentionally NOT modeled — when a JOIN closes a cycle and
 * flips coins, the new face values in `state.coins` re-render the affected
 * `<CoinView>` leaves in place. No `flippingCoins` set, no `ANIMATION_END`
 * timer, no `isAnimating` gate.
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
  /** First coin of an in-progress JOIN (null when not joining). */
  readonly selectedCoin: Position | null;
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
 * Wire the three remaining lifecycle effects:
 *   1. History shrinks (undo/reset) ⇒ clear ephemeral UI via RESET_UI.
 *      (History growth, formerly a MOVE_RESOLVED trigger, is now a no-op —
 *       phase is already IDLE via CANCEL_PHASE inside handleFaceSelect.)
 *   2. Escape cancels any pending phase, anywhere on the page.
 *   3. Clear the illegal-move highlight after its shake-animation duration.
 *
 * Split out of `useBoardInteraction` to keep that function under Biome's
 * 100-line cap; the behavior is identical to having them inlined.
 */
function useBoardLifecycle(
  session: GameSession,
  illegalMoveCoin: Position | null,
  dispatch: Dispatch<GamePageAction>,
): void {
  const prevHistoryLength = useRef(session.history.length);

  useEffect(() => {
    const current = session.history.length;
    if (current < prevHistoryLength.current) {
      dispatch({ type: "RESET_UI" });
    }
    prevHistoryLength.current = current;
  }, [session.history.length, dispatch]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dispatch({ type: "CANCEL_PHASE" });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

  useEffect(() => {
    if (illegalMoveCoin) {
      const timer = setTimeout(() => dispatch({ type: "CLEAR_ILLEGAL" }), 300);
      return () => clearTimeout(timer);
    }
  }, [illegalMoveCoin, dispatch]);
}

/**
 * Memoize the three sets derived from `state + movePhase + hoveredPosition`.
 * Behavior identical to inline useMemos; split out to fit the per-function
 * line cap. Also fixes the prior GamePage missing-memo regression (previously
 * recomputed `legalPlacements` every render).
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

/** Snapshot of live state read by stable handlers via a ref. */
interface HandlersLatest {
  readonly session: GameSession;
  readonly movePhase: Phase;
  readonly submitMove: (move: Move) => void;
}

/**
 * Stable click/hover handlers — reference-identical across renders.
 *
 * Without this, every PLACE changed `session.state` → every `useCallback`'s
 * deps changed → every leaf (`CoinView`, `EdgeView`, `GridDot`) saw a new
 * `onClick`/`onMouseEnter` prop → `React.memo`'s shallow compare bailed →
 * ~74 leaves re-rendered per move despite identical output. By reading live
 * state through a ref instead of closures, the handlers stay reference-stable
 * and the memos actually skip.
 */
function useStableHandlers(
  // Concrete shape (not RefObject<T>, which types .current as T | null) so
  // handlers can read `.current` without a redundant null-guard branch.
  latest: { readonly current: HandlersLatest },
  dispatch: Dispatch<GamePageAction>,
) {
  const handleIntersectionHover = useCallback(
    (position: Position | null) => dispatch({ type: "HOVER", position }),
    [dispatch],
  );

  const handleIntersectionClick = useCallback(
    (position: Position) => {
      const { session, movePhase } = latest.current;
      log.debug("intersection click", position);
      if (session.isTerminal) {
        log.debug("intersection ignored — terminal");
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
    [latest, dispatch],
  );

  const handleCoinClick = useCallback(
    (position: Position) => {
      const { session, movePhase, submitMove } = latest.current;
      log.debug("coin click", position);
      if (session.isTerminal) {
        log.debug("coin ignored — terminal");
        return;
      }
      if (movePhase.kind === "SELECTING_SECOND_COIN") {
        if (movePhase.first.row === position.row && movePhase.first.col === position.col) {
          dispatch({ type: "CANCEL_PHASE" });
          return;
        }
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
    [latest, dispatch],
  );

  const handleFaceSelect = useCallback(
    (face: CoinFace) => {
      const { session, movePhase, submitMove } = latest.current;
      if (session.isTerminal) return;
      if (movePhase.kind !== "SELECTING_FACE") return;
      const position = movePhase.position;
      if (!isLegalPlacement(session.state, position)) {
        log.warn("place rejected (pre-validation)", position);
        dispatch({ type: "CANCEL_PHASE" });
        return;
      }
      dispatch({ type: "CANCEL_PHASE" });
      submitMove({ type: "PLACE", position, face });
    },
    [latest, dispatch],
  );

  // CANCEL_PHASE and RESET_UI are bare dispatches; one identity each, no state read.
  const cancelPhase = useCallback(() => dispatch({ type: "CANCEL_PHASE" }), [dispatch]);
  const resetUi = useCallback(() => dispatch({ type: "RESET_UI" }), [dispatch]);

  return {
    handleIntersectionHover,
    handleIntersectionClick,
    handleCoinClick,
    handleFaceSelect,
    cancelPhase,
    resetUi,
  };
}

export function useBoardInteraction(
  session: GameSession,
  submitMove: (move: Move) => void,
): BoardInteraction {
  const [ui, dispatch] = useReducer(gamePageReducer, initialGamePageState);
  const { phase: movePhase, hovered: hoveredPosition, illegalMoveCoin } = ui;
  const svgRef = useRef<SVGSVGElement>(null);

  // Latest-ref pattern: handlers read live state here so their useCallback
  // deps stay empty (modulo dispatch) and their identities stay stable across
  // moves. Writing to .current during render is React-supported for refs.
  const latest = useRef<HandlersLatest>({ session, movePhase, submitMove });
  latest.current = { session, movePhase, submitMove };

  useBoardLifecycle(session, illegalMoveCoin, dispatch);
  const { legalPlacementSet, highlightedCoins, previewEdge } = useBoardDerived(
    session.state,
    movePhase,
    hoveredPosition,
  );
  const handlers = useStableHandlers(latest, dispatch);

  const selectedCoin: Position | null =
    movePhase.kind === "SELECTING_SECOND_COIN" ? movePhase.first : null;

  return {
    svgRef,
    movePhase,
    hoveredPosition,
    illegalMoveCoin,
    selectedCoin,
    legalPlacementSet,
    highlightedCoins,
    previewEdge,
    handleIntersectionClick: handlers.handleIntersectionClick,
    handleIntersectionHover: handlers.handleIntersectionHover,
    handleCoinClick: handlers.handleCoinClick,
    handleFaceSelect: handlers.handleFaceSelect,
    handleFaceCancel: handlers.cancelPhase,
    resetUi: handlers.resetUi,
    cancelPhase: handlers.cancelPhase,
    dispatch,
  };
}
