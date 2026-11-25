import { Body, Controller, Get, Headers, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { AuthService } from '../auth/auth.service.js';
import { Autenticado } from '../auth/auth.types.js';
import { MedicionService } from './medicion.service.js';

@Controller()
export class MedicionController {
  constructor(private readonly medicion: MedicionService, private readonly auth: AuthService) {}

  /**
   * Con ?puente=1 lo consulta el puente C# (sin sesión de usuario; con MAC, cada conexión recibe solamente su propia sesión).
   * Sin ?puente es la consulta de la web: solo el profesor.
   */
  @Get('medicion')
  async estado(@Headers('authorization') authorization?: string, @Query('puente') puente?: string, @Query('direccion_mac') mac?: string, @Query('dispositivo') dispositivo?: string) {
    if (puente) return this.medicion.estadoParaPuente(mac, dispositivo);
    await this.auth.exigir(authorization, 'profesor');
    return this.medicion.estado();
  }

  /** Inicia un conjunto de asignaciones o finaliza todas las sesiones activas: solo el profesor. */
  @Post('medicion')
  @UseGuards(AuthGuard)
  @Autenticado('profesor')
  async cambiar(@Body() body: Record<string, unknown>) {
    if (body?.midiendo === false) return this.medicion.detener();
    return this.medicion.iniciar(body);
  }

  /** Lo llama el puente C#, no un usuario. */
  @Post('puente')
  puente(@Body() body: Parameters<MedicionService['registrarPuente']>[0]) {
    return this.medicion.registrarPuente(body ?? {});
  }
}
