import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CoinView } from "../CoinView";

describe("CoinView", () => {
  it("renders heads coin with H label at correct coordinates", () => {
    const coin = {
      position: { row: 0, col: 0 },
      face: "heads" as const,
    };
    render(
      <CoinView
        coin={coin}
        isSelected={false}
        isHighlighted={false}
        isFlipping={false}
        isIllegal={false}
      />,
    );

    const group = screen.getByTestId("coin-0-0");
    const circle = group.querySelector("circle");
    expect(circle).toBeDefined();
    expect(circle?.getAttribute("cx")).toBe("25");
    expect(circle?.getAttribute("cy")).toBe("25");
    expect(circle?.getAttribute("fill")).toBe("var(--color-coin-heads)");
    expect(circle?.getAttribute("stroke")).toBe("var(--color-coin-heads-stroke)");

    const text = group.querySelector("text");
    expect(text?.textContent).toBe("H");
    expect(text?.getAttribute("fill")).toBe("var(--color-text-primary)");
  });

  it("renders tails coin with T label at correct coordinates", () => {
    const coin = {
      position: { row: 1, col: 1 },
      face: "tails" as const,
    };
    render(
      <CoinView
        coin={coin}
        isSelected={false}
        isHighlighted={false}
        isFlipping={false}
        isIllegal={false}
      />,
    );

    const group = screen.getByTestId("coin-1-1");
    const circle = group.querySelector("circle");
    expect(circle?.getAttribute("fill")).toBe("var(--color-coin-tails)");
    expect(circle?.getAttribute("stroke")).toBe("var(--color-coin-tails-stroke)");

    const text = group.querySelector("text");
    expect(text?.textContent).toBe("T");
  });

  it("applies coin-selected class when isSelected is true", () => {
    const coin = {
      position: { row: 0, col: 0 },
      face: "heads" as const,
    };
    render(
      <CoinView
        coin={coin}
        isSelected={true}
        isHighlighted={false}
        isFlipping={false}
        isIllegal={false}
      />,
    );

    const group = screen.getByTestId("coin-0-0");
    expect(group.getAttribute("class")).toContain("coin-selected");
  });

  it("applies coin-illegal class when isIllegal is true", () => {
    const coin = {
      position: { row: 0, col: 0 },
      face: "heads" as const,
    };
    render(
      <CoinView
        coin={coin}
        isSelected={false}
        isHighlighted={false}
        isFlipping={false}
        isIllegal={true}
      />,
    );

    const group = screen.getByTestId("coin-0-0");
    expect(group.getAttribute("class")).toContain("coin-illegal");
  });

  it("applies coin-flipping class when isFlipping is true", () => {
    const coin = {
      position: { row: 0, col: 0 },
      face: "heads" as const,
    };
    render(
      <CoinView
        coin={coin}
        isSelected={false}
        isHighlighted={false}
        isFlipping={true}
        isIllegal={false}
      />,
    );

    const group = screen.getByTestId("coin-0-0");
    expect(group.getAttribute("class")).toContain("coin-flipping");
  });
});
