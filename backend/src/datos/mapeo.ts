/**
 * Traduce un paquete del puente a filas de `Muestreo_datos`. Función pura.
 * Regla de oro (decisión D-02): aquí solo se reordena y se nombra lo que dijo el sensor; no se calcula nada.
 */
import { DATOS_MUESTRAS } from './catalogo.js';
import type { Paquete } from './validacion.js';
import type { MuestreoDatos } from '../entities/muestreodatos.entity.js';

export type FilaNueva = Partial<Omit<MuestreoDatos, 'id_lectura' | 'vinculacion'>> & Pick<MuestreoDatos, 'id_vinculacion' | 'tipo_dato' | 'timestamp'>;

export function paqueteAFilas(p: Paquete, id_vinculacion: number): FilaNueva[] {
  const filas: FilaNueva[] = [];
  const tPaquete = new Date(p.timestamp);

  if (p.frecuencia_cardiaca != null) {
    filas.push({ id_vinculacion, tipo_dato: 'fc', timestamp: tPaquete, frecuencia_cardiaca: p.frecuencia_cardiaca, fc_crudo: p.fc_crudo ?? null });
  }
  for (const rr of p.rr_ms ?? []) {
    filas.push({ id_vinculacion, tipo_dato: 'rr', timestamp: tPaquete, intervalo_rr: rr });
  }

  for (const def of Object.values(DATOS_MUESTRAS)) {
    const muestras = p[def.arreglo];
    if (!Array.isArray(muestras)) continue;
    for (const m of muestras as Record<string, unknown>[]) {
      const fila: FilaNueva = { id_vinculacion, tipo_dato: def.clave, timestamp: new Date(m.timestamp as string),
        sensor_ns: m.sensor_ns != null ? String(m.sensor_ns) : null };
      for (const c of def.campos) {
        const v = m[c.json];
        (fila as Record<string, unknown>)[c.columna] = typeof v === 'number' && Number.isFinite(v) ? v : null;
      }
      filas.push(fila);
    }
  }
  return filas;
}
