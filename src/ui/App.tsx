import { MenuBar } from "@ui/components/MenuBar";
import { Modal } from "@ui/components/Modal";
import { GamePage } from "@ui/pages/GamePage";
import { useState } from "react";

function App() {
  const [modal, setModal] = useState<null | { panel: "help" | "controls" | "about" | "settings" }>(
    null,
  );

  return (
    <div className="app">
      <MenuBar
        onOpenHelp={() => setModal({ panel: "help" })}
        onOpenSettings={() => setModal({ panel: "settings" })}
      />
      <GamePage />
      {modal && <Modal initialPanel={modal.panel} onClose={() => setModal(null)} />}
    </div>
  );
}

export default App;
