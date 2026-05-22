import type { GameSession } from "../core/session";

export function render(session: GameSession): string {
  const lines: string[] = [];

  // Header
  lines.push("   A B C D E F G");

  // Grid rows (row 1 at top = internal row 0)
  for (let row = 0; row < 7; row++) {
    const rowNum = row + 1;
    let rowStr = ` ${rowNum}`;
    for (let col = 0; col < 7; col++) {
      const key = `${row},${col}`;
      const coin = session.state.coins.get(key);
      if (coin) {
        rowStr += ` ${coin.face === "heads" ? "H" : "T"}`;
      } else {
        rowStr += " ·";
      }
    }
    lines.push(rowStr);
  }

  // Edges list
  if (session.state.edges.length > 0) {
    lines.push("");
    const edgeStrs = session.state.edges.map((e) => {
      return `${coordToLabel(e.from)}-${coordToLabel(e.to)}`;
    });
    lines.push(`Edges: ${edgeStrs.join(", ")}`);
  }

  return lines.join("\n");
}

function coordToLabel(pos: { readonly row: number; readonly col: number }): string {
  const col = String.fromCharCode("A".charCodeAt(0) + pos.col);
  const row = pos.row + 1;
  return `${col}${row}`;
}
