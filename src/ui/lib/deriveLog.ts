import type { Move } from "@core";

export interface LogEntry {
  readonly action: string;
  readonly text: string;
}

export function deriveLog(history: readonly Move[]): LogEntry[] {
  const entries: LogEntry[] = [];
  for (let i = 0; i < history.length; i++) {
    const move = history[i];
    if (!move) continue;
    const player = i % 2 === 0 ? "HEADS" : "TAILS";
    if (move.type === "PLACE") {
      entries.push({
        action: "PLACE",
        text: `${player} placed ${move.face === "heads" ? "Heads" : "Tails"} @ (${move.position.row + 1},${move.position.col + 1})`,
      });
    } else if (move.type === "JOIN") {
      entries.push({
        action: "JOIN",
        text: `${player} joined (${move.a.row + 1},${move.a.col + 1})↔(${move.b.row + 1},${move.b.col + 1})`,
      });
    } else if (move.type === "PASS") {
      entries.push({ action: "PASS", text: `${player} passed` });
    }
  }
  return entries;
}
