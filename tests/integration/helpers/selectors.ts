import type { Position } from "@core/types";
import { screen } from "@testing-library/react";
import type userEvent from "@testing-library/user-event";

export function getCoinAt(row: number, col: number): HTMLElement {
  return screen.getByTestId(`coin-${row}-${col}`);
}

export function getDotAt(row: number, col: number): HTMLElement {
  const dots = screen.getByTestId("grid-view").querySelectorAll("circle");
  const x = 25 + col * 225;
  const y = 25 + row * 225;
  const dot = Array.from(dots).find(
    (c) => c.getAttribute("cx") === `${x}` && c.getAttribute("cy") === `${y}`,
  );
  if (!dot) {
    throw new Error(`No dot found at row=${row}, col=${col} (cx=${x}, cy=${y})`);
  }
  return dot as HTMLElement;
}

export function getEdgeBetween(from: Position, to: Position): HTMLElement {
  try {
    return screen.getByTestId(`edge-${from.row}-${from.col}-${to.row}-${to.col}`);
  } catch {
    return screen.getByTestId(`edge-${to.row}-${to.col}-${from.row}-${from.col}`);
  }
}

export function getFaceSelector(row: number, col: number): HTMLElement | null {
  return screen.queryByTestId(`face-selector-${row}-${col}`);
}

export async function placeCoinAt(
  user: ReturnType<typeof userEvent.setup>,
  row: number,
  col: number,
  face: "heads" | "tails",
): Promise<void> {
  const dot = getDotAt(row, col);
  await user.click(dot);
  const selector = face === "heads" ? "face-selector-heads" : "face-selector-tails";
  await user.click(screen.getByTestId(selector));
}
