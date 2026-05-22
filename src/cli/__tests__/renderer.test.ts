import { describe, expect, it } from "vitest";
import { createSession } from "../../core/session";
import { placeCoin } from "../../core/state";
import { render } from "../renderer";

describe("render", () => {
  it("renders an empty board", () => {
    const session = createSession();
    const output = render(session);
    expect(output).toContain("A B C D E F G");
    expect(output).toContain("1");
    expect(output).toContain("7");
    expect(output).toContain("·");
  });

  it("renders coins with correct faces", () => {
    let state = createSession().state;
    state = placeCoin(state, { row: 0, col: 0 }, "heads");
    state = placeCoin(state, { row: 1, col: 1 }, "tails");
    const session = { ...createSession(), state };
    const output = render(session);
    expect(output).toContain("H");
    expect(output).toContain("T");
  });

  it("renders edges when present", () => {
    let state = createSession().state;
    state = placeCoin(state, { row: 0, col: 0 }, "heads");
    state = placeCoin(state, { row: 0, col: 1 }, "tails");
    state = {
      ...state,
      edges: [{ from: { row: 0, col: 0 }, to: { row: 0, col: 1 } }],
    };
    const session = { ...createSession(), state };
    const output = render(session);
    expect(output).toContain("Edges:");
    expect(output).toContain("A1-B1");
  });

  it("does not render edges section when no edges", () => {
    const session = createSession();
    const output = render(session);
    expect(output).not.toContain("Edges:");
  });
});
