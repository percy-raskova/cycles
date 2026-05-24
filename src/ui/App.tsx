import { Footer } from "@ui/components/Footer";
import { MenuBar } from "@ui/components/MenuBar";
import { Modal } from "@ui/components/Modal";
import { useGameSession } from "@ui/hooks/useGameSession";
import { GamePage } from "@ui/pages/GamePage";
import { useState } from "react";

function App() {
  const [modal, setModal] = useState<null | { panel: "help" | "controls" | "about" | "settings" }>(
    null,
  );
  const { session, applyMove, reset, undo, canUndo } = useGameSession();

  return (
    <div className="app">
      <MenuBar
        onOpenHelp={() => setModal({ panel: "help" })}
        onOpenSettings={() => setModal({ panel: "settings" })}
        onReset={reset}
        onUndo={undo}
        canUndo={canUndo}
      />
      <GamePage
        session={session}
        applyMove={applyMove}
        onReset={reset}
        onUndo={undo}
        canUndo={canUndo}
      />
      {modal && <Modal initialPanel={modal.panel} onClose={() => setModal(null)} />}
      <Footer />
    </div>
  );
}

export default App;
