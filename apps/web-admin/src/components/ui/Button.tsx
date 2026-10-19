import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "peligro";
  /** `chico` para pies de modal y barras de acción. */
  tamano?: "normal" | "chico";
  /** `pastilla`: bordes totalmente redondeados (panel del refugio). */
  forma?: "normal" | "pastilla";
}

const VARIANTES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-pethood-accent-600 text-white hover:bg-pethood-accent-700",
  secondary: "bg-white text-neutral-800 border border-neutral-300 hover:bg-neutral-50",
  peligro: "bg-red-600 text-white hover:bg-red-700",
};

// La pastilla suma sombra y un leve "hundido" al clic, en línea con los chips de filtro.
const FORMAS: Record<NonNullable<ButtonProps["forma"]>, string> = {
  normal: "rounded-md transition-colors",
  pastilla:
    "inline-flex items-center justify-center gap-2 rounded-full shadow-sm transition-all hover:shadow active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pethood-accent-600/45 focus-visible:ring-offset-1",
};

export function Button({ variant = "primary", tamano = "normal", forma = "normal", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`${FORMAS[forma]} ${tamano === "chico" ? "px-4 py-2 text-sm" : "px-5 py-2.5 text-base"} font-medium disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTES[variant]} ${className}`}
      {...props}
    />
  );
}
