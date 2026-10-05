# Armar el APK de PetHood

Dos formas de obtener un APK instalable a mano (sideload). Ninguna necesita cuenta de Expo/EAS.

| | GitHub Actions | Local con contenedor |
| --- | --- | --- |
| Cuándo | APK para repartir, apuntando a la API de Render | Probar en tu celular contra tu backend local |
| Necesita | Nada instalado | Podman o Docker, ~5 GB de imagen, 16 GB de RAM recomendados |
| API | `EXPO_PUBLIC_API_URL` de las Variables del repo (HTTPS) | La del `.env` de `apps/mobile` (suele ser HTTP) |

## Opción 1 — GitHub Actions

Workflow: `.github/workflows/apk.yml`.

1. Cargar las variables en **Settings → Secrets and variables → Actions → Variables** (no Secrets: terminan legibles dentro del APK igual):
   - `EXPO_PUBLIC_API_URL` — obligatoria, ej. `https://<api>.onrender.com/api/v1`. Sin ella el workflow falla al principio.
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` — opcionales.
2. Disparar el workflow:
   - Pestaña **Actions → APK → Run workflow** (el botón aparece recién cuando `apk.yml` está en `main`), o
   - pushear un tag: `git tag v1.0.0 && git push origin v1.0.0`.
3. Bajar el APK desde el run, sección **Artifacts → pethood-apk** (viene en un zip).

Tarda ~15–25 min.

## Opción 2 — Local con contenedor

Usa la imagen `reactnativecommunity/react-native-android` (Android SDK + JDK 17 + Node 22), así que no hace falta instalar Android Studio ni el SDK.

```bash
cd apps/mobile
cp .env.example .env    # si no existe; completar EXPO_PUBLIC_API_URL
podman compose -f docker-compose.apk.yml run --rm apk
# o: docker compose -f docker-compose.apk.yml run --rm apk
```

El APK queda en `apps/mobile/dist/pethood.apk`.

- **El código no se toca**: se monta de solo lectura y se copia adentro del contenedor. `prebuild` genera `android/` y reescribe scripts de `package.json`, pero todo eso queda dentro del contenedor.
- **Caches**: los volúmenes `gradle-cache`, `npm-cache` y `android-sdk` guardan las dependencias y los paquetes del SDK que Gradle baja (la imagen no trae platform/build-tools 36) entre builds. El primer build baja varios GB y tarda bastante más; no borrarlos (`podman volume ls`) para que los siguientes sean rápidos.
- **Arquitectura**: por defecto solo `arm64-v8a` (casi cualquier celular actual), para que compile más rápido. Para un emulador x86_64 o un APK universal:
  ```bash
  ARQUITECTURAS=arm64-v8a,armeabi-v7a,x86,x86_64 podman compose -f docker-compose.apk.yml run --rm apk
  ```
- **HTTP plano**: un APK release bloquea HTTP sin TLS. Como en local la API suele ser `http://<IP>:3000`, este build lo habilita (`usesCleartextTraffic`). El de GitHub Actions no, porque apunta a HTTPS. No repartir un APK local como si fuera el de producción.
- **Con Docker rootful** el APK puede quedar con dueño `root`; con Podman rootless queda a tu nombre.

## Instalar en el celular

1. Pasar el `.apk` al celular (cable, Drive, Telegram, lo que sea) o con `adb install dist/pethood.apk`.
2. Abrirlo y aceptar **"Instalar apps de origen desconocido"** para la app con la que lo abriste.
3. Si ya había una versión instalada firmada con otra clave (por ejemplo, una de EAS), desinstalarla primero: Android no deja actualizar entre firmas distintas.

Para probar contra el backend local, el celular tiene que llegar a la IP de `EXPO_PUBLIC_API_URL`: misma red Wi-Fi si es la IP de la LAN, o Tailscale conectado si es una `100.x.x.x`. Y el backend corriendo (`npm run dev` en el repo backend).

## Firma y Google OAuth

Los dos caminos firman con el `debug.keystore` que genera el template de Expo. Alcanza para instalar a mano, **no para Play Store** (para eso, un keystore propio guardado como secret).

El login con Google en Android necesita un Client ID de tipo Android registrado con el SHA-1 de esa firma. Para verlo, después de un `npx expo prebuild --platform android` local:

```bash
keytool -list -v -keystore android/app/debug.keystore -storepass android | grep SHA1
```

Sin eso, el login con Google falla en el APK; email y contraseña andan igual.
