/**
 * Conexión del refugio con su cuenta de Mercado Pago (spec 027). Contrato completo en
 * `pethood-backend/docs/api-mercadopago.md`. El perfil de refugio viaja en `X-Ambito`.
 */
import { del, get, post } from './api';

export interface EstadoMercadoPago {
  /** `false` si el backend no tiene Mercado Pago configurado: la tarjeta no se muestra. */
  disponible: boolean;
  estado: 'NO_VINCULADA' | 'VINCULADA' | 'REVINCULAR';
  /** ISO 8601. */
  fechaVinculacion: string | null;
}

export function obtenerEstadoMercadoPago(): Promise<EstadoMercadoPago> {
  return get('/refugio/mercadopago');
}

/** La URL de autorización de Mercado Pago, para abrir en el navegador del teléfono. */
export function iniciarVinculacion(): Promise<{ url: string }> {
  return post('/refugio/mercadopago/vinculacion', {});
}

export function desvincularMercadoPago(): Promise<void> {
  return del('/refugio/mercadopago');
}
