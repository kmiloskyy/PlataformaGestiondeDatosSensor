import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { IngestaService } from './ingesta.service.js';

@Controller()
export class IngestaController {
  constructor(private readonly ingesta: IngestaService) {}

  /**
   * Recibe un paquete crudo del puente (aprox. uno por segundo con todo lo que llegó del sensor).
   * 201 = guardado · 202 = ignorado porque la sesión ya no está activa · 400 = paquete inválido.
   */
  @Post('telemetria')
  @HttpCode(201)
  async recibir(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const r = await this.ingesta.guardar(body);
    if (r.ignorado) {
      res.status(202);
      return { ok: true, ignorado: 'la sesión no está activa (medición detenida)' };
    }
    return { ok: true, id_sesion: r.id_sesion, filas: r.filas };
  }
}
