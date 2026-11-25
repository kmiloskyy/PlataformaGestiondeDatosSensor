import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Repository } from 'typeorm';
import type { Rol } from '../entities/rol.entity.js';
import type { SujetoEstudio } from '../entities/sujeto-estudio.entity.js';
import { ConsultasController } from '../consultas/consultas.controller.js';
import { ConsultasService } from '../consultas/consultas.service.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService, hashClave } from './auth.service.js';

const usuarios = [
  { id_sujeto: 1, Nombre: 'Profe', correo: 'profe@polar.cl', Password: hashClave('clave-profe'), rol: { tipo: 'profesor' } },
  { id_sujeto: 2, Nombre: 'Ana', correo: 'ana@polar.cl', Password: hashClave('clave-ana'), rol: { tipo: 'alumno' } },
  { id_sujeto: 3, Nombre: 'Beto', correo: 'beto@polar.cl', Password: hashClave('clave-beto'), rol: { tipo: 'alumno' } },
];
const repoSujetos = {
  findOne: vi.fn(async ({ where }: { where: Partial<SujetoEstudio> }) =>
    usuarios.find((u) => (where.correo ? u.correo === where.correo : u.id_sujeto === where.id_sujeto)) ?? null),
};
const auth = new AuthService(repoSujetos as unknown as Repository<SujetoEstudio>, {} as Repository<Rol>);
const guard = new AuthGuard(auth, new Reflector());

async function tokenDe(correo: string, clave: string) {
  return `Bearer ${(await auth.login(correo, clave)).token}`;
}

function contexto(authorization: string | undefined, handler: object) {
  const req: { headers: { authorization?: string }; usuario?: unknown } = { headers: { authorization } };
  const ctx = { switchToHttp: () => ({ getRequest: () => req }), getHandler: () => handler, getClass: () => ConsultasController } as unknown as ExecutionContext;
  return { ctx, req };
}
const proto = ConsultasController.prototype;

describe('roles', () => {
  it('login devuelve el rol y rechaza claves malas', async () => {
    expect((await auth.login('ana@polar.cl', 'clave-ana')).usuario.rol).toBe('alumno');
    await expect(auth.login('ana@polar.cl', 'otra')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('sin token o con token falso no pasa', async () => {
    await expect(guard.canActivate(contexto(undefined, proto.sesiones).ctx)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(guard.canActivate(contexto('Bearer abc.def', proto.sesiones).ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('el alumno entra a sus sesiones pero no a las rutas del profesor', async () => {
    const t = await tokenDe('ana@polar.cl', 'clave-ana');
    expect(await guard.canActivate(contexto(t, proto.sesiones).ctx)).toBe(true);
    for (const ruta of [proto.sujetos, proto.sensores, proto.ultimo, proto.lecturasActivas]) {
      await expect(guard.canActivate(contexto(t, ruta).ctx)).rejects.toBeInstanceOf(ForbiddenException);
    }
  });

  it('el profesor entra a todo', async () => {
    const t = await tokenDe('profe@polar.cl', 'clave-profe');
    for (const ruta of [proto.sesiones, proto.sujetos, proto.sensores, proto.ultimo, proto.lecturasActivas]) {
      expect(await guard.canActivate(contexto(t, ruta).ctx)).toBe(true);
    }
  });
});

describe('datos propios', () => {
  const sesiones = [{ id_sesion: 10, id_sujeto: 2, sujeto: { Nombre: 'Ana' }, vinculaciones: [] }, { id_sesion: 11, id_sujeto: 3, sujeto: { Nombre: 'Beto' }, vinculaciones: [] }];
  const repoSesiones = {
    find: vi.fn(async ({ where }: { where: { id_sujeto?: number } }) => sesiones.filter((s) => where.id_sujeto == null || s.id_sujeto === where.id_sujeto)),
    findOne: vi.fn(async ({ where }: { where: { id_sesion: number } }) => sesiones.find((s) => s.id_sesion === where.id_sesion) ?? null),
  };
  const ds = { query: vi.fn().mockResolvedValue([]) };
  const servicio = new ConsultasService(repoSesiones as never, {} as never, {} as never, ds as never, {} as never);
  const ana = { id_sujeto: 2, Nombre: 'Ana', correo: null, rol: 'alumno' as const };
  const profe = { id_sujeto: 1, Nombre: 'Profe', correo: null, rol: 'profesor' as const };

  it('el alumno lista solo sus sesiones; el profesor todas', async () => {
    expect((await servicio.listarSesiones(ana)).map((s) => s.id_sesion)).toEqual([10]);
    expect((await servicio.listarSesiones(profe)).map((s) => s.id_sesion)).toEqual([10, 11]);
  });

  it('el alumno no puede abrir, graficar ni descargar la sesión de otro', async () => {
    await expect(servicio.exportarSesion(11, ana)).rejects.toBeInstanceOf(NotFoundException);
    await expect(servicio.series(11, ana)).rejects.toBeInstanceOf(NotFoundException);
    await expect(servicio.csv(11, 'fc', ana)).rejects.toBeInstanceOf(NotFoundException);
  });
});
