import fc from "fast-check";
import { describe, it } from "vitest";
import { areEdgesEqual, edgeIntersects, isQueenLine } from "../geometry";
import { applyMove } from "../move";
import { createInitialState, legalJoins, legalPlacements, placeCoin, positionKey } from "../state";
import type { GameState, Position } from "../types";

function buildState(positions: [number, number][]): GameState {
  let state = createInitialState();
  for (const [row, col] of positions) {
    if (state.coinsRemaining <= 0) break;
    const key = `${row},${col}`;
    if (state.coins.has(key)) continue;
    state = placeCoin(state, { row, col }, "heads");
  }
  return state;
}

function addRandomEdges(state: GameState, edgeIndices: [number, number][]): GameState {
  const coinList = Array.from(state.coins.values());
  const newEdges = [...state.edges];

  for (const [i, j] of edgeIndices) {
    const a = coinList[i];
    const b = coinList[j];
    if (!a || !b) continue;
    if (
      isQueenLine(a.position, b.position) &&
      oracleNotBlocked(a.position, b.position, state) &&
      oracleNotDuplicate(a.position, b.position, state) &&
      oracleNotCrossing(a.position, b.position, state)
    ) {
      newEdges.push({ from: a.position, to: b.position });
    }
  }

  return { ...state, edges: newEdges };
}

function pairKey(a: Position, b: Position): string {
  const keyA = positionKey(a);
  const keyB = positionKey(b);
  return keyA < keyB ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;
}

function bruteForceLegalJoins(state: GameState): Set<string> {
  const coinList = Array.from(state.coins.values());
  const result = new Set<string>();

  for (let i = 0; i < coinList.length; i++) {
    const a = coinList[i];
    if (!a) continue;
    for (let j = i + 1; j < coinList.length; j++) {
      const b = coinList[j];
      if (!b) continue;
      if (
        oracleIsQueenLine(a.position, b.position) &&
        oracleNotBlocked(a.position, b.position, state) &&
        oracleNotDuplicate(a.position, b.position, state) &&
        oracleNotCrossing(a.position, b.position, state)
      ) {
        result.add(pairKey(a.position, b.position));
      }
    }
  }

  return result;
}

function oracleIsQueenLine(a: Position, b: Position): boolean {
  return isQueenLine(a, b);
}

function oracleNotBlocked(a: Position, b: Position, state: GameState): boolean {
  const dRow = b.row - a.row;
  const dCol = b.col - a.col;
  const steps = Math.max(Math.abs(dRow), Math.abs(dCol));
  if (steps === 0) return false;

  const stepRow = dRow / steps;
  const stepCol = dCol / steps;

  for (let i = 1; i < steps; i++) {
    const r = a.row + stepRow * i;
    const c = a.col + stepCol * i;
    if (state.coins.has(`${r},${c}`)) return false;
  }
  return true;
}

function oracleNotDuplicate(a: Position, b: Position, state: GameState): boolean {
  return !state.edges.some((e) => areEdgesEqual({ from: a, to: b }, e));
}

function oracleNotCrossing(a: Position, b: Position, state: GameState): boolean {
  return !state.edges.some((e) => edgeIntersects(a, b, e.from, e.to));
}

const positionTupleArb = fc.tuple(fc.integer({ min: 0, max: 6 }), fc.integer({ min: 0, max: 6 }));

describe("oracle property tests", () => {
  describe("legalPlacements", () => {
    it("every returned placement is within bounds and unoccupied", () => {
      fc.assert(
        fc.property(fc.array(positionTupleArb, { maxLength: 20 }), (positions) => {
          const state = buildState(positions);
          const placements = legalPlacements(state);
          return placements.every((p) => {
            const inBounds = p.row >= 0 && p.row <= 6 && p.col >= 0 && p.col <= 6;
            const unoccupied = !state.coins.has(positionKey(p));
            return inBounds && unoccupied;
          });
        }),
        { numRuns: 200 },
      );
    });

    it("returns empty when supply is 0", () => {
      fc.assert(
        fc.property(fc.array(positionTupleArb, { maxLength: 20 }), (positions) => {
          const state = buildState(positions);
          const placements = legalPlacements(state);
          if (state.coinsRemaining <= 0) {
            return placements.length === 0;
          }
          return true;
        }),
        { numRuns: 200 },
      );
    });
  });

  describe("legalJoins", () => {
    it("every returned join passes all four oracle checks", () => {
      fc.assert(
        fc.property(
          fc.array(positionTupleArb, { maxLength: 12 }),
          fc.array(fc.tuple(fc.integer({ min: 0, max: 11 }), fc.integer({ min: 0, max: 11 })), {
            maxLength: 6,
          }),
          (positions, edgeIndices) => {
            const state = addRandomEdges(buildState(positions), edgeIndices);
            const joins = legalJoins(state);
            return joins.every(([a, b]) => {
              return (
                oracleIsQueenLine(a, b) &&
                oracleNotBlocked(a, b, state) &&
                oracleNotDuplicate(a, b, state) &&
                oracleNotCrossing(a, b, state)
              );
            });
          },
        ),
        { numRuns: 200 },
      );
    });

    it("returns exactly the set of pairs that pass the oracle (brute-force sanity check)", () => {
      fc.assert(
        fc.property(
          fc.array(positionTupleArb, { maxLength: 8 }),
          fc.array(fc.tuple(fc.integer({ min: 0, max: 7 }), fc.integer({ min: 0, max: 7 })), {
            maxLength: 4,
          }),
          (positions, edgeIndices) => {
            const state = addRandomEdges(buildState(positions), edgeIndices);
            const joins = legalJoins(state);
            const joinSet = new Set(joins.map(([a, b]) => pairKey(a, b)));
            const bruteForceSet = bruteForceLegalJoins(state);
            if (joinSet.size !== bruteForceSet.size) return false;
            for (const key of joinSet) {
              if (!bruteForceSet.has(key)) return false;
            }
            return true;
          },
        ),
        { numRuns: 200 },
      );
    });
  });

  describe("applyMove invariants", () => {
    it("preserves coin count across random legal move sequences", () => {
      fc.assert(
        fc.property(fc.array(positionTupleArb, { maxLength: 20 }), checkCoinCountInvariant),
        {
          numRuns: 200,
        },
      );
    });

    it("preserves face parity across random legal move sequences", () => {
      fc.assert(fc.property(fc.array(positionTupleArb, { maxLength: 20 }), checkFaceParity), {
        numRuns: 200,
      });
    });

    it("keeps legalPlacements and legalJoins valid after every move", () => {
      fc.assert(
        fc.property(fc.array(positionTupleArb, { maxLength: 20 }), checkLegalityAfterMoves),
        {
          numRuns: 200,
        },
      );
    });
  });
});

function checkCoinCountInvariant(positions: [number, number][]): boolean {
  let state = createInitialState();
  for (const [row, col] of positions) {
    if (state.coinsRemaining <= 0) break;
    const key = `${row},${col}`;
    if (state.coins.has(key)) continue;
    state = applyMove(state, { type: "PLACE", position: { row, col }, face: "heads" });
    if (state.coins.size + state.coinsRemaining !== 12) return false;
  }
  return true;
}

function checkFaceParity(positions: [number, number][]): boolean {
  let state = createInitialState();
  for (const [row, col] of positions) {
    if (state.coinsRemaining <= 0) break;
    const key = `${row},${col}`;
    if (state.coins.has(key)) continue;
    state = applyMove(state, { type: "PLACE", position: { row, col }, face: "heads" });
  }
  const totalCoins = state.coins.size;
  const heads = Array.from(state.coins.values()).filter((c) => c.face === "heads").length;
  const tails = Array.from(state.coins.values()).filter((c) => c.face === "tails").length;
  return heads + tails === totalCoins;
}

function checkLegalityAfterMoves(positions: [number, number][]): boolean {
  let state = createInitialState();
  for (const [row, col] of positions) {
    if (state.coinsRemaining <= 0) break;
    const key = `${row},${col}`;
    if (state.coins.has(key)) continue;
    state = applyMove(state, { type: "PLACE", position: { row, col }, face: "heads" });

    const placements = legalPlacements(state);
    const joins = legalJoins(state);

    if (!placements.every((p) => !state.coins.has(positionKey(p)))) return false;
    if (!joins.every(([a, b]) => oracleIsQueenLine(a, b) && oracleNotBlocked(a, b, state)))
      return false;
  }
  return true;
}
