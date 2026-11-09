/**
 * Validación de lo que entra a la API. Funciones puras (sin Nest ni base de datos) para poder probarlas solas.
 * Devuelven la lista de errores en español; lista vacía = válido.
 */
import { CLAVES, DATOS_MUESTRAS, esClave, type ClaveDato } from './catalogo.js';

export const MAX_MUESTRAS_POR_ARREGLO = 4000;

const esNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const esFechaIso = (x: unknown): boolean => typeof x === 'string' && !Number.isNaN(Date.parse(x));
const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Paquete que envía el puente cada segundo. Todo viene en bruto: aquí NO hay promedios ni estimaciones. */
export interface Paquete {
  id_sesion: number;
  dispositivo: string;
  direccion_mac?: string | null;
  timestamp: string;
  frecuencia_cardiaca?: number | null;
  rr_ms?: number[] | null;
  fc_crudo?: string | null;
  [arreglo: string]: unknown;
}

export function validarPaquete(b: unknown): string[] {
  if (!esObjeto(b)) return ['cuerpo vacío o no es JSON'];
  const e: string[] = [];
  if (!Number.isInteger(b.id_sesion)) e.push('id_sesion requerido (entero)');
  if (typeof b.dispositivo !== 'string' || !b.dispositivo.trim()) e.push('dispositivo requerido (string)');
  if (b.direccion_mac != null && typeof b.direccion_mac !== 'string') e.push('direccion_mac debe ser string');
  if (!esFechaIso(b.timestamp)) e.push('timestamp requerido (ISO 8601)');
  const fc = b.frecuencia_cardiaca;
  // 0 = el sensor informa que no tiene lectura (sin contacto / midiendo otra cosa): es un dato crudo válido y se guarda tal cual
  if (fc != null && (!esNum(fc) || (fc !== 0 && (fc < 20 || fc > 250)))) e.push('frecuencia_cardiaca debe ser 0 (sin lectura) o un número entre 20 y 250');
  if (b.rr_ms != null && !(Array.isArray(b.rr_ms) && b.rr_ms.every(esNum))) e.push('rr_ms debe ser un arreglo de números (ms)');
  if (b.fc_crudo != null && !(typeof b.fc_crudo === 'string' && /^[0-9a-fA-F]{0,64}$/.test(b.fc_crudo))) e.push('fc_crudo debe ser hexadecimal');
  for (const def of Object.values(DATOS_MUESTRAS)) {
    const arr = b[def.arreglo];
    if (arr == null) continue;
    if (!Array.isArray(arr)) { e.push(`${def.arreglo} debe ser un arreglo`); continue; }
    if (arr.length > MAX_MUESTRAS_POR_ARREGLO) { e.push(`${def.arreglo}: máximo ${MAX_MUESTRAS_POR_ARREGLO} muestras por envío`); continue; }
    const oblig = def.campos.filter((c) => c.obligatorio).map((c) => c.json);
    const ok = arr.every((m) => esObjeto(m) && esFechaIso(m.timestamp) && oblig.every((c) => esNum(m[c])));
    if (!ok) e.push(`cada muestra de ${def.arreglo} necesita timestamp (ISO) y ${oblig.join(', ')} numéricos`);
  }
  return e;
}

export interface InicioSesion { id_sujeto: number; datos: ClaveDato[]; nombre_sesion?: string }

export function validarInicio(b: unknown): { errores: string[]; valor?: InicioSesion } {
  if (!esObjeto(b)) return { errores: ['cuerpo vacío o no es JSON'] };
  const errores: string[] = [];
  if (!Number.isInteger(b.id_sujeto)) errores.push('id_sujeto requerido (entero)');
  const datos = Array.isArray(b.datos) ? [...new Set(b.datos)] : [];
  if (!datos.length) errores.push('elige al menos un dato para medir (datos)');
  if (!datos.every(esClave)) errores.push('datos válidos: ' + CLAVES.join(', '));
  if (b.nombre_sesion != null && (typeof b.nombre_sesion !== 'string' || b.nombre_sesion.length > 120)) errores.push('nombre_sesion debe ser texto de hasta 120 caracteres');
  if (errores.length) return { errores };
  return {
    errores,
    valor: { id_sujeto: b.id_sujeto as number, datos: CLAVES.filter((c) => datos.includes(c)), nombre_sesion: (b.nombre_sesion as string | undefined)?.trim() || undefined },
  };
}
