import type { Position } from "@core/types";
import { CELL_SIZE, MARGIN } from "./constants";

export function positionToSvg(position: Position): { readonly x: number; readonly y: number } {
  return {
    x: MARGIN + position.col * CELL_SIZE,
    y: MARGIN + position.row * CELL_SIZE,
  };
}
