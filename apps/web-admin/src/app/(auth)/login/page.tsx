"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { bordeCampo, ErrorCampo } from "@/components/ui/ErrorCampo";
import { useTocados } from "@/lib/useTocados";
import { validarEmail, validarPasswordIngreso } from "@/lib/validation";
import { loginAction, type EstadoLogin } from "./actions";

const ESTADO_INICIAL: EstadoLogin = {};

const INPUT =
  "w-full rounded-lg border border-neutral-300 bg-pethood-input px-3.5 py-2.5 text-base text-neutral-900 outline-none transition-colors focus:border-pethood-orange focus:ring-2 focus:ring-pethood-orange/30";

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

            {estado.error && (
              <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {estado.error}
              </p>
            )}

            <BotonIngresar />
          </form>
        </div>
      </main>
    </div>
  );
}
