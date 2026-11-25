import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { MedicionService } from './medicion.service.js';

@Controller()
export class MedicionController {
  constructor(private readonly medicion: MedicionService) {}

  /** Con MAC, cada conexión del puente recibe solamente su propia sesión. */
  @Get('medicion')
  estado(@Query('puente') puente?: string, @Query('direccion_mac') mac?: string, @Query('dispositivo') dispositivo?: string) {
    return puente ? this.medicion.estadoParaPuente(mac, dispositivo) : this.medicion.estado();
  }

  /** Inicia un conjunto de asignaciones o finaliza todas las sesiones activas. */
  @Post('medicion')
  async cambiar(@Body() body: Record<string, unknown>) {
    if (body?.midiendo === false) return this.medicion.detener();
    return this.medicion.iniciar(body);
  }

  @Post('puente')
  puente(@Body() body: Parameters<MedicionService['registrarPuente']>[0]) {
    return this.medicion.registrarPuente(body ?? {});
  }
}
