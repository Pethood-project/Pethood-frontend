"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { loginAction, type EstadoLogin } from "./actions";

const ESTADO_INICIAL: EstadoLogin = {};

function BotonIngresar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Ingresando…" : "Ingresar"}
    </Button>
  );
}

// GUI-02 equivalente para web-admin — un único login para Admin y Refugio;
// el backend devuelve los roles del usuario y el server action reenvía al dashboard correspondiente.
export default function LoginPage() {
  const [estado, formAction] = useActionState(loginAction, ESTADO_INICIAL);

  return (
    <div className="flex flex-1 items-center justify-center">
      <form action={formAction} className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold text-neutral-900">Ingresar</h1>
        <p className="mb-6 text-sm text-neutral-500">Panel de administradores y refugios de PetHood.</p>

        <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mb-4 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
        />

        <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mb-6 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
        />

        {estado.error && (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {estado.error}
          </p>
        )}

        <BotonIngresar />
      </form>
    </div>
  );
}
