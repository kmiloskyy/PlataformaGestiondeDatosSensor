import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MuestreoDatos } from '../entities/muestreodatos.entity.js';
import { SesionGrabacion } from '../entities/sesiongrabacion.entity.js';
import { SujetoEstudio } from '../entities/sujeto-estudio.entity.js';
import { MedicionService } from '../medicion/medicion.service.js';
import { esProfesor, type UsuarioActual } from '../auth/auth.types.js';
import { CLAVES, DATOS_MUESTRAS, esClave, type ClaveDato } from '../datos/catalogo.js';
import { armarLecturas } from '../datos/exportacion.js';

/** Columnas que se grafican de cada dato (en este orden salen los valores de cada punto de la serie). */
const COLUMNAS_SERIE: Record<ClaveDato, string[]> = {
  fc: ['frecuencia_cardiaca'],
  acc: DATOS_MUESTRAS.acc.campos.map((c) => c.columna),
  gyro: DATOS_MUESTRAS.gyro.campos.map((c) => c.columna),
  mag: DATOS_MUESTRAS.mag.campos.slice(0, 3).map((c) => c.columna),
  ppg: DATOS_MUESTRAS.ppg.campos.map((c) => c.columna),
  ppi: ['ppi_ms', 'ppi_error_ms', 'ppi_bloqueado'],
};

@Injectable()
export class ConsultasService {
  constructor(
    @InjectRepository(SesionGrabacion) private readonly sesiones: Repository<SesionGrabacion>,
    @InjectRepository(SujetoEstudio) private readonly sujetos: Repository<SujetoEstudio>,
    @InjectRepository(MuestreoDatos) private readonly muestras: Repository<MuestreoDatos>,
    private readonly ds: DataSource,
    private readonly medicion: MedicionService,
  ) {}

  /** Solo id y nombre: el RUT, el peso y la contraseña del sujeto NO salen por esta API. */
  listarSujetos() {
    return this.sujetos.find({ select: { id_sujeto: true, Nombre: true }, order: { id_sujeto: 'ASC' } });
  }

  /** Inventario de sensores registrados por ingesta, con su vinculación más reciente. */
  listarSensores() {
    return this.ds.query(`
      SELECT sensor.id_sensor, sensor."Nombre_dispositivo" AS nombre, sensor."direccion_MAC" AS direccion_mac,
        sensor.tipo, vinculacion.id_sesion, vinculacion.sujeto, vinculacion.ubicacion,
        vinculacion.fecha_vinculacion, vinculacion.fecha_desvinculacion
      FROM "Sensor" sensor
      LEFT JOIN LATERAL (
        SELECT v.id_sesion, sujeto."Nombre" AS sujeto, sesion.ubicacion, v."fecha_vinculación" AS fecha_vinculacion,
          v."Fecha_desvinculacion" AS fecha_desvinculacion
        FROM "Vinculacion" v
        JOIN "Sesion_Grabacion" sesion ON sesion.id_sesion = v.id_sesion
        LEFT JOIN "Sujeto_estudio" sujeto ON sujeto.id_sujeto = sesion.id_sujeto
        WHERE v.id_sensor = sensor.id_sensor
        ORDER BY v.id_vinculacion DESC LIMIT 1
      ) vinculacion ON true
      ORDER BY sensor.id_sensor`);
  }

  /** El profesor ve todas las sesiones; el alumno, solo las suyas. */
  async listarSesiones(usuario: UsuarioActual) {
    const filas = await this.sesiones.find({
      where: esProfesor(usuario) ? {} : { id_sujeto: usuario.id_sujeto },
      relations: { sujeto: true, vinculaciones: { sensor: true } }, order: { id_sesion: 'DESC' },
    });
    const cuentas: { id_sesion: number; tipo_dato: string; n: number }[] = await this.ds.query(`
      SELECT v.id_sesion, m.tipo_dato, COUNT(*)::int AS n FROM "Muestreo_datos" m
      JOIN "Vinculacion" v ON v.id_vinculacion = m.id_vinculacion GROUP BY v.id_sesion, m.tipo_dato`);
    return filas.map((s) => ({
      id_sesion: s.id_sesion, id_sujeto: s.id_sujeto, sujeto: s.sujeto?.Nombre ?? null, nombre_sesion: s.Nombre_sesion,
      estado_sesion: s.estado_sesion, fecha_inicio: s.fecha_inicio, fecha_fin: s.fecha_fin,
      datos: this.datosDe(s),
      direccion_mac: s.direccion_mac, ubicacion: s.ubicacion,
      sensores: (s.vinculaciones ?? []).flatMap(({ sensor }) => sensor ? [sensor.Nombre_dispositivo] : []),
      muestras: Object.fromEntries(cuentas.filter((c) => c.id_sesion === s.id_sesion).map((c) => [c.tipo_dato, c.n])),
    }));
  }

  private datosDe(s: SesionGrabacion): ClaveDato[] {
    return (s.datos_seleccionados ?? []).filter(esClave);
  }

  /** Un alumno que pide la sesión de otro recibe el mismo 404 que si no existiera. */
  private async sesion(id: number, usuario: UsuarioActual): Promise<SesionGrabacion> {
    const s = await this.sesiones.findOne({ where: { id_sesion: id }, relations: { sujeto: true } });
    if (!s || (!esProfesor(usuario) && s.id_sujeto !== usuario.id_sujeto)) throw new NotFoundException({ ok: false, errores: ['sesión no encontrada'] });
    return s;
  }

  /** JSON completo de una sesión: todas las muestras crudas, desglosadas, de los datos elegidos. */
  async exportarSesion(id: number, usuario: UsuarioActual) {
    const s = await this.sesion(id, usuario);
    const datos = this.datosDe(s);
    const filas = await this.muestras.createQueryBuilder('m').innerJoin('m.vinculacion', 'v').where('v.id_sesion = :id', { id })
      .orderBy('m.timestamp', 'ASC').addOrderBy('m.id_lectura', 'ASC').getMany();
    const totales: Record<string, number> = {};
    for (const f of filas) totales[f.tipo_dato] = (totales[f.tipo_dato] ?? 0) + 1;
    const unidades: Record<string, string> = { frecuencia_cardiaca: 'lpm', rr_ms: 'ms' };
    for (const k of datos) if (k !== 'fc') unidades[DATOS_MUESTRAS[k].arreglo] = DATOS_MUESTRAS[k].unidad;
    return {
      id_sesion: s.id_sesion, nombre_sesion: s.Nombre_sesion, id_sujeto: s.id_sujeto, sujeto: s.sujeto?.Nombre ?? null,
      direccion_mac: s.direccion_mac, ubicacion: s.ubicacion,
      fecha_inicio: s.fecha_inicio, fecha_fin: s.fecha_fin, estado_sesion: s.estado_sesion, datos, unidades,
      total_muestras: totales,
      lecturas: armarLecturas(filas, datos),
    };
  }

  /** Datos de una ventana de tiempo para graficar, reducidos a ~max puntos por serie (la exportación sigue siendo completa). */
  async series(id: number, usuario: UsuarioActual, desdeQ?: string, hastaQ?: string, maxQ?: string) {
    const s = await this.sesion(id, usuario);
    const fecha = (v: string | undefined, def: Date) => { const t = v ? Date.parse(v) : NaN; return Number.isNaN(t) ? def : new Date(t); };
    const desde = fecha(desdeQ, s.fecha_inicio);
    const hasta = fecha(hastaQ, s.fecha_fin ?? new Date());
    const max = Math.min(Math.max(parseInt(maxQ ?? '') || 1200, 100), 6000);
    const datos = this.datosDe(s);
    const series: Record<string, (number | null)[][]> = {};
    for (const k of datos) {
      const cols = COLUMNAS_SERIE[k];
      // la FC 0 ("sensor sin lectura") queda guardada y exportada, pero no se dibuja
      const base = `FROM "Muestreo_datos" m JOIN "Vinculacion" v ON v.id_vinculacion = m.id_vinculacion
                    WHERE v.id_sesion = $1 AND m.tipo_dato = $2 AND m.timestamp >= $3 AND m.timestamp <= $4${k === 'fc' ? ' AND m.frecuencia_cardiaca > 0' : ''}`;
      const [{ n }] = await this.ds.query(`SELECT COUNT(*)::int AS n ${base}`, [id, k, desde, hasta]);
      const paso = Math.max(1, Math.ceil(n / max));
      const sel = cols.map((c, i) => `m."${c}" AS c${i}`).join(', ');
      const out = cols.map((_, i) => `x.c${i}`).join(', ');
      const filas: Record<string, number | null>[] = await this.ds.query(
        `SELECT (extract(epoch from x.ts) * 1000)::float8 AS t, ${out} FROM (
           SELECT m.timestamp AS ts, ${sel}, ROW_NUMBER() OVER (ORDER BY m.timestamp, m.id_lectura) AS rn ${base}) x
         WHERE (x.rn - 1) % $5::bigint = 0 ORDER BY x.ts`, [id, k, desde, hasta, paso]);
      series[k] = filas.map((f) => [f.t, ...cols.map((_, i) => f[`c${i}`])]);
    }
    return { id_sesion: s.id_sesion, fecha_inicio: s.fecha_inicio, fecha_fin: s.fecha_fin, ahora: new Date(), datos, desde, hasta, series };
  }

  /** CSV de un dato de una sesión: fc, rr, acc, gyro, mag, ppg o ppi. */
  async csv(id: number, dato: string, usuario: UsuarioActual): Promise<{ nombre: string; texto: string }> {
    await this.sesion(id, usuario);
    const def = esClave(dato) && dato !== 'fc' ? DATOS_MUESTRAS[dato] : null;
    let cols: { enc: string; col: string }[];
    let tipo: string;
    if (dato === 'fc') { tipo = 'fc'; cols = [{ enc: 'frecuencia_cardiaca', col: 'frecuencia_cardiaca' }, { enc: 'fc_crudo', col: 'fc_crudo' }]; }
    else if (dato === 'rr') { tipo = 'rr'; cols = [{ enc: 'intervalo_rr_ms', col: 'intervalo_rr' }]; }
    else if (def) { tipo = def.clave; cols = [...def.campos.map((c) => ({ enc: c.json, col: c.columna as string })), { enc: 'sensor_ns', col: 'sensor_ns' }]; }
    else throw new NotFoundException({ ok: false, errores: ['dato desconocido (usa: ' + [...CLAVES, 'rr'].join(', ') + ')'] });
    const filas: Record<string, unknown>[] = await this.ds.query(
      `SELECT to_char(m.timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS timestamp, ${cols.map((c) => `m."${c.col}" AS "${c.col}"`).join(', ')}
       FROM "Muestreo_datos" m JOIN "Vinculacion" v ON v.id_vinculacion = m.id_vinculacion
       WHERE v.id_sesion = $1 AND m.tipo_dato = $2 ORDER BY m.timestamp, m.id_lectura`, [id, tipo]);
    const texto = ['timestamp,' + cols.map((c) => c.enc).join(','), ...filas.map((f) => [f.timestamp, ...cols.map((c) => f[c.col] ?? '')].join(','))].join('\n');
    return { nombre: `sesion-${id}-${dato}.csv`, texto };
  }

  /** Resumen de todas las grabaciones activas para el monitor, en una sola consulta. */
  lecturasActivas() {
    const ids = this.medicion.idsActivos();
    if (!ids.length) return [];
    return this.ds.query(`
      SELECT v.id_sesion, MAX(m.timestamp) AS ultima_lectura,
        (ARRAY_AGG(m.frecuencia_cardiaca ORDER BY m.timestamp DESC, m.id_lectura DESC)
          FILTER (WHERE m.tipo_dato = 'fc' AND m.frecuencia_cardiaca > 0))[1] AS frecuencia_cardiaca
      FROM "Vinculacion" v
      JOIN "Muestreo_datos" m ON m.id_vinculacion = v.id_vinculacion
      WHERE v.id_sesion = ANY($1) AND m.timestamp > now() - interval '5 seconds'
      GROUP BY v.id_sesion`, [ids]);
  }

  /** Lo último que llegó (alimenta el panel de lecturas en vivo). */
  async ultimo(id?: number) {
    const activa = this.medicion.getActiva(id);
    if (id != null && !activa) return { id_sesion: id, paquete: null };
    const filtro = activa ? 'AND v.id_sesion = $1' : '';
    const params = activa ? [activa.id_sesion] : [];
    const base = `FROM "Muestreo_datos" m JOIN "Vinculacion" v ON v.id_vinculacion = m.id_vinculacion WHERE true ${filtro}`;
    const [ult] = await this.ds.query(`SELECT m.timestamp ${base} ORDER BY m.timestamp DESC LIMIT 1`, params);
    if (!ult) return { id_sesion: activa?.id_sesion ?? null, paquete: null };
    const reciente: MuestreoDatos[] = await this.muestras.createQueryBuilder('m').innerJoin('m.vinculacion', 'v')
      .where(activa ? 'v.id_sesion = :s' : 'true', { s: activa?.id_sesion })
      .andWhere("m.timestamp > :t::timestamptz - interval '1 second'", { t: ult.timestamp })
      .orderBy('m.timestamp', 'ASC').getMany();
    const [fc] = await this.ds.query(`SELECT m.timestamp, m.frecuencia_cardiaca, m.fc_crudo ${base} AND m.tipo_dato = 'fc' AND m.frecuencia_cardiaca > 0 ORDER BY m.timestamp DESC LIMIT 1`, params);
    const lecturas = armarLecturas(reciente, activa ? activa.datos : [...CLAVES]);
    const edad = (t: Date) => +((Date.now() - new Date(t).getTime()) / 1000).toFixed(1);
    return {
      id_sesion: activa?.id_sesion ?? null,
      edad_s: edad(ult.timestamp),
      frecuencia_cardiaca: fc?.frecuencia_cardiaca ?? null, fc_edad_s: fc ? edad(fc.timestamp) : null, fc_crudo: fc?.fc_crudo ?? null,
      paquete: lecturas[lecturas.length - 1] ?? null,
    };
  }
}
