import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  /** `chico` para pies de modal y barras de acción. */
  tamano?: "normal" | "chico";
}

const VARIANTES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-pethood-orange text-white hover:bg-pethood-orange-dark",
  secondary: "bg-white text-neutral-800 border border-neutral-300 hover:bg-neutral-50",
};

export function Button({ variant = "primary", tamano = "normal", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-md ${tamano === "chico" ? "px-4 py-2 text-sm" : "px-5 py-2.5 text-base"} font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTES[variant]} ${className}`}
      {...props}
    />
  );
}
