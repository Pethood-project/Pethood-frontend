# syntax=docker/dockerfile:1
# Compatible con Docker y Podman (imagen totalmente calificada, sin registro implícito).

FROM docker.io/library/node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
# NEXT_PUBLIC_* se compila adentro del bundle del cliente: tiene que estar en build time.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build
# el proyecto todavía no tiene public/ (sin favicon/estáticos) -> el COPY de abajo no puede fallar
RUN mkdir -p public

FROM docker.io/library/node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

RUN addgroup -S webadmin && adduser -S webadmin -G webadmin
USER webadmin

EXPOSE 3000
CMD ["node", "server.js"]
