import { Button } from "./Button";

interface UndoButtonProps {
  readonly onClick: () => void;
  readonly disabled?: boolean;
}

export function UndoButton({ onClick, disabled = false }: UndoButtonProps) {
  return (
    <Button variant="undo" aria-label="Undo last move" disabled={disabled} onClick={onClick}>
      &#x21a9; Undo
    </Button>
  );
}
