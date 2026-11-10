import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Rol } from './rol.entity.js';
import { SesionGrabacion } from './sesiongrabacion.entity';

@Entity('Sujeto_estudio')
export class SujetoEstudio {
  @PrimaryGeneratedColumn()
  id_sujeto: number;

  @Column()
  id_rol: number;

  @Column()
  Nombre: string;

  @Column()
  rut: string;

  @Column('int')
  edad: number;

  @Column('float')
  peso_kg: number;

  @Column()
  genero: string;

  @Column('float')
  estatura_cm: number;

  @Column()
  Password: string;

  @ManyToOne(() => Rol, (rol) => rol.sujetos)
  @JoinColumn({ name: 'id_rol' })
  rol: Rol;

  @OneToMany(() => SesionGrabacion, (sesion) => sesion.sujeto)
  sesiones: SesionGrabacion[];
}