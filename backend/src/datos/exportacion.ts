/**
 * Armado del JSON de una sesión a partir de las filas guardadas. Función pura.
 * Formato: una "lectura" por segundo de reloj; cada lectura trae la FC de ese segundo y, desglosadas, TODAS las
 * muestras crudas (X/Y/Z, etc.) de los datos elegidos. Nada está promediado.
 */
import { DATOS_MUESTRAS, type ClaveDato } from './catalogo.js';
import type { MuestreoDatos } from '../entities/muestreodatos.entity.js';

export type FilaLeida = Pick<MuestreoDatos, 'tipo_dato' | 'timestamp' | 'sensor_ns'> & Partial<MuestreoDatos>;

export interface Lectura {
  timestamp: string;
  frecuencia_cardiaca?: number | null;
  fc_crudo?: string | null;
  rr_ms?: number[];
  [arreglo: string]: unknown;
}

export function armarLecturas(filas: FilaLeida[], datos: ClaveDato[]): Lectura[] {
  const porSegundo = new Map<number, Lectura>();
  const lectura = (t: Date): Lectura => {
    const seg = Math.floor(t.getTime() / 1000) * 1000;
    let l = porSegundo.get(seg);
    if (!l) {
      l = { timestamp: new Date(seg).toISOString() };
      if (datos.includes('fc')) { l.frecuencia_cardiaca = null; l.rr_ms = []; }
      for (const k of datos) if (k !== 'fc') l[DATOS_MUESTRAS[k].arreglo] = [];
      porSegundo.set(seg, l);
    }
    return l;
  };

  for (const f of filas) {
    const l = lectura(new Date(f.timestamp));
    if (f.tipo_dato === 'fc') { l.frecuencia_cardiaca = f.frecuencia_cardiaca ?? null; l.fc_crudo = f.fc_crudo ?? null; continue; }
    if (f.tipo_dato === 'rr') { if (f.intervalo_rr != null) (l.rr_ms ??= []).push(f.intervalo_rr); continue; }
    const def = DATOS_MUESTRAS[f.tipo_dato as keyof typeof DATOS_MUESTRAS];
    if (!def || !Array.isArray(l[def.arreglo])) continue;
    const m: Record<string, unknown> = { timestamp: new Date(f.timestamp).toISOString() };
    for (const c of def.campos) { const v = f[c.columna]; if (v != null) m[c.json] = v; }
    if (f.sensor_ns != null) m.sensor_ns = f.sensor_ns;
    (l[def.arreglo] as unknown[]).push(m);
  }
  return [...porSegundo.entries()].sort((a, b) => a[0] - b[0]).map(([, l]) => l);
}
