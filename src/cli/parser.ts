import type { CoinFace, Move, Position } from "../core/types";

export type ParseResult =
  | { readonly kind: "ok"; readonly move: Move }
  | { readonly kind: "error"; readonly error: string };

export function parseMove(input: string): ParseResult {
  const trimmed = input.trim();

  if (trimmed === "PASS") {
    return { kind: "ok", move: { type: "PASS" } };
  }

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0];

  if (cmd === "P" && parts.length === 3) {
    return parsePlace(parts[1], parts[2]);
  }

  if (cmd === "J" && parts.length === 3) {
    return parseJoin(parts[1], parts[2]);
  }

  return { kind: "error", error: "Invalid command format" };
}

function parsePlace(coord: string | undefined, faceStr: string | undefined): ParseResult {
  if (coord === undefined || faceStr === undefined) {
    return { kind: "error", error: "Invalid command format" };
  }
  const pos = parseCoord(coord);
  if (!pos) {
    return { kind: "error", error: `Invalid coordinate: ${coord}` };
  }
  const face = parseFace(faceStr);
  if (!face) {
    return { kind: "error", error: `Invalid face: ${faceStr}` };
  }
  return { kind: "ok", move: { type: "PLACE", position: pos, face } };
}

function parseJoin(coordA: string | undefined, coordB: string | undefined): ParseResult {
  if (coordA === undefined || coordB === undefined) {
    return { kind: "error", error: "Invalid command format" };
  }
  const a = parseCoord(coordA);
  if (!a) {
    return { kind: "error", error: `Invalid coordinate: ${coordA}` };
  }
  const b = parseCoord(coordB);
  if (!b) {
    return { kind: "error", error: `Invalid coordinate: ${coordB}` };
  }
  return { kind: "ok", move: { type: "JOIN", a, b } };
}

function parseCoord(s: string): Position | null {
  if (s.length !== 2) return null;
  const col = s.charCodeAt(0) - "A".charCodeAt(0);
  const rowChar = s.charAt(1);
  const row = Number.parseInt(rowChar, 10) - 1;
  if (Number.isNaN(row) || col < 0 || col >= 7 || row < 0 || row >= 7) {
    return null;
  }
  return { row, col };
}

function parseFace(s: string): CoinFace | null {
  const upper = s.toUpperCase();
  if (upper === "H" || upper === "HEADS") return "heads";
  if (upper === "T" || upper === "TAILS") return "tails";
  return null;
}
