import { BadRequestException, ConflictException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { SesionGrabacion } from '../entities/sesiongrabacion.entity.js';
import { SujetoEstudio } from '../entities/sujeto-estudio.entity.js';
import { normalizarMac, validarAsignaciones, validarInicio } from '../datos/validacion.js';
import type { ClaveDato } from '../datos/catalogo.js';

const VIGENCIA_PUENTE_MS = 10000;

export interface SesionActiva {
  id_sesion: number;
  id_sujeto: number;
  sujeto: string;
  nombre_sesion: string;
  datos: ClaveDato[];
  fecha_inicio: Date;
  direccion_mac: string | null;
  ubicacion: string | null;
}

interface EstadoPuente {
  visto: number;
  activos: string[];
  errores: Record<string, string>;
  dispositivo: string | null;
  direccion_mac: string | null;
}

/** Una sesión por sensor, con un único inicio y cierre para el conjunto activo. */
@Injectable()
export class MedicionService implements OnModuleInit {
  private readonly log = new Logger(MedicionService.name);
  private readonly activas = new Map<number, SesionActiva>();
  private readonly puentes = new Map<string, EstadoPuente>();
  private puenteLegado: EstadoPuente = { visto: 0, activos: [], errores: {}, dispositivo: null, direccion_mac: null };
  private operaciones: Promise<unknown> = Promise.resolve();

  constructor(
    @InjectRepository(SujetoEstudio) private readonly sujetos: Repository<SujetoEstudio>,
    private readonly ds: DataSource,
  ) {}

  /** Si el servidor se cayó con una sesión abierta, se cierra en el último dato que alcanzó a guardar. */
  async onModuleInit(): Promise<void> {
    const r = await this.ds.query(`
      UPDATE "Sesion_Grabacion" s SET estado_sesion = 'finalizada',
        fecha_fin = COALESCE((SELECT MAX(m.timestamp) FROM "Muestreo_datos" m
                              JOIN "Vinculacion" v ON v.id_vinculacion = m.id_vinculacion WHERE v.id_sesion = s.id_sesion), s.fecha_inicio)
      WHERE s.estado_sesion = 'en_curso'`);
    await this.ds.query(`UPDATE "Vinculacion" v SET "Fecha_desvinculacion" = COALESCE((SELECT s.fecha_fin FROM "Sesion_Grabacion" s WHERE s.id_sesion = v.id_sesion), now())
                         WHERE v."Fecha_desvinculacion" IS NULL`);
    if (Array.isArray(r) && r[1]) this.log.warn(`${r[1]} sesión(es) que quedaron abiertas fueron cerradas`);
  }

  getActiva(id?: number): SesionActiva | null {
    return (id == null ? this.activas.values().next().value : this.activas.get(id)) ?? null;
  }

  idsActivos(): number[] { return [...this.activas.keys()]; }

  private sesionDe(mac: string) {
    return Array.from(this.activas.values()).find((sesion) => sesion.direccion_mac === mac) ?? null;
  }

  private resumen(activa: SesionActiva | null) {
    return {
      midiendo: !!activa,
      id_sesion: activa?.id_sesion ?? null,
      id_sujeto: activa?.id_sujeto ?? null,
      sujeto: activa?.sujeto ?? null,
      datos: activa?.datos ?? [],
      fecha_inicio: activa?.fecha_inicio ?? null,
      direccion_mac: activa?.direccion_mac ?? null,
    };
  }

  private verPuente({ visto, ...estado }: EstadoPuente) {
    return {
      ...estado,
      visto_hace_s: visto ? +((Date.now() - visto) / 1000).toFixed(1) : null,
      disponible: visto > 0 && Date.now() - visto <= VIGENCIA_PUENTE_MS,
    };
  }

  estado() {
    const activa = this.getActiva();
    const puentes = Array.from(this.puentes.values(), (puente) => this.verPuente(puente));
    return {
      ...this.resumen(activa),
      sesiones_activas: [...this.activas.values()],
      puentes,
      puente: puentes.find((p) => p.disponible) ?? this.verPuente(this.puenteLegado),
    };
  }

  estadoParaPuente(direccion?: string, dispositivo?: string) {
    if (direccion == null) {
      this.puenteLegado.visto = Date.now();
      const sesion = this.getActiva();
      return { ...this.resumen(sesion?.direccion_mac === null ? sesion : null), puente: this.verPuente(this.puenteLegado) };
    }
    const mac = normalizarMac(direccion);
    if (!mac) throw new BadRequestException({ errores: ['dirección MAC inválida'] });
    const puente = this.puentes.get(mac) ?? { visto: 0, activos: [], errores: {}, dispositivo: null, direccion_mac: mac };
    puente.visto = Date.now();
    if (typeof dispositivo === 'string' && dispositivo.trim()) puente.dispositivo = dispositivo.trim();
    this.puentes.set(mac, puente);
    return { ...this.resumen(this.sesionDe(mac)), puente: this.verPuente(puente) };
  }

  iniciar(body: unknown) {
    return this.enOrden(() => this.crearSesiones(body));
  }

  private async crearSesiones(body: unknown) {
    const campos = typeof body === 'object' && body !== null ? body as Record<string, unknown> : null;
    const grupo = campos && 'asignaciones' in campos;
    const lote = grupo ? validarAsignaciones(campos.asignaciones) : null;
    if (lote?.errores.length) throw new BadRequestException({ errores: lote.errores });
    const { errores, valor } = validarInicio(lote ? { ...campos, id_sujeto: lote.valor[0].id_sujeto } : body);
    if (!valor) throw new BadRequestException({ errores });

    const disponibles = [...this.puentes.values()].filter((puente) => this.verPuente(puente).disponible);
    if (!lote && disponibles.length > 1) {
      throw new BadRequestException({ errores: ['selecciona los sensores que quieres grabar'] });
    }
    const asignaciones = lote?.valor ?? [{
      direccion_mac: disponibles[0]?.direccion_mac ?? null,
      id_sujeto: valor.id_sujeto,
      ubicacion: null,
    }];
    for (const { direccion_mac } of asignaciones) {
      if (direccion_mac && !disponibles.some((puente) => puente.direccion_mac === direccion_mac)) {
        throw new BadRequestException({ errores: [`el sensor ${direccion_mac} no está disponible`] });
      }
    }

    const ids = [...new Set(asignaciones.map((asignacion) => asignacion.id_sujeto))];
    const sujetos = new Map((await this.sujetos.findBy({ id_sujeto: In(ids) })).map((s) => [s.id_sujeto, s.Nombre]));
    for (const id of ids) {
      if (!sujetos.has(id)) throw new BadRequestException({ errores: [`no existe el sujeto de estudio ${id}`] });
    }
    if (this.activas.size) {
      if (lote || this.activas.size !== 1 || this.getActiva()?.direccion_mac) {
        throw new ConflictException({ errores: ['ya hay una grabación en curso'] });
      }
      await this.cerrarSesiones();
    }

    const fecha_inicio = new Date();
    const sesiones = await this.ds.transaction((em) => em.save(SesionGrabacion, asignaciones.map((asignacion) => ({
      ...asignacion,
      Nombre_sesion: valor.nombre_sesion ?? `Sesión de ${sujetos.get(asignacion.id_sujeto)}`.slice(0, 120),
      fecha_inicio,
      estado_sesion: 'en_curso',
      fecha_fin: null,
      datos_seleccionados: valor.datos,
    }))));
    for (const s of sesiones) {
      const activa = {
        id_sesion: s.id_sesion, id_sujeto: s.id_sujeto, sujeto: sujetos.get(s.id_sujeto)!,
        nombre_sesion: s.Nombre_sesion, datos: valor.datos, fecha_inicio,
        direccion_mac: s.direccion_mac, ubicacion: s.ubicacion,
      };
      this.activas.set(s.id_sesion, activa);
      this.limpiarFlujos(s.direccion_mac);
      this.log.log(`Sesión ${s.id_sesion} iniciada: ${s.direccion_mac ?? 'puente sin MAC'}`);
    }
    return this.estado();
  }

  detener() {
    return this.enOrden(async () => {
      await this.cerrarSesiones();
      return this.estado();
    });
  }

  private async cerrarSesiones() {
    const ids = [...this.activas.keys()];
    if (!ids.length) return;
    await this.ds.transaction(async (em) => {
      // Mismo bloqueo que toma ingesta para garantizar un cierre posterior a la última escritura.
      await em.createQueryBuilder(SesionGrabacion, 's').where('s.id_sesion IN (:...ids)', { ids })
        .orderBy('s.id_sesion').setLock('pessimistic_write').getMany();
      const ahora = new Date();
      await em.update(SesionGrabacion, { id_sesion: In(ids), estado_sesion: 'en_curso' }, { estado_sesion: 'finalizada', fecha_fin: ahora });
      await em.query(`UPDATE "Vinculacion" SET "Fecha_desvinculacion" = $1 WHERE id_sesion = ANY($2) AND "Fecha_desvinculacion" IS NULL`, [ahora, ids]);
      await em.query(`UPDATE "Sensor" SET "Estado" = 'desconectado' WHERE id_sensor IN (SELECT id_sensor FROM "Vinculacion" WHERE id_sesion = ANY($1))`, [ids]);
    });
    for (const sesion of this.activas.values()) this.limpiarFlujos(sesion.direccion_mac);
    this.activas.clear();
    this.log.log(`${ids.length} sesión(es) finalizada(s)`);
  }

  private enOrden<T>(accion: () => Promise<T>): Promise<T> {
    const resultado = this.operaciones.then(accion);
    this.operaciones = resultado.catch(() => undefined);
    return resultado;
  }

  private limpiarFlujos(mac: string | null) {
    const puente = mac ? this.puentes.get(mac) : this.puenteLegado;
    if (puente) { puente.activos = []; puente.errores = {}; }
  }

  registrarPuente(b: { activos?: unknown; errores?: unknown; dispositivo?: unknown; direccion_mac?: unknown; id_sesion?: unknown }) {
    const mac = normalizarMac(b.direccion_mac);
    const conSesionIdentificada = 'id_sesion' in b;
    const puente = conSesionIdentificada ? this.puentes.get(mac ?? '') : this.puenteLegado;
    if (!puente) return { ok: false };
    puente.visto = Date.now();
    if (typeof b.dispositivo === 'string') puente.dispositivo = b.dispositivo.trim() || null;
    if (!conSesionIdentificada) puente.direccion_mac = mac;
    if (!conSesionIdentificada || b.id_sesion === (this.sesionDe(mac!)?.id_sesion ?? null)) {
      puente.activos = Array.isArray(b.activos) ? b.activos.map(String) : [];
      puente.errores = b.errores && typeof b.errores === 'object'
        ? Object.fromEntries(Object.entries(b.errores).map(([k, v]) => [k, String(v)])) : {};
    }
    return { ok: true };
  }
}
