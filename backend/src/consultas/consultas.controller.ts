import { Controller, Get, Param, ParseIntPipe, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ConsultasService } from './consultas.service.js';

@Controller()
export class ConsultasController {
  constructor(private readonly consultas: ConsultasService) {}

  @Get('sujetos')
  sujetos() { return this.consultas.listarSujetos(); }

  @Get('sesiones')
  sesiones() { return this.consultas.listarSesiones(); }

  /** JSON completo de la sesión. Con ?descargar=1 el navegador lo baja como archivo. */
  @Get('sesiones/:id')
  async sesion(@Param('id', ParseIntPipe) id: number, @Query('descargar') descargar: string | undefined, @Res({ passthrough: true }) res: Response) {
    const s = await this.consultas.exportarSesion(id);
    if (descargar) res.attachment(`sesion-${id}.json`);
    return s;
  }

  @Get('sesiones/:id/series')
  series(@Param('id', ParseIntPipe) id: number, @Query('desde') desde?: string, @Query('hasta') hasta?: string, @Query('max') max?: string) {
    return this.consultas.series(id, desde, hasta, max);
  }

  @Get('sesiones/:id/csv/:dato')
  async csv(@Param('id', ParseIntPipe) id: number, @Param('dato') dato: string, @Res() res: Response) {
    const { nombre, texto } = await this.consultas.csv(id, dato);
    res.attachment(nombre).type('text/csv').send(texto);
  }

  @Get('ultimo')
  ultimo() { return this.consultas.ultimo(); }
}
