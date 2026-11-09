import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { MedicionService } from './medicion.service.js';

@Controller()
export class MedicionController {
  constructor(private readonly medicion: MedicionService) {}

  /** Estado actual. El puente lo consulta con ?puente=1 (así sabemos que está vivo). */
  @Get('medicion')
  estado(@Query('puente') puente?: string) {
    return this.medicion.estado(!!puente);
  }

  /** Iniciar: { id_sujeto, datos: ['fc','acc',...], nombre_sesion? }  ·  Detener: { midiendo: false } */
  @Post('medicion')
  async cambiar(@Body() body: Record<string, unknown>) {
    if (body?.midiendo === false) return this.medicion.detener();
    return this.medicion.iniciar(body);
  }

  @Post('puente')
  puente(@Body() body: { activos?: unknown; errores?: unknown; dispositivo?: unknown }) {
    return this.medicion.registrarPuente(body ?? {});
  }
}
