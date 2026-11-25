import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { Repository } from 'typeorm';
import { Rol } from '../entities/rol.entity.js';
import { SujetoEstudio } from '../entities/sujeto-estudio.entity.js';
import type { TipoRol, UsuarioActual } from './auth.types.js';

const DURACION_TOKEN_MS = 8 * 60 * 60 * 1000; // 8 horas

export function hashClave(clave: string): string {
  const sal = randomBytes(16).toString('hex');
  return `${sal}:${scryptSync(clave, sal, 64).toString('hex')}`;
}

function claveCoincide(clave: string, guardada: string): boolean {
  const [sal, hash] = guardada.split(':');
  if (!sal || !hash) return false;
  const esperado = Buffer.from(hash, 'hex');
  const real = scryptSync(clave, sal, esperado.length);
  return esperado.length === real.length && timingSafeEqual(esperado, real);
}

/** Si no hay AUTH_SECRET se usa uno aleatorio por proceso: las sesiones se pierden al reiniciar el backend. */
const SECRETO = process.env.AUTH_SECRET ?? randomBytes(32).toString('hex');

const firmar = (payload: string) => createHmac('sha256', SECRETO).update(payload).digest('base64url');

const tipoDe = (rol?: Rol | null): TipoRol => (rol?.tipo === 'profesor' ? 'profesor' : 'alumno');

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(SujetoEstudio) private readonly sujetos: Repository<SujetoEstudio>,
    @InjectRepository(Rol) private readonly roles: Repository<Rol>,
  ) {}

  async login(correo: string, clave: string) {
    const usuario = await this.sujetos.findOne({ where: { correo: correo.trim().toLowerCase() }, relations: { rol: true } });
    // Mismo mensaje si el correo no existe o la clave está mal, para no revelar qué correos hay registrados.
    if (!usuario || !claveCoincide(clave, usuario.Password)) {
      throw new UnauthorizedException('Correo o clave incorrectos');
    }
    return { token: this.emitirToken(usuario.id_sujeto), usuario: this.publico(usuario) };
  }

  /** Usuario dueño del token. El rol se lee de la base en cada petición, así un cambio de rol aplica de inmediato. */
  async usuarioDe(authorization: string | undefined): Promise<UsuarioActual> {
    const id = this.verificarToken(authorization?.replace(/^Bearer\s+/i, ''));
    const usuario = id == null ? null : await this.sujetos.findOne({ where: { id_sujeto: id }, relations: { rol: true } });
    if (!usuario) throw new UnauthorizedException('Sesión inválida o expirada');
    return this.publico(usuario);
  }

  async exigir(authorization: string | undefined, ...roles: TipoRol[]): Promise<UsuarioActual> {
    const usuario = await this.usuarioDe(authorization);
    if (roles.length && !roles.includes(usuario.rol)) throw new ForbiddenException('No tienes permiso para esta acción');
    return usuario;
  }

  /** Crea una cuenta (la usa el profesor para dar de alta alumnos u otros profesores). */
  async crearUsuario(b: Record<string, unknown>) {
    const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
    const numero = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
    const correo = texto(b.correo).toLowerCase();
    const clave = typeof b.clave === 'string' ? b.clave : '';
    const tipo: TipoRol = b.rol === 'profesor' ? 'profesor' : 'alumno';
    const errores: string[] = [];
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) errores.push('correo inválido');
    if (clave.length < 8) errores.push('la clave debe tener al menos 8 caracteres');
    if (!texto(b.Nombre)) errores.push('falta el nombre');
    if (!texto(b.rut)) errores.push('falta el rut');
    const edad = numero(b.edad), peso_kg = numero(b.peso_kg), estatura_cm = numero(b.estatura_cm);
    if (edad == null || peso_kg == null || estatura_cm == null) errores.push('edad, peso_kg y estatura_cm deben ser números positivos');
    if (errores.length) throw new BadRequestException({ errores });
    if (await this.sujetos.existsBy({ correo })) throw new ConflictException({ errores: ['ya existe un usuario con ese correo'] });

    const rol = await this.rolDe(tipo);
    const nuevo = await this.sujetos.save(this.sujetos.create({
      id_rol: rol.id_Rol, Nombre: texto(b.Nombre), rut: texto(b.rut), edad: edad!, peso_kg: peso_kg!,
      genero: texto(b.genero) || 'N/D', estatura_cm: estatura_cm!, correo, Password: hashClave(clave),
    }));
    return { id_sujeto: nuevo.id_sujeto, Nombre: nuevo.Nombre, correo: nuevo.correo, rol: tipo };
  }

  /** Fila de Rol de ese tipo; la crea si no existe. */
  async rolDe(tipo: TipoRol): Promise<Rol> {
    return (await this.roles.findOneBy({ tipo }))
      ?? this.roles.save(this.roles.create({ Profesor: 'Profesor', Alumno: 'Alumno', tipo }));
  }

  private publico(u: SujetoEstudio): UsuarioActual {
    return { id_sujeto: u.id_sujeto, Nombre: u.Nombre, correo: u.correo, rol: tipoDe(u.rol) };
  }

  private emitirToken(id: number): string {
    const payload = Buffer.from(JSON.stringify({ id, exp: Date.now() + DURACION_TOKEN_MS })).toString('base64url');
    return `${payload}.${firmar(payload)}`;
  }

  private verificarToken(token: string | undefined): number | null {
    const [payload, firma] = (token ?? '').split('.');
    if (!payload || !firma) return null;
    const esperada = Buffer.from(firmar(payload));
    const recibida = Buffer.from(firma);
    if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;
    try {
      const { id, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { id: number; exp: number };
      return typeof id === 'number' && exp > Date.now() ? id : null;
    } catch {
      return null;
    }
  }
}
