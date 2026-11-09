import { describe, expect, it } from 'vitest';
import { validarInicio, validarPaquete } from './validacion.js';
import { paqueteAFilas } from './mapeo.js';
import { armarLecturas } from './exportacion.js';

const T0 = '2026-11-09T19:00:00.000Z';
const base = { id_sesion: 1, dispositivo: 'Polar Sense', timestamp: T0 };

describe('validarPaquete', () => {
  it('acepta un paquete completo con todos los sensores', () => {
    const p = { ...base, frecuencia_cardiaca: 90, rr_ms: [650], fc_crudo: '005A',
      acelerometro: [{ timestamp: T0, x: 1, y: 2, z: 3 }], giroscopio: [{ timestamp: T0, x: 1, y: 2, z: 3 }],
      magnetometro: [{ timestamp: T0, x: 1, y: 2, z: 3, calibracion: 2 }], ppg: [{ timestamp: T0, ppg0: 1, ppg1: 2, ppg2: 3, ambiente: 4 }],
      ppi: [{ timestamp: T0, pp_ms: 640, error_ms: 30 }] };
    expect(validarPaquete(p)).toEqual([]);
  });
  it('acepta un paquete sin frecuencia cardíaca (solo otros sensores)', () => {
    expect(validarPaquete({ ...base, acelerometro: [{ timestamp: T0, x: 1, y: 2, z: 3 }] })).toEqual([]);
  });
  it('rechaza cuerpo vacío, sesión ausente y fechas inválidas', () => {
    expect(validarPaquete(null)).not.toEqual([]);
    expect(validarPaquete({ dispositivo: 'x', timestamp: T0 })).toContain('id_sesion requerido (entero)');
    expect(validarPaquete({ ...base, timestamp: 'ayer' })).toContain('timestamp requerido (ISO 8601)');
  });
  it('rechaza FC fuera de rango y muestras incompletas', () => {
    expect(validarPaquete({ ...base, frecuencia_cardiaca: 300 })).not.toEqual([]);
    expect(validarPaquete({ ...base, frecuencia_cardiaca: 10 })).not.toEqual([]);
    expect(validarPaquete({ ...base, frecuencia_cardiaca: 0 })).toEqual([]); // 0 = sensor sin lectura (dato crudo válido)
    expect(validarPaquete({ ...base, acelerometro: [{ timestamp: T0, x: 1, y: 2 }] })).not.toEqual([]);
    expect(validarPaquete({ ...base, acelerometro: 'no' })).not.toEqual([]);
  });
  it('limita el tamaño de cada arreglo', () => {
    const muchas = Array.from({ length: 4001 }, () => ({ timestamp: T0, x: 0, y: 0, z: 0 }));
    expect(validarPaquete({ ...base, acelerometro: muchas })).not.toEqual([]);
  });
});

describe('validarInicio', () => {
  it('ordena y deduplica los datos elegidos', () => {
    const r = validarInicio({ id_sujeto: 1, datos: ['ppg', 'fc', 'fc', 'acc'] });
    expect(r.valor?.datos).toEqual(['fc', 'acc', 'ppg']);
  });
  it('exige sujeto y al menos un dato válido', () => {
    expect(validarInicio({ datos: ['fc'] }).errores).not.toEqual([]);
    expect(validarInicio({ id_sujeto: 1, datos: [] }).errores).not.toEqual([]);
    expect(validarInicio({ id_sujeto: 1, datos: ['temperatura'] }).errores).not.toEqual([]);
  });
});

describe('paqueteAFilas (guardar en bruto, sin calcular nada)', () => {
  it('genera una fila por muestra, una de FC y una por cada RR', () => {
    const p = { ...base, frecuencia_cardiaca: 90, rr_ms: [650, 660], fc_crudo: '005A',
      acelerometro: [{ timestamp: T0, x: 10, y: 20, z: 30, sensor_ns: '123' }, { timestamp: T0, x: 11, y: 21, z: 31 }],
      ppi: [{ timestamp: T0, pp_ms: 640, error_ms: 30, hr: 0, contacto_piel: 1, bloqueado: 0 }] };
    const filas = paqueteAFilas(p, 7);
    expect(filas.map((f) => f.tipo_dato)).toEqual(['fc', 'rr', 'rr', 'acc', 'acc', 'ppi']);
    expect(filas.every((f) => f.id_vinculacion === 7)).toBe(true);
    expect(filas[0]).toMatchObject({ frecuencia_cardiaca: 90, fc_crudo: '005A' });
    expect(filas[3]).toMatchObject({ acel_x: 10, acel_y: 20, acel_z: 30, sensor_ns: '123' });
    expect(filas[5]).toMatchObject({ ppi_ms: 640, ppi_error_ms: 30, ppi_contacto_piel: 1, ppi_bloqueado: 0 });
  });
  it('no inventa valores: los campos opcionales ausentes quedan en null', () => {
    const f = paqueteAFilas({ ...base, magnetometro: [{ timestamp: T0, x: 1, y: 2, z: 3 }] }, 1)[0];
    expect(f.mag_calibracion).toBeNull();
  });
});

describe('armarLecturas (JSON de la sesión)', () => {
  it('agrupa por segundo y conserva cada muestra X/Y/Z sin promediar', () => {
    const filas = paqueteAFilas({ ...base, frecuencia_cardiaca: 90, rr_ms: [650],
      acelerometro: [{ timestamp: '2026-11-09T19:00:00.100Z', x: 1, y: 2, z: 3 }, { timestamp: '2026-11-09T19:00:00.119Z', x: 4, y: 5, z: 6 },
                     { timestamp: '2026-11-09T19:00:01.050Z', x: 7, y: 8, z: 9 }] }, 1)
      .map((f) => ({ ...f, sensor_ns: f.sensor_ns ?? null }));
    const l = armarLecturas(filas, ['fc', 'acc']);
    expect(l).toHaveLength(2);
    expect(l[0]).toMatchObject({ timestamp: T0, frecuencia_cardiaca: 90, rr_ms: [650] });
    expect(l[0].acelerometro).toEqual([{ timestamp: '2026-11-09T19:00:00.100Z', x: 1, y: 2, z: 3 }, { timestamp: '2026-11-09T19:00:00.119Z', x: 4, y: 5, z: 6 }]);
    expect(l[1].acelerometro).toHaveLength(1);
  });
  it('solo incluye los datos que se eligieron al iniciar la sesión', () => {
    const filas = paqueteAFilas({ ...base, acelerometro: [{ timestamp: T0, x: 1, y: 2, z: 3 }] }, 1);
    const l = armarLecturas(filas, ['acc']);
    expect(Object.keys(l[0])).toEqual(['timestamp', 'acelerometro']);
  });
});
