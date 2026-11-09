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

  @Column({ type: 'timestamptz' })
  fecha_inicio: Date;

  /** 'en_curso' | 'finalizada' */
  @Column()
  estado_sesion: string;

  @Column({ type: 'timestamptz', nullable: true })
  fecha_fin: Date | null;

  /** Qué datos se eligieron medir al iniciar la sesión: ['fc','acc','gyro','mag','ppg','ppi'] */
  @Column({ type: 'jsonb', nullable: true })
  datos_seleccionados: string[] | null;

  @ManyToOne(() => SujetoEstudio, (sujeto) => sujeto.sesiones)
  @JoinColumn({ name: 'id_sujeto' })
  sujeto: SujetoEstudio;

  @OneToMany(() => Vinculacion, (vinc) => vinc.sesion)
  vinculaciones: Vinculacion[];
}