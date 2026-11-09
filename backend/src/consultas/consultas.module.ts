import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MuestreoDatos } from '../entities/muestreodatos.entity.js';
import { SesionGrabacion } from '../entities/sesiongrabacion.entity.js';
import { SujetoEstudio } from '../entities/sujeto-estudio.entity.js';
import { MedicionModule } from '../medicion/medicion.module.js';
import { ConsultasController } from './consultas.controller.js';
import { ConsultasService } from './consultas.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([MuestreoDatos, SesionGrabacion, SujetoEstudio]), MedicionModule],
  controllers: [ConsultasController],
  providers: [ConsultasService],
})
export class ConsultasModule {}
