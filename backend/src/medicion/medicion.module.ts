import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SujetoEstudio } from '../entities/sujeto-estudio.entity.js';
import { AuthModule } from '../auth/auth.module.js';
import { MedicionController } from './medicion.controller.js';
import { MedicionService } from './medicion.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([SujetoEstudio]), AuthModule],
  controllers: [MedicionController],
  providers: [MedicionService],
  exports: [MedicionService],
})
export class MedicionModule {}
