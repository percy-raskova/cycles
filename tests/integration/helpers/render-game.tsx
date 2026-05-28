import type { GameSession } from "@core";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBotGame } from "@ui/hooks/useBotGame";
import { GamePage } from "@ui/pages/GamePage";

function GamePageWrapper({ initialSession }: { readonly initialSession?: GameSession }) {
  const { session, submitMove, lastFlipped, notice, reset } = useBotGame({
    opponent: "human",
    playerRole: "HEADS",
    humanFirst: true,
    botDelayMs: 0,
    ...(initialSession ? { initialSession } : {}),
  });

  return (
    <GamePage
      session={session}
      submitMove={submitMove}
      lastFlipped={lastFlipped}
      notice={notice}
      onReset={reset}
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
