import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Vinculacion } from './vinculacion.entity.js';

@Entity('Sensor')
export class Sensor {
  @PrimaryGeneratedColumn()
  id_sensor: number;

  @Column()
  Nombre_dispositivo: string;

  @Column()
  Estado: string;

  @Column()
  direccion_MAC: string;

  @Column()
  tipo: string;

  @OneToMany(() => Vinculacion, (vinc) => vinc.sensor)
  vinculaciones: Vinculacion[];
}