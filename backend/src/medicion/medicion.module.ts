import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SesionGrabacion } from '../entities/sesiongrabacion.entity.js';
import { SujetoEstudio } from '../entities/sujeto-estudio.entity.js';
import { MedicionController } from './medicion.controller.js';
import { MedicionService } from './medicion.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([SesionGrabacion, SujetoEstudio])],
  controllers: [MedicionController],
  providers: [MedicionService],
  exports: [MedicionService],
})
export class MedicionModule {}
