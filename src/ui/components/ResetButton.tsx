import { Button } from "./Button";

interface ResetButtonProps {
  readonly onClick: () => void;
}

export function ResetButton({ onClick }: ResetButtonProps) {
  return (
    <Button variant="reset" aria-label="Reset game to initial state" onClick={onClick}>
      &#x21bb; Reset
    </Button>
  );
}
