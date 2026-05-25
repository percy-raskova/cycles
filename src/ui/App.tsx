import type { Move } from "@core";
import { Desktop } from "@ui/components/Desktop";
import { MenuBar } from "@ui/components/MenuBar";
import { Modal } from "@ui/components/Modal";
import { Scanlines } from "@ui/components/Scanlines";
import { StatusBar } from "@ui/components/StatusBar";
import { Taskbar } from "@ui/components/Taskbar";
import { TitleBar } from "@ui/components/TitleBar";
import { Toolbar } from "@ui/components/Toolbar";
import { useGameSession } from "@ui/hooks/useGameSession";
import { GamePage } from "@ui/pages/GamePage";
import { useMemo, useState } from "react";

type Panel = "help" | "controls" | "about" | "settings";

function deriveLog(history: readonly Move[]): { readonly action: string; readonly text: string }[] {
  const entries: { action: string; text: string }[] = [];
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

function App() {
  const [modal, setModal] = useState<null | { panel: Panel }>(null);
  const { session, applyMove, reset, undo, canUndo } = useGameSession();

  const log = useMemo(() => deriveLog(session.history), [session.history]);

  const edgesCount = session.state.edges.length;
  const cyclesCount = 0; // TODO: detect from history or state
  const canPass = !session.isTerminal;

  function openModal(panel: Panel) {
    setModal({ panel });
  }

  return (
    <>
      <Desktop />
      <Scanlines />

      <div className="app-stage">
        <div className="app-window" role="application" aria-label="CYCLES game window">
          <TitleBar />
          <MenuBar
            onOpenHelp={() => openModal("help")}
            onOpenSettings={() => openModal("settings")}
            onOpenControls={() => openModal("controls")}
            onOpenAbout={() => openModal("about")}
            onReset={reset}
            onUndo={undo}
            canUndo={canUndo}
            legacyMode={true}
          />
          <Toolbar
            onUndo={undo}
            onReset={reset}
            canUndo={canUndo}
            onHelp={(p) => openModal(p === "about" ? "about" : "help")}
            onPass={() => applyMove({ type: "PASS" })}
            canPass={canPass}
          />

          <GamePage session={session} applyMove={applyMove} onReset={reset} moveLog={log} />

          <StatusBar
            player={session.state.currentPlayer}
            coinsRemaining={session.state.coinsRemaining}
            edges={edgesCount}
            cycles={cyclesCount}
            vibe={
              session.isTerminal
                ? "game over"
                : `${session.state.currentPlayer.toLowerCase()} to move`
            }
          />
        </div>

        <Taskbar player={session.state.currentPlayer} />
      </div>

      {modal && <Modal initialPanel={modal.panel} onClose={() => setModal(null)} />}
    </>
  );
}

export default App;
