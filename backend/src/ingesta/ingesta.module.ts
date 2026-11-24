import { Module } from '@nestjs/common';
import { MedicionModule } from '../medicion/medicion.module.js';
import { IngestaController } from './ingesta.controller.js';
import { IngestaService } from './ingesta.service.js';

@Module({
  imports: [MedicionModule],
  controllers: [IngestaController],
  providers: [IngestaService],
})
export class IngestaModule {}
