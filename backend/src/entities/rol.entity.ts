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

  /** Lo que realmente decide los permisos. Cualquier valor distinto de 'profesor' se trata como alumno. */
  @Column({ type: 'varchar', default: 'alumno' })
  tipo: string;

  @OneToMany(() => SujetoEstudio, (sujeto) => sujeto.rol)
  sujetos: SujetoEstudio[];
}