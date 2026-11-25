import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

export type TipoRol = 'profesor' | 'alumno';

/** Usuario autenticado de la petición actual (lo deja el guard). */
export interface UsuarioActual {
  id_sujeto: number;
  Nombre: string;
  correo: string | null;
  rol: TipoRol;
}

export const esProfesor = (u: UsuarioActual) => u.rol === 'profesor';

export const ROLES_KEY = 'roles';
/** Exige sesión iniciada y, si se indican roles, que el usuario tenga uno de ellos. */
export const Autenticado = (...roles: TipoRol[]) => SetMetadata(ROLES_KEY, roles);

export const Usuario = createParamDecorator((_: unknown, ctx: ExecutionContext): UsuarioActual =>
  ctx.switchToHttp().getRequest<{ usuario: UsuarioActual }>().usuario);
