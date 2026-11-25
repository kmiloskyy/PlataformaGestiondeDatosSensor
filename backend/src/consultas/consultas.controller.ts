import { Controller, Get, Param, ParseIntPipe, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard.js';
import { Autenticado, Usuario, type UsuarioActual } from '../auth/auth.types.js';
import { ConsultasService } from './consultas.service.js';

/**
 * Con sesión iniciada, el alumno solo ve sus propias sesiones (el servicio lo filtra);
 * el profesor ve todo. Inventario, sujetos y lecturas en vivo son solo del profesor.
 */
@Controller()
@UseGuards(AuthGuard)
@Autenticado()
export class ConsultasController {
  constructor(private readonly consultas: ConsultasService) {}

  @Get('sujetos')
  @Autenticado('profesor')
  sujetos() { return this.consultas.listarSujetos(); }

  @Get('sensores')
  @Autenticado('profesor')
  sensores() { return this.consultas.listarSensores(); }

  @Get('sesiones')
  sesiones(@Usuario() usuario: UsuarioActual) { return this.consultas.listarSesiones(usuario); }

  /** JSON completo de la sesión. Con ?descargar=1 el navegador lo baja como archivo. */
  @Get('sesiones/:id')
  async sesion(@Param('id', ParseIntPipe) id: number, @Query('descargar') descargar: string | undefined, @Res({ passthrough: true }) res: Response, @Usuario() usuario: UsuarioActual) {
    const s = await this.consultas.exportarSesion(id, usuario);
    if (descargar) res.attachment(`sesion-${id}.json`);
    return s;
  }

  @Get('sesiones/:id/series')
  series(@Param('id', ParseIntPipe) id: number, @Usuario() usuario: UsuarioActual, @Query('desde') desde?: string, @Query('hasta') hasta?: string, @Query('max') max?: string) {
    return this.consultas.series(id, usuario, desde, hasta, max);
  }

  @Get('sesiones/:id/csv/:dato')
  async csv(@Param('id', ParseIntPipe) id: number, @Param('dato') dato: string, @Res() res: Response, @Usuario() usuario: UsuarioActual) {
    const { nombre, texto } = await this.consultas.csv(id, dato, usuario);
    res.attachment(nombre).type('text/csv').send(texto);
  }

  @Get('ultimo')
  @Autenticado('profesor')
  ultimo(@Query('id_sesion', new ParseIntPipe({ optional: true })) id?: number) { return this.consultas.ultimo(id); }

  @Get('lecturas-activas')
  @Autenticado('profesor')
  lecturasActivas() { return this.consultas.lecturasActivas(); }
}
