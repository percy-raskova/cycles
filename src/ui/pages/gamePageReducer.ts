import type { Position } from "@core";

/**
 * Ephemeral interaction state for GamePage, modeled as a single state machine so
 * resets are atomic and impossible combinations are unrepresentable. UI-only,
 * never persisted.
 */

export type Phase =
  | { readonly kind: "IDLE" }
  | { readonly kind: "SELECTING_FACE"; readonly position: Position }
  | { readonly kind: "SELECTING_SECOND_COIN"; readonly first: Position };

export interface GamePageState {
  readonly phase: Phase;
  readonly hovered: Position | null;
  readonly illegalMoveCoin: Position | null;
  readonly notice: string | null;
}

export type GamePageAction =
  | { readonly type: "HOVER"; readonly position: Position | null }
  | { readonly type: "SELECT_INTERSECTION"; readonly position: Position }
  | { readonly type: "BEGIN_JOIN"; readonly first: Position }
  | { readonly type: "CANCEL_PHASE" }
  | { readonly type: "ILLEGAL_MOVE"; readonly position: Position }
  | { readonly type: "CLEAR_ILLEGAL" }
  | { readonly type: "SET_NOTICE"; readonly notice: string | null }
  | { readonly type: "RESET_UI" };

const IDLE: Phase = { kind: "IDLE" };

export const initialGamePageState: GamePageState = {
  phase: IDLE,
  hovered: null,
  illegalMoveCoin: null,
  notice: null,
};

/** True if two `Position | null`s point at the same cell (or both are null). */
function samePosition(a: Position | null, b: Position | null): boolean {
  if (a === b) return true;
  return a !== null && b !== null && a.row === b.row && a.col === b.col;
}

export function gamePageReducer(state: GamePageState, action: GamePageAction): GamePageState {
  switch (action.type) {
    case "HOVER":
      // Fires on every mousemove; same-cell hover returns `state` unchanged so
      // the reducer result is reference-stable and downstream consumers skip.
      return samePosition(state.hovered, action.position)
        ? state
        : { ...state, hovered: action.position };
    case "SELECT_INTERSECTION":
      return { ...state, phase: { kind: "SELECTING_FACE", position: action.position } };
    case "BEGIN_JOIN":
      return { ...state, phase: { kind: "SELECTING_SECOND_COIN", first: action.first } };
    case "CANCEL_PHASE":
      // Already idle ⇒ no-op (avoids the spread allocating an identical state).
      return state.phase === IDLE ? state : { ...state, phase: IDLE };
    case "ILLEGAL_MOVE":
      return { ...state, illegalMoveCoin: action.position };
    case "CLEAR_ILLEGAL":
      return { ...state, illegalMoveCoin: null };
    case "SET_NOTICE":
      return { ...state, notice: action.notice };
    case "RESET_UI":
      return { ...state, phase: IDLE, illegalMoveCoin: null, notice: null };
  }
}
