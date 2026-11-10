import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { SujetoEstudio } from './sujeto-estudio.entity';

@Entity('Rol')
export class Rol {
  @PrimaryGeneratedColumn()
  id_Rol: number;

  @Column()
  Profesor: string;

  @Column()
  Alumno: string;

  @OneToMany(() => SujetoEstudio, (sujeto) => sujeto.rol)
  sujetos: SujetoEstudio[];
}