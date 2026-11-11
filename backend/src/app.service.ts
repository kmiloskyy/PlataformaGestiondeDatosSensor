import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from './entities/rol.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

  async testDatabase() {
    const nuevoRol = this.rolRepository.create({
      Profesor: 'Docente Titular',
      Alumno: 'Estudiante Pregrado',
    });
    await this.rolRepository.save(nuevoRol);
    return await this.rolRepository.find();
  }
}
