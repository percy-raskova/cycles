import { Desktop } from "@ui/components/Desktop";
import { MenuBar } from "@ui/components/MenuBar";
import { Modal } from "@ui/components/Modal";
import { Scanlines } from "@ui/components/Scanlines";
import { StatusBar } from "@ui/components/StatusBar";
import { Taskbar } from "@ui/components/Taskbar";
import { TitleBar } from "@ui/components/TitleBar";
import { Toolbar } from "@ui/components/Toolbar";
import { MobileApp } from "@ui/components/mobile";
import { useGameSession } from "@ui/hooks/useGameSession";
import { deriveLog } from "@ui/lib/deriveLog";
import { GamePage } from "@ui/pages/GamePage";
import { useMemo, useState } from "react";

type Panel = "help" | "controls" | "about" | "settings";

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

      {/* Mobile PWA layout — shown/hidden via CSS media query */}
      <MobileApp session={session} applyMove={applyMove} onReset={reset} moveLog={log} />
    </>
  );
}

export default App;
