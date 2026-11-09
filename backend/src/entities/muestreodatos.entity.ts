import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Vinculacion } from './vinculacion.entity';

/**
 * Una fila = UNA muestra cruda de UN tipo de dato del sensor (ver docs/DOCUMENTACION_SISTEMA.md, decisión D-05).
 *
 * Las columnas originales del equipo (acel_x/y/z, ppg_raw, frecuencia_cardiaca, intervalo_rr) se conservan con
 * el mismo nombre, pero ahora son opcionales: cada sensor entrega a su propia frecuencia (acelerómetro 52 Hz,
 * magnetómetro 100 Hz, frecuencia cardíaca 1 Hz...), así que una fila solo rellena las columnas de su tipo.
 * `tipo_dato` indica qué grupo de columnas es el válido.
 */
@Entity('Muestreo_datos')
@Index(['id_vinculacion', 'tipo_dato', 'timestamp'])
export class MuestreoDatos {
  @PrimaryGeneratedColumn()
  id_lectura: number;

  @Column()
  id_vinculacion: number;

  /** 'fc' | 'rr' | 'acc' | 'gyro' | 'mag' | 'ppg' | 'ppi' */
  @Column({ type: 'varchar', length: 8 })
  tipo_dato: string;

  /** Instante de la muestra (UTC). timestamptz para no depender de la zona horaria del servidor. */
  @Column({ type: 'timestamptz' })
  timestamp: Date;

  /** Reloj interno del sensor en nanosegundos desde 2000-01-01 (dato crudo; permite reconstruir el tiempo exacto). */
  @Column({ type: 'bigint', nullable: true })
  sensor_ns: string | null;

  // --- Acelerómetro (mG: 1000 mG = 1 g) ---
  @Column({ type: 'float', nullable: true })
  acel_x: number | null;

  @Column({ type: 'float', nullable: true })
  acel_y: number | null;

  @Column({ type: 'float', nullable: true })
  acel_z: number | null;

  // --- Giroscopio (grados/s) ---
  @Column({ type: 'float', nullable: true })
  gyro_x: number | null;

  @Column({ type: 'float', nullable: true })
  gyro_y: number | null;

  @Column({ type: 'float', nullable: true })
  gyro_z: number | null;

  // --- Magnetómetro (gauss) ---
  @Column({ type: 'float', nullable: true })
  mag_x: number | null;

  @Column({ type: 'float', nullable: true })
  mag_y: number | null;

  @Column({ type: 'float', nullable: true })
  mag_z: number | null;

  /** -1 no disponible, 0 desconocida, 1 mala, 2 ok, 3 buena */
  @Column({ type: 'int', nullable: true })
  mag_calibracion: number | null;

  // --- PPG óptico (cuentas del sensor): ppg_raw = canal 0 (nombre original del equipo) ---
  @Column({ type: 'float', nullable: true })
  ppg_raw: number | null;

  @Column({ type: 'float', nullable: true })
  ppg_1: number | null;

  @Column({ type: 'float', nullable: true })
  ppg_2: number | null;

  @Column({ type: 'float', nullable: true })
  ppg_ambiente: number | null;

  // --- Frecuencia cardíaca (servicio estándar de FC del sensor) ---
  @Column({ type: 'float', nullable: true })
  frecuencia_cardiaca: number | null;

  /** Bytes crudos (hex) del paquete de FC tal como llegó por Bluetooth. */
  @Column({ type: 'varchar', length: 64, nullable: true })
  fc_crudo: string | null;

  /** Intervalo RR (ms) informado en el paquete estándar de FC (una fila 'rr' por intervalo). */
  @Column({ type: 'float', nullable: true })
  intervalo_rr: number | null;

  // --- PPI: intervalo pulso a pulso calculado por el sensor ---
  @Column({ type: 'float', nullable: true })
  ppi_ms: number | null;

  @Column({ type: 'float', nullable: true })
  ppi_error_ms: number | null;

  @Column({ type: 'float', nullable: true })
  ppi_hr: number | null;

  /** 1 = el sensor indica contacto con la piel */
  @Column({ type: 'smallint', nullable: true })
  ppi_contacto_piel: number | null;

  /** 1 = el sensor marca la muestra como poco fiable (movimiento/artefacto) */
  @Column({ type: 'smallint', nullable: true })
  ppi_bloqueado: number | null;

  @ManyToOne(() => Vinculacion, (vinculacion) => vinculacion.muestreos)
  @JoinColumn({ name: 'id_vinculacion' })
  vinculacion: Vinculacion;
}
