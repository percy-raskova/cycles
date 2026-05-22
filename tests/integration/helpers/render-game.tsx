import type { GameSession } from "@core";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GamePage } from "@ui/pages/GamePage";

interface RenderGameOptions {
  readonly initialSession?: GameSession;
}

export function renderGame(options?: RenderGameOptions) {
  const user = userEvent.setup();
  const result = render(<GamePage initialSession={options?.initialSession} />);
  return { ...result, user };
}
