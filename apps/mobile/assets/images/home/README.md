# Fotos de las tarjetas de Inicio

Dos juegos de cuatro, uno por vista. Para cambiar una foto se pisa el archivo con el
**mismo nombre**: no hay que tocar código.

## `adopter/` — vista de adoptante

| Archivo         | Tarjeta             |
| --------------- | ------------------- |
| `adopt.jpg`     | Adoptar una mascota |
| `lost.jpg`      | Mascotas perdidas   |
| `requests.jpg`  | Mis solicitudes     |
| `campaigns.jpg` | Campañas activas    |

## `shelter/` — vista de refugio

| Archivo         | Tarjeta                 |
| --------------- | ----------------------- |
| `requests.jpg`  | Solicitudes de adopción |
| `pets.jpg`      | Gestionar mis mascotas  |
| `lost.jpg`      | Mascotas perdidas       |
| `campaigns.jpg` | Mis campañas activas    |

Los que están ahora son placeholders de color plano. Reemplazarlos por fotos reales.

- Se recortan con `resizeMode="cover"` en un hueco casi cuadrado (~160 × 155 dp), así que
  conviene que el sujeto esté centrado.
- Tamaño recomendado: **600 × 600 px** o más, JPG.

Los `require` viven en `constants/home.ts`, junto con el color y el destino de cada tarjeta.
