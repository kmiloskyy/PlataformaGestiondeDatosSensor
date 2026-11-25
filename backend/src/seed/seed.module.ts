import { Injectable, Logger, Module, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from '../entities/rol.entity.js';
import { SujetoEstudio } from '../entities/sujeto-estudio.entity.js';
import { hashClave } from '../auth/auth.service.js';

const CORREO_PROFESOR = 'demo@polar.cl';
const CORREO_ALUMNO = 'alumno@polar.cl';
const CLAVE_DEMO = 'polar1234';

/**
 * Datos de demostración: una base vacía no tiene sujetos de estudio y sin sujeto no se puede iniciar una sesión.
 * Solo corre si no hay ningún sujeto y no estamos en producción (se puede apagar con SEED_DEMO=false).
 * La contraseña es un texto fijo que no sirve para nada: este sujeto es solo para probar el flujo del sensor.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly log = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Rol) private readonly roles: Repository<Rol>,
    @InjectRepository(SujetoEstudio) private readonly sujetos: Repository<SujetoEstudio>,
  ) {}

  private async rolDe(tipo: 'profesor' | 'alumno'): Promise<Rol> {
    return (await this.roles.findOneBy({ tipo })) ?? this.roles.save(this.roles.create({ Profesor: 'Profesor', Alumno: 'Alumno', tipo }));
  }

  private async cuenta(correo: string, Nombre: string, rut: string, tipo: 'profesor' | 'alumno'): Promise<void> {
    const rol = await this.rolDe(tipo);
    const existente = await this.sujetos.findOneBy({ correo });
    if (existente) {
      if (existente.id_rol !== rol.id_Rol) await this.sujetos.update({ id_sujeto: existente.id_sujeto }, { id_rol: rol.id_Rol });
      return;
    }
    await this.sujetos.save(this.sujetos.create({
      id_rol: rol.id_Rol, Nombre, rut, edad: 30, peso_kg: 70, genero: 'N/D', estatura_cm: 170, correo, Password: hashClave(CLAVE_DEMO),
    }));
    this.log.log(`Cuenta de demostración (${tipo}): ${correo} / ${CLAVE_DEMO}`);
  }

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.NODE_ENV === 'production' || process.env.SEED_DEMO === 'false') return;
    if ((await this.sujetos.count()) === 0) {
      const alumno = await this.rolDe('alumno');
      await this.sujetos.save(this.sujetos.create({
        id_rol: alumno.id_Rol, Nombre: 'Sujeto de prueba', rut: '0-0', edad: 20, peso_kg: 70, genero: 'N/D', estatura_cm: 170, Password: 'sin-acceso', correo: null,
      }));
      this.log.log('Sujeto de demostración creado (id_sujeto 1)');
    }
    await this.cuenta(CORREO_PROFESOR, 'Profesor demo', '1-9', 'profesor');
    await this.cuenta(CORREO_ALUMNO, 'Alumno demo', '2-7', 'alumno');
  }
}
@Module({ imports: [TypeOrmModule.forFeature([Rol, SujetoEstudio])], providers: [SeedService] })
export class SeedModule {}
