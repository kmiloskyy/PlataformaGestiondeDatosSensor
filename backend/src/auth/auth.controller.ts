import { BadRequestException, Body, Controller, Get, Headers, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { Autenticado } from './auth.types.js';

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('auth/login')
  @HttpCode(200)
  login(@Body() cuerpo: { correo?: unknown; clave?: unknown }) {
    if (typeof cuerpo?.correo !== 'string' || typeof cuerpo?.clave !== 'string' || !cuerpo.correo.trim() || !cuerpo.clave) {
      throw new BadRequestException('Debes indicar correo y clave');
    }
    return this.auth.login(cuerpo.correo, cuerpo.clave);
  }

  @Get('auth/me')
  me(@Headers('authorization') authorization?: string) {
    return this.auth.usuarioDe(authorization);
  }

  /** Alta de cuentas: solo el profesor. */
  @Post('usuarios')
  @UseGuards(AuthGuard)
  @Autenticado('profesor')
  crear(@Body() cuerpo: Record<string, unknown>) {
    return this.auth.crearUsuario(cuerpo ?? {});
  }
}
