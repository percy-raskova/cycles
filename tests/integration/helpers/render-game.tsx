import type { GameSession } from "@core";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useGameSession } from "@ui/hooks/useGameSession";
import { GamePage } from "@ui/pages/GamePage";

function GamePageWrapper({ initialSession }: { readonly initialSession?: GameSession }) {
  const { session, applyMove, reset, undo, canUndo } = useGameSession({ initialSession });

  return (
    <GamePage
      session={session}
      applyMove={applyMove}
      onReset={reset}
      onUndo={undo}
      canUndo={canUndo}
    />
  );
}

interface RenderGameOptions {
  readonly initialSession?: GameSession;
}

export function renderGame(options?: RenderGameOptions) {
  const user = userEvent.setup();
  const result = render(<GamePageWrapper initialSession={options?.initialSession} />);
  return { ...result, user };
}
