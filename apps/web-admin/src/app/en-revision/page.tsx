import type { Metadata } from "next";
import Link from "next/link";
import { Hourglass } from "lucide-react";

export const metadata: Metadata = { title: "PetHood — Refugio en revisión" };

// Destino cuando la API responde 403 REFUGIO_NO_VERIFICADO: el refugio existe pero todavía
// no está Activo (pendiente de verificación, suspendido o dado de baja).
export default function EnRevisionPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-pethood-beige p-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <Hourglass size={28} />
        </div>
        <h1 className="font-heading text-2xl text-neutral-900">Tu refugio está en revisión</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Un administrador tiene que verificar los datos de tu refugio antes de que puedas usar el panel. Apenas lo
          aprueben, vas a poder ingresar con tu email y contraseña.
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          Si tu refugio ya estaba activo y ves esto, puede que esté suspendido: escribinos desde la sección de contacto.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {/* <a> y no <Link>: /salir borra la cookie y el prefetch lo ejecutaría sin que nadie haga click. */}
          <a
            href="/salir"
            className="rounded-md bg-pethood-orange px-5 py-2.5 text-sm font-medium text-white hover:bg-pethood-orange-dark"
          >
            Salir
          </a>
          <Link
            href="/"
            className="rounded-md border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
