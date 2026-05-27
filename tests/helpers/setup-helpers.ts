import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export async function startGameFromSetup() {
  const startBtn = screen.getByRole("button", { name: /start game/i });
  await userEvent.click(startBtn);
}
