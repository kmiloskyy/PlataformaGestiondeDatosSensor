import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { SujetoEstudio } from './sujeto-estudio.entity.js';
import { Vinculacion } from './vinculacion.entity.js';

@Entity('Sesion_Grabacion')
export class SesionGrabacion {
  @PrimaryGeneratedColumn()
  id_sesion: number;

  @Column()
  id_sujeto: number;

  @Column()
  Nombre_sesion: string;

  @Column({ type: 'timestamp' })
  fecha_inicio: Date;

  @Column()
  estado_sesion: string;

  @Column({ type: 'timestamp', nullable: true })
  fecha_fin: Date;

  @ManyToOne(() => SujetoEstudio, (sujeto) => sujeto.sesiones)
  @JoinColumn({ name: 'id_sujeto' })
  sujeto: SujetoEstudio;

  @OneToMany(() => Vinculacion, (vinc) => vinc.sesion)
  vinculaciones: Vinculacion[];
}