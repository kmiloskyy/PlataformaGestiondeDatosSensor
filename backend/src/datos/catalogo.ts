/**
 * CATÁLOGO DE DATOS DEL SENSOR — única fuente de verdad (decisión D-06).
 *
 * Para cada dato que se puede medir define: cómo se llama en el JSON del paquete, en qué columna de
 * `Muestreo_datos` se guarda cada campo y en qué unidad viene. La validación, el guardado, los gráficos y la
 * exportación leen de aquí; agregar un sensor nuevo = agregar una entrada en este archivo (+ sus columnas).
 */
import type { MuestreoDatos } from '../entities/muestreodatos.entity.js';

export const CLAVES = ['fc', 'acc', 'gyro', 'mag', 'ppg', 'ppi'] as const;
export type ClaveDato = (typeof CLAVES)[number];
export type ClaveMuestras = Exclude<ClaveDato, 'fc'>;

/** Valor de `tipo_dato` en la tabla: las muestras usan su clave; la FC genera filas 'fc' y 'rr'. */
export type TipoFila = ClaveDato | 'rr';

export type ColumnaMuestra = Exclude<
  keyof MuestreoDatos,
  'id_lectura' | 'id_vinculacion' | 'tipo_dato' | 'timestamp' | 'sensor_ns' | 'vinculacion'
>;

export interface CampoDef {
  /** nombre del campo dentro de cada muestra del paquete JSON */
  json: string;
  /** columna de Muestreo_datos donde se guarda */
  columna: ColumnaMuestra;
  obligatorio: boolean;
}

export interface DatoMuestras {
  clave: ClaveMuestras;
  nombre: string;
  /** nombre del arreglo en el paquete JSON */
  arreglo: string;
  unidad: string;
  campos: CampoDef[];
}

export const DATOS_MUESTRAS: Record<ClaveMuestras, DatoMuestras> = {
  acc: {
    clave: 'acc', nombre: 'Acelerómetro', arreglo: 'acelerometro', unidad: 'mG (1000 mG = 1 g)',
    campos: [
      { json: 'x', columna: 'acel_x', obligatorio: true },
      { json: 'y', columna: 'acel_y', obligatorio: true },
      { json: 'z', columna: 'acel_z', obligatorio: true },
    ],
  },
  gyro: {
    clave: 'gyro', nombre: 'Giroscopio', arreglo: 'giroscopio', unidad: 'grados/s',
    campos: [
      { json: 'x', columna: 'gyro_x', obligatorio: true },
      { json: 'y', columna: 'gyro_y', obligatorio: true },
      { json: 'z', columna: 'gyro_z', obligatorio: true },
    ],
  },
  mag: {
    clave: 'mag', nombre: 'Magnetómetro', arreglo: 'magnetometro',
    unidad: 'gauss (calibracion: -1 no disponible, 0 desconocida, 1 mala, 2 ok, 3 buena)',
    campos: [
      { json: 'x', columna: 'mag_x', obligatorio: true },
      { json: 'y', columna: 'mag_y', obligatorio: true },
      { json: 'z', columna: 'mag_z', obligatorio: true },
      { json: 'calibracion', columna: 'mag_calibracion', obligatorio: false },
    ],
  },
  ppg: {
    clave: 'ppg', nombre: 'PPG (óptico)', arreglo: 'ppg', unidad: 'cuentas ópticas del sensor',
    campos: [
      { json: 'ppg0', columna: 'ppg_raw', obligatorio: true },
      { json: 'ppg1', columna: 'ppg_1', obligatorio: true },
      { json: 'ppg2', columna: 'ppg_2', obligatorio: true },
      { json: 'ambiente', columna: 'ppg_ambiente', obligatorio: true },
    ],
  },
  ppi: {
    clave: 'ppi', nombre: 'PPI (pulso a pulso)', arreglo: 'ppi', unidad: 'ms entre pulsos',
    campos: [
      { json: 'pp_ms', columna: 'ppi_ms', obligatorio: true },
      { json: 'error_ms', columna: 'ppi_error_ms', obligatorio: true },
      { json: 'hr', columna: 'ppi_hr', obligatorio: false },
      { json: 'contacto_piel', columna: 'ppi_contacto_piel', obligatorio: false },
      { json: 'bloqueado', columna: 'ppi_bloqueado', obligatorio: false },
    ],
  },
};

export const NOMBRES: Record<ClaveDato, string> = {
  fc: 'Frecuencia cardíaca', acc: DATOS_MUESTRAS.acc.nombre, gyro: DATOS_MUESTRAS.gyro.nombre,
  mag: DATOS_MUESTRAS.mag.nombre, ppg: DATOS_MUESTRAS.ppg.nombre, ppi: DATOS_MUESTRAS.ppi.nombre,
};

export const esClave = (x: unknown): x is ClaveDato => typeof x === 'string' && (CLAVES as readonly string[]).includes(x);
