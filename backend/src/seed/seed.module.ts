import { Injectable, Logger, Module, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from '../entities/rol.entity.js';
import { SujetoEstudio } from '../entities/sujeto-estudio.entity.js';

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

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.NODE_ENV === 'production' || process.env.SEED_DEMO === 'false') return;
    if ((await this.sujetos.count()) > 0) return;
    const rol = (await this.roles.find({ take: 1 }))[0] ?? (await this.roles.save(this.roles.create({ Profesor: 'Profesor', Alumno: 'Alumno' })));
    await this.sujetos.save(this.sujetos.create({
      id_rol: rol.id_Rol, Nombre: 'Sujeto de prueba', rut: '0-0', edad: 20, peso_kg: 70, genero: 'N/D', estatura_cm: 170, Password: 'sin-acceso',
    }));
    this.log.log('Sujeto de demostración creado (id_sujeto 1)');
  }
}

@Module({ imports: [TypeOrmModule.forFeature([Rol, SujetoEstudio])], providers: [SeedService] })
export class SeedModule {}
