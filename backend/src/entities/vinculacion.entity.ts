import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Sensor } from './sensor.entity';
import { SesionGrabacion } from './sesiongrabacion.entity';
import { MuestreoDatos } from './muestreodatos.entity';

@Entity('Vinculacion')
export class Vinculacion {
  @PrimaryGeneratedColumn()
  id_vinculacion: number;

  @Column()
  id_sensor: number;

  @Column()
  id_sesion: number;

  @Column({ type: 'timestamptz', nullable: true })
  Fecha_desvinculacion: Date | null;

  @Column({ type: 'timestamptz' })
  fecha_vinculación: Date;

  @ManyToOne(() => Sensor, (sensor) => sensor.vinculaciones)
  @JoinColumn({ name: 'id_sensor' })
  sensor: Sensor;

  @ManyToOne(() => SesionGrabacion, (sesion) => sesion.vinculaciones)
  @JoinColumn({ name: 'id_sesion' })
  sesion: SesionGrabacion;

  @OneToMany(() => MuestreoDatos, (muestreo) => muestreo.vinculacion)
  muestreos: MuestreoDatos[];
}