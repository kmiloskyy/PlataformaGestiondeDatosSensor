import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service.js';
import { ROLES_KEY, type TipoRol, type UsuarioActual } from './auth.types.js';

/** Valida el token "Authorization: Bearer ..." y revisa el rol pedido con @Autenticado(...). */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService, private readonly reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; usuario?: UsuarioActual }>();
    const usuario = await this.auth.usuarioDe(req.headers.authorization);
    const roles = this.reflector.getAllAndOverride<TipoRol[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]) ?? [];
    if (roles.length && !roles.includes(usuario.rol)) throw new ForbiddenException('No tienes permiso para esta acción');
    req.usuario = usuario;
    return true;
  }
}
