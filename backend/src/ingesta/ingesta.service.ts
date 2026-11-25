import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { MuestreoDatos } from '../entities/muestreodatos.entity.js';
import { Sensor } from '../entities/sensor.entity.js';
import { SesionGrabacion } from '../entities/sesiongrabacion.entity.js';
import { Vinculacion } from '../entities/vinculacion.entity.js';
import { MedicionService } from '../medicion/medicion.service.js';
import { paqueteAFilas } from '../datos/mapeo.js';
import { normalizarMac, validarPaquete, type Paquete } from '../datos/validacion.js';

const TAM_LOTE_INSERT = 1000; // 1000 filas x ~25 columnas = 25 000 parámetros < límite de 65 535 de PostgreSQL

/**
 * INGESTA: recibe el paquete crudo del puente y lo deja guardado. Solo valida, ordena y guarda;
 * no promedia ni estima nada (decisión D-02: lo calculado se hará después, a partir de lo crudo).
 */
@Injectable()
export class IngestaService {
  constructor(
    private readonly ds: DataSource,
    private readonly medicion: MedicionService,
  ) {}

  async guardar(body: unknown): Promise<{ ignorado: true } | { ignorado: false; id_sesion: number; filas: number }> {
    const errores = validarPaquete(body);
    if (errores.length) throw new BadRequestException({ ok: false, errores });
    const p = body as Paquete;

    // Si la sesión ya no está activa (se pulsó Detener), los últimos datos en vuelo se descartan.
    const activa = this.medicion.getActiva(p.id_sesion);
    const mac = normalizarMac(p.direccion_mac);
    if (!activa || (activa.direccion_mac && activa.direccion_mac !== mac)) return { ignorado: true };

    return this.ds.transaction(async (em) => {
      // La fila de sesión también se bloquea al detener la grabación.
      const sesion = await em.findOne(SesionGrabacion, {
        where: { id_sesion: p.id_sesion }, lock: { mode: 'pessimistic_write' },
      });
      if (sesion?.estado_sesion !== 'en_curso') return { ignorado: true };

      const idVinculacion = await this.obtenerVinculacion(em, p, mac);
      if (idVinculacion == null) return { ignorado: true };
      const filas = paqueteAFilas(p, idVinculacion);
      for (let i = 0; i < filas.length; i += TAM_LOTE_INSERT) {
        await em.insert(MuestreoDatos, filas.slice(i, i + TAM_LOTE_INSERT));
      }
      return { ignorado: false, id_sesion: p.id_sesion, filas: filas.length };
    });
  }

  /** Vinculación = "este sensor estuvo en esta sesión". Se crea con el primer paquete y se reutiliza. */
  private async obtenerVinculacion(em: EntityManager, p: Paquete, mac: string | null): Promise<number | null> {
    const vincs = em.getRepository(Vinculacion);
    const direccion = mac ?? (p.direccion_mac?.trim() || 'desconocida');
    const existente = await vincs.findOne({ where: { id_sesion: p.id_sesion }, relations: { sensor: true } });
    if (existente) {
      const guardada = normalizarMac(existente.sensor.direccion_MAC) ?? existente.sensor.direccion_MAC;
      return guardada === direccion ? existente.id_vinculacion : null;
    }

    const sensores = em.getRepository(Sensor);
    let sensor = await sensores.findOneBy({ direccion_MAC: direccion });
    if (!sensor) {
      sensor = await sensores.save(sensores.create({
        Nombre_dispositivo: p.dispositivo.trim(), Estado: 'conectado', direccion_MAC: direccion, tipo: 'Polar Verity Sense',
      }));
    } else if (sensor.Estado !== 'conectado') {
      await sensores.update({ id_sensor: sensor.id_sensor }, { Estado: 'conectado' });
    }
    const v = await vincs.save(vincs.create({
      id_sensor: sensor.id_sensor, id_sesion: p.id_sesion, fecha_vinculación: new Date(), Fecha_desvinculacion: null,
    }));
    return v.id_vinculacion;
  }
}
