import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sensor } from '../entities/sensor.entity.js';
import { Vinculacion } from '../entities/vinculacion.entity.js';
import { MedicionModule } from '../medicion/medicion.module.js';
import { IngestaController } from './ingesta.controller.js';
import { IngestaService } from './ingesta.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Sensor, Vinculacion]), MedicionModule],
  controllers: [IngestaController],
  providers: [IngestaService],
})
export class IngestaModule {}
