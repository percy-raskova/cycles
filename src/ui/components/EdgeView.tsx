import type { Edge } from "@core/types";
import { positionToSvg } from "@ui/lib/coordinates";
import React from "react";

interface EdgeViewProps {
  readonly edge: Edge;
}

function EdgeViewImpl({ edge }: EdgeViewProps) {
  const start = positionToSvg(edge.from);
  const end = positionToSvg(edge.to);

  return (
    <line
      data-testid={`edge-${edge.from.row}-${edge.from.col}-${edge.to.row}-${edge.to.col}`}
      x1={start.x}
      y1={start.y}
      x2={end.x}
      y2={end.y}
      className="edge"
      stroke="var(--color-magenta)"
      strokeWidth={2}
    />
  );
}

export const EdgeView = React.memo(EdgeViewImpl);
