import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Vinculacion } from './vinculacion.entity';

@Entity('Muestreo_datos')
export class MuestreoDatos {
  @PrimaryGeneratedColumn()
  id_lectura: number;

  @Column()
  id_vinculacion: number;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column('float')
  acel_x: number;

  @Column('float')
  acel_y: number;

  @Column('float')
  acel_z: number;

  @Column('float')
  ppg_raw: number;

  @Column('float')
  frecuencia_cardiaca: number;

  @Column('float')
  intervalo_rr: number;

  @ManyToOne(() => Vinculacion, (vinculacion) => vinculacion.muestreos)
  @JoinColumn({ name: 'id_vinculacion' })
  vinculacion: Vinculacion;
}