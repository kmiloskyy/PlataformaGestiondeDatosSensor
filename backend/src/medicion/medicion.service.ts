import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SesionGrabacion } from '../entities/sesiongrabacion.entity.js';
import { SujetoEstudio } from '../entities/sujeto-estudio.entity.js';
import { validarInicio } from '../datos/validacion.js';
import type { ClaveDato } from '../datos/catalogo.js';

export interface SesionActiva {
  id_sesion: number;
  id_sujeto: number;
  sujeto: string;
  datos: ClaveDato[];
  fecha_inicio: Date;
}

interface EstadoPuente {
  visto: number;
  activos: string[];
  errores: Record<string, string>;
  dispositivo: string | null;
  direccion_mac: string | null;
}

/**
 * Control de la medición: qué sesión está en curso y qué datos se pidieron.
 * El puente (programa que lee el sensor por Bluetooth) consulta este estado cada segundo y obedece:
 * cuando aparece una sesión activa, activa en el sensor SOLO los datos elegidos; cuando se detiene, los apaga.
 * El estado vive en memoria (una sola sesión a la vez) y cada cambio queda registrado en Sesion_Grabacion.
 */
@Injectable()
export class MedicionService implements OnModuleInit {
  private readonly log = new Logger(MedicionService.name);
  private activa: SesionActiva | null = null;
  private puente: EstadoPuente = { visto: 0, activos: [], errores: {}, dispositivo: null, direccion_mac: null };

  constructor(
    @InjectRepository(SesionGrabacion) private readonly sesiones: Repository<SesionGrabacion>,
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

  getActiva(): SesionActiva | null { return this.activa; }

  estado(desdePuente = false) {
    if (desdePuente) this.puente.visto = Date.now();
    return {
      midiendo: !!this.activa,
      id_sesion: this.activa?.id_sesion ?? null,
      id_sujeto: this.activa?.id_sujeto ?? null,
      sujeto: this.activa?.sujeto ?? null,
      datos: this.activa?.datos ?? [],
      fecha_inicio: this.activa?.fecha_inicio ?? null,
      puente: {
        visto_hace_s: this.puente.visto ? +((Date.now() - this.puente.visto) / 1000).toFixed(1) : null,
        activos: this.puente.activos, errores: this.puente.errores,
        dispositivo: this.puente.dispositivo, direccion_mac: this.puente.direccion_mac,
      },
    };
  }

  async iniciar(body: unknown) {
    const { errores, valor } = validarInicio(body);
    if (!valor) throw new BadRequestException({ ok: false, errores });
    const sujeto = await this.sujetos.findOneBy({ id_sujeto: valor.id_sujeto });
    if (!sujeto) throw new BadRequestException({ ok: false, errores: [`no existe el sujeto de estudio ${valor.id_sujeto}`] });
    await this.detener(); // si había una sesión abierta se cierra y empieza una nueva
    const sesion = await this.sesiones.save(this.sesiones.create({
      id_sujeto: sujeto.id_sujeto,
      Nombre_sesion: valor.nombre_sesion ?? `Sesión de ${sujeto.Nombre}`,
      fecha_inicio: new Date(),
      estado_sesion: 'en_curso',
      fecha_fin: null,
      datos_seleccionados: valor.datos,
    }));
    this.activa = { id_sesion: sesion.id_sesion, id_sujeto: sujeto.id_sujeto, sujeto: sujeto.Nombre, datos: valor.datos, fecha_inicio: sesion.fecha_inicio };
    this.puente.activos = []; this.puente.errores = {};
    this.log.log(`Sesión ${sesion.id_sesion} iniciada (${sujeto.Nombre}): ${valor.datos.join(', ')}`);
    return this.estado();
  }

  async detener() {
    const activa = this.activa;
    if (activa) {
      const id = activa.id_sesion;
      await this.ds.transaction(async (em) => {
        const sesion = await em.findOne(SesionGrabacion, {
          where: { id_sesion: id }, lock: { mode: 'pessimistic_write' },
        });
        if (sesion?.estado_sesion !== 'en_curso') return;
        const ahora = new Date();
        await em.update(SesionGrabacion, { id_sesion: id }, { estado_sesion: 'finalizada', fecha_fin: ahora });
        await em.query(`UPDATE "Vinculacion" SET "Fecha_desvinculacion" = $1 WHERE id_sesion = $2 AND "Fecha_desvinculacion" IS NULL`, [ahora, id]);
        await em.query(`UPDATE "Sensor" SET "Estado" = 'desconectado' WHERE id_sensor IN (SELECT id_sensor FROM "Vinculacion" WHERE id_sesion = $1)`, [id]);
      });
      if (this.activa === activa) {
        this.activa = null;
        this.puente.activos = [];
        this.puente.errores = {};
        this.log.log(`Sesión ${id} finalizada`);
      }
    }
    return this.estado();
  }

  /** El puente informa qué flujos del sensor pudo activar y cuáles no (y por qué). */
  registrarPuente(b: { activos?: unknown; errores?: unknown; dispositivo?: unknown; direccion_mac?: unknown }) {
    this.puente = {
      visto: Date.now(),
      activos: Array.isArray(b.activos) ? b.activos.map(String) : [],
      errores: b.errores && typeof b.errores === 'object' ? Object.fromEntries(Object.entries(b.errores).map(([k, v]) => [k, String(v)])) : {},
      dispositivo: typeof b.dispositivo === 'string' ? b.dispositivo : this.puente.dispositivo,
      direccion_mac: typeof b.direccion_mac === 'string' ? b.direccion_mac.trim() || null : null,
    };
    return { ok: true };
  }
}
