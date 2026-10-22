"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { bordeCampo, ErrorCampo } from "@/components/ui/ErrorCampo";
import { useTocados } from "@/lib/useTocados";
import { validarEmail, validarPasswordIngreso } from "@/lib/validation";
import { loginAction, type EstadoLogin } from "./actions";

const ESTADO_INICIAL: EstadoLogin = {};

// Códigos que devuelve el backend en `/login?error=` tras el login con Google.
const ERRORES_GOOGLE: Record<string, string> = {
  sin_permisos_panel: "Este panel es exclusivo para administradores y refugios verificados.",
  usuario_no_registrado: "No encontramos una cuenta con ese correo. Registrate primero desde la app.",
  usuario_suspendido: "Tu cuenta está suspendida. Escribinos a soporte para más información.",
  refugio_no_verificado: "Tu refugio todavía no está verificado o no está activo.",
  google_cancelado: "Cancelaste el ingreso con Google.",
};
const ERROR_GOOGLE_GENERICO = "No pudimos ingresar con Google. Intentá de nuevo.";

const INPUT =
  "w-full rounded-lg border border-neutral-300 bg-pethood-input px-3.5 py-2.5 text-base text-neutral-900 outline-none transition-colors focus:border-pethood-accent-600 focus:ring-2 focus:ring-pethood-accent-600/30";

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
export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error: codigoGoogle } = use(searchParams);
  // Se guarda en estado y se limpia la URL: así el código no queda en la barra ni en el historial.
  const [errorGoogle] = useState(() =>
    codigoGoogle ? (ERRORES_GOOGLE[codigoGoogle] ?? ERROR_GOOGLE_GENERICO) : undefined,
  );
  useEffect(() => {
    if (codigoGoogle) window.history.replaceState(null, "", "/login");
  }, [codigoGoogle]);
  const [estado, formAction] = useActionState(loginAction, ESTADO_INICIAL);
  const [verPassword, setVerPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { ver, tocar, intentarEnviar } = useTocados();
  const errorEmail = validarEmail(email);
  const errorPassword = validarPasswordIngreso(password);

  return (
    <div className="grid flex-1 lg:grid-cols-[1.4fr_1fr]">
      <aside className="relative hidden overflow-hidden lg:block">
        <Image src="/img/login-gato.jpg" alt="" fill priority sizes="58vw" className="object-cover object-[35%_center]" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-neutral-900/20 to-transparent" />
        <a
          href="https://commons.wikimedia.org/wiki/File:Black_and_white_cat%E2%80%93IMG_6332_02.jpg"
          target="_blank"
          rel="noreferrer"
          className="absolute right-4 top-4 text-xs text-white/70 hover:text-white"
        >
          Foto: Kızıl / CC BY-SA 4.0
        </a>
        <div className="animate-dashboard-in absolute inset-x-0 bottom-0 space-y-3 p-12 text-white">
          <h2 className="font-heading text-4xl leading-tight">Cada mascota merece un hogar.</h2>
          <p className="max-w-md text-lg text-white/85">
            Gestioná refugios, publicaciones y solicitudes de adopción desde un solo lugar.
          </p>
        </div>
      </aside>

      {/* Mobile/tablet: la foto ocupa todo el header (el panel lateral solo aparece desde lg). */}
      <div className="relative h-72 w-full overflow-hidden sm:h-96 lg:hidden">
        <Image src="/img/login-gato.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[35%_30%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-neutral-900/20 to-transparent" />
        <div className="animate-dashboard-in absolute inset-x-0 bottom-0 space-y-1.5 px-6 pb-5 text-white sm:px-12">
          <h2 className="font-heading text-2xl leading-tight sm:text-3xl">Cada mascota merece un hogar.</h2>
          <p className="max-w-md text-sm text-white/85 sm:text-base">
            Gestioná refugios, publicaciones y solicitudes de adopción desde un solo lugar.
          </p>
        </div>
        <a
          href="https://commons.wikimedia.org/wiki/File:Black_and_white_cat%E2%80%93IMG_6332_02.jpg"
          target="_blank"
          rel="noreferrer"
          className="absolute right-3 top-2 text-[10px] text-white/80 hover:text-white"
        >
          Foto: Kızıl / CC BY-SA 4.0
        </a>
      </div>

      <main className="flex flex-col justify-start px-6 pb-8 pt-4 sm:px-12 lg:justify-center lg:px-16 lg:py-10">
        <div className="animate-dashboard-in mx-auto w-full max-w-sm">
          <Link href="/" className="mb-4 flex items-center gap-2.5 lg:mb-8">
            <Image src="/img/logo.png" alt="" width={44} height={44} priority />
            <span className="font-heading text-2xl text-neutral-900">PetHood</span>
          </Link>

          <form
            action={formAction}
            noValidate
            onSubmit={(e) => {
              intentarEnviar();
              if (errorEmail || errorPassword) e.preventDefault();
            }}
          >
            <h1 className="mb-1 font-heading text-3xl text-neutral-900">Bienvenido de nuevo</h1>
            <p className="mb-8 text-base text-neutral-700">Ingresá con tu cuenta y seguí ayudando a que cada mascota encuentre su lugar.</p>

            <label className="mb-1 block text-sm font-semibold text-neutral-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={100}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => tocar("email")}
              aria-invalid={!!ver("email", errorEmail)}
              aria-describedby="email-error"
              className={`${INPUT} ${bordeCampo(ver("email", errorEmail))}`}
            />
            <div className="mb-5 min-h-4">
              <ErrorCampo id="email" error={ver("email", errorEmail)} />
            </div>

            <label className="mb-1 block text-sm font-semibold text-neutral-700" htmlFor="password">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={verPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => tocar("password")}
                aria-invalid={!!ver("password", errorPassword)}
                aria-describedby="password-error"
                className={`${INPUT} pr-11 ${bordeCampo(ver("password", errorPassword))}`}
              />
              <button
                type="button"
                onClick={() => setVerPassword((v) => !v)}
                aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500 hover:text-neutral-800"
              >
                {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="mb-8 min-h-4">
              <ErrorCampo id="password" error={ver("password", errorPassword)} />
            </div>

            {(estado.error ?? errorGoogle) && (
              <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {estado.error ?? errorGoogle}
              </p>
            )}

            <BotonIngresar />
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-neutral-500">
            <span className="h-px flex-1 bg-neutral-200" />o<span className="h-px flex-1 bg-neutral-200" />
          </div>
          <a
            href="/auth/google"
            className="flex w-full items-center justify-center gap-3 rounded-md border border-neutral-300 bg-white px-5 py-2.5 text-base font-medium text-neutral-800 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pethood-accent-600/45 focus-visible:ring-offset-1"
          >
            {/* ds-allow-hardcode:start colores de marca de Google, no entran en la paleta */}
            <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5 shrink-0">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            {/* ds-allow-hardcode:end */}
            Continuar con Google
          </a>
        </div>
      </main>
    </div>
  );
}
