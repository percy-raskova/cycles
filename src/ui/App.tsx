import { Desktop } from "@ui/components/Desktop";
import { MenuBar } from "@ui/components/MenuBar";
import { Modal } from "@ui/components/Modal";
import { Scanlines } from "@ui/components/Scanlines";
import { SetupScreen } from "@ui/components/SetupScreen";
import { StatusBar } from "@ui/components/StatusBar";
import { Taskbar } from "@ui/components/Taskbar";
import { TitleBar } from "@ui/components/TitleBar";
import { Toolbar } from "@ui/components/Toolbar";
import { MobileApp } from "@ui/components/mobile";
import { useBotGame } from "@ui/hooks/useBotGame";
import { useGameSession } from "@ui/hooks/useGameSession";
import { deriveLog } from "@ui/lib/deriveLog";
import { GamePage } from "@ui/pages/GamePage";
import type { GameSetupOptions } from "@ui/types/setup";
import { useMemo, useState } from "react";

type Panel = "help" | "controls" | "about" | "settings";

function App() {
  const [modal, setModal] = useState<null | { panel: Panel }>(null);
  const [setupOptions, setSetupOptions] = useState<GameSetupOptions | null>(null);

  const botGame = useBotGame(
    setupOptions ?? { opponent: "human", playerRole: "HEADS", humanFirst: true },
  );

  const humanGame = useGameSession();
  const isBot = setupOptions ? setupOptions.opponent !== "human" : false;

  const { session, applyMove, reset, undo, canUndo } = isBot ? botGame : humanGame;

  const log = useMemo(() => deriveLog(session.history), [session.history]);

  const edgesCount = session.state.edges.length;
  const cyclesCount = 0; // TODO: detect from history or state
  const canPass = !session.isTerminal;

  function openModal(panel: Panel) {
    setModal({ panel });
  }

  function handleStart(options: GameSetupOptions) {
    setSetupOptions(options);
  }

  function handleReset() {
    reset();
  }

  function handleBackToSetup() {
    setSetupOptions(null);
  }

  if (!setupOptions) {
    return (
      <>
        <Desktop />
        <Scanlines />
        <SetupScreen onStart={handleStart} />
      </>
    );
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
            onReset={handleReset}
            onUndo={undo}
            canUndo={canUndo}
            legacyMode={true}
          />
          <Toolbar
            onUndo={undo}
            onReset={handleReset}
            canUndo={canUndo}
            onHelp={(p) => openModal(p === "about" ? "about" : "help")}
            onPass={() => applyMove({ type: "PASS" })}
            canPass={canPass}
          />

          <GamePage session={session} applyMove={applyMove} onReset={handleReset} moveLog={log} />

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
      <MobileApp session={session} applyMove={applyMove} onReset={handleReset} moveLog={log} />

      {isBot && (
        <div className="setup-return">
          <button
            type="button"
            className="setup-return-btn"
            onClick={handleBackToSetup}
            aria-label="Back to setup"
          >
            &#9664; Setup
          </button>
        </div>
      )}
    </>
  );
}

export default App;
