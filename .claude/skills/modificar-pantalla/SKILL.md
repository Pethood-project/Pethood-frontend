---
name: modificar-pantalla
description: Modificar/reestilizar una pantalla YA EXISTENTE (mobile o web-admin) de este monorepo — usar cuando pidan cambiar, actualizar, rediseñar o "mejorar" el estilo/estética de una pantalla puntual. NO usar para crear una pantalla nueva desde cero (ver skill nueva-pantalla).
---

# Modificar pantalla existente

Flujo obligatorio para cualquier pedido de modificación sobre una pantalla que ya existe en el código (mobile o web-admin). El objetivo por defecto es **solo estética** (colores, formas, tipografía), nunca funcionalidad.

## Paso 0 — Pedir la GUI-XX (SIEMPRE, antes de tocar código)

Antes de escribir o modificar una sola línea, preguntar cuál es la **GUI-XX específica** de la pantalla que se quiere modificar (ej. "GUI-10 Ficha Animal"). No asumir ni adivinar el número.

- Si el usuario **no tiene la GUI** o no puede indicarla: preguntar explícitamente si prefiere:
  1. Diseñar la pantalla "de cero" (sin referencia visual puntual), o
  2. Tomar la estética de **otra** GUI-XX existente como referencia (aclarando que sería solo estética — colores/formas/tipografía — no la funcionalidad ni el contenido de esa otra pantalla).
- Cualquier duda sobre qué GUI corresponde a qué pantalla, o sobre el alcance del pedido, se pregunta en este paso — no después.

## Paso 1 — Mirar la referencia visual

La referencia visual real vive en `pantallas/PetHood App (standalone).html` (raíz del repo `PetHood_Front`, carpeta `pantallas/`). **Importante:** esta ruta es la real y no coincide con lo que documenta `AGENTS.md` (que menciona `source/` como carpeta externa) — usar siempre la ubicación real.

Es un export standalone (bundle) de un prototipo React ya armado, con pocas líneas pero muy largas (JS minificado) — no es código reusable ni se porta tal cual, y el texto de UI puede no aparecer literal al buscar con grep. Para inspeccionar la GUI-XX pedida:

- Abrirlo en el navegador (`Start-Process "pantallas/PetHood App (standalone).html"` desde PowerShell) y navegar hasta la pantalla correspondiente, o
- Si el usuario comparte una captura de esa pantalla puntual, leerla directamente como imagen.

De ahí se extrae **únicamente**:
- Paleta de colores (mapear siempre a las clases `pethood-*` definidas en `apps/mobile/tailwind.config.js` — nunca hardcodear el hex).
- Formas: bordes, radios, sombras, spacing/padding.
- Tipografía: tamaños, pesos, jerarquía visual.
- Estilo de componentes reutilizables si aplica (cards, botones, inputs, badges de estado).

## Paso 2 — Aplicar SOLO estética a la pantalla objetivo

- **No** cambiar funcionalidad, lógica, validaciones, contratos de API, ni el **orden** de secciones/campos de la pantalla que se está modificando, salvo que el usuario lo pida explícitamente.
- Si aplicar el nuevo estilo requiere, a criterio propio, algún cambio que va más allá de "copiar estética" (por ejemplo ajustar un componente compartido, tocar un espaciado que afecta otra pantalla), está permitido hacerlo — pero solo cuando el pedido base ya fue: "modificame esta pantalla" + GUI-XX de referencia. Si el pedido es ambiguo sobre si algo es estético o funcional, preguntar antes de aplicarlo.
- Textos de UI en español con tildes, voseo rioplatense; no tocar los textos de feedback (toasts GUI-0.1.x) salvo pedido explícito — esos salen literal de `REQUISITOS.md` sección 5 del repo hermano.

## Paso 3 — Verificación

```bash
# mobile
cd apps/mobile && npx tsc --noEmit
# web-admin
cd apps/web-admin && npm run lint && npm run build
```

Confirmar visualmente (correr la app) que la pantalla modificada mantiene su funcionalidad original y solo cambió en estética.
