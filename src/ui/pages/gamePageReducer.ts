import type { Position } from "@core";

/**
 * Ephemeral interaction state for GamePage, modeled as a single state machine so
 * resets are atomic and impossible combinations (e.g. animating with no flipping
 * coins) are unrepresentable. This state is UI-only and never persisted.
 */

export type Phase =
  | { readonly kind: "IDLE" }
  | { readonly kind: "SELECTING_FACE"; readonly position: Position }
  | { readonly kind: "SELECTING_SECOND_COIN"; readonly first: Position };

export interface GamePageState {
  readonly phase: Phase;
  readonly hovered: Position | null;
  readonly illegalMoveCoin: Position | null;
  readonly animation: { readonly flipping: ReadonlySet<string> } | null;
  readonly notice: string | null;
}

export type GamePageAction =
  | { readonly type: "HOVER"; readonly position: Position | null }
  | { readonly type: "SELECT_INTERSECTION"; readonly position: Position }
  | { readonly type: "BEGIN_JOIN"; readonly first: Position }
  | { readonly type: "CANCEL_PHASE" }
  | { readonly type: "MOVE_RESOLVED"; readonly flipped: ReadonlySet<string> }
  | { readonly type: "ANIMATION_END" }
  | { readonly type: "ILLEGAL_MOVE"; readonly position: Position }
  | { readonly type: "CLEAR_ILLEGAL" }
  | { readonly type: "SET_NOTICE"; readonly notice: string | null }
  | { readonly type: "RESET_UI" };

const IDLE: Phase = { kind: "IDLE" };

export const initialGamePageState: GamePageState = {
  phase: IDLE,
  hovered: null,
  illegalMoveCoin: null,
  animation: null,
  notice: null,
};

export function gamePageReducer(state: GamePageState, action: GamePageAction): GamePageState {
  switch (action.type) {
    case "HOVER":
      return { ...state, hovered: action.position };
    case "SELECT_INTERSECTION":
      return { ...state, phase: { kind: "SELECTING_FACE", position: action.position } };
    case "BEGIN_JOIN":
      return { ...state, phase: { kind: "SELECTING_SECOND_COIN", first: action.first } };
    case "CANCEL_PHASE":
      return { ...state, phase: IDLE };
    case "MOVE_RESOLVED":
      return {
        ...state,
        phase: IDLE,
        animation: action.flipped.size > 0 ? { flipping: action.flipped } : null,
      };
    case "ANIMATION_END":
      return { ...state, animation: null };
    case "ILLEGAL_MOVE":
      return { ...state, illegalMoveCoin: action.position };
    case "CLEAR_ILLEGAL":
      return { ...state, illegalMoveCoin: null };
    case "SET_NOTICE":
      return { ...state, notice: action.notice };
    case "RESET_UI":
      return { ...state, phase: IDLE, illegalMoveCoin: null, animation: null, notice: null };
  }
}
