import type { ButtonHTMLAttributes } from "react";
import "./Button.css";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant */
  variant?: "default" | "primary" | "close" | "reset" | "undo";
}

export function Button({
  variant = "default",
  disabled = false,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const classes = ["button", `button--${variant}`, disabled ? "button--disabled" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={classes} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}
