import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MuestreoDatos } from '../entities/muestreodatos.entity.js';
import { Sensor } from '../entities/sensor.entity.js';
import { Vinculacion } from '../entities/vinculacion.entity.js';
import { MedicionService } from '../medicion/medicion.service.js';
import { paqueteAFilas } from '../datos/mapeo.js';
import { validarPaquete, type Paquete } from '../datos/validacion.js';

const TAM_LOTE_INSERT = 1000; // 1000 filas x ~25 columnas = 25 000 parámetros < límite de 65 535 de PostgreSQL

/**
 * INGESTA: recibe el paquete crudo del puente y lo deja guardado. Solo valida, ordena y guarda;
 * no promedia ni estima nada (decisión D-02: lo calculado se hará después, a partir de lo crudo).
 */
@Injectable()
export class IngestaService {
  private readonly vinculaciones = new Map<number, Promise<number>>(); // id_sesion -> id_vinculacion

  constructor(
    @InjectRepository(Sensor) private readonly sensores: Repository<Sensor>,
    @InjectRepository(Vinculacion) private readonly vincs: Repository<Vinculacion>,
    private readonly ds: DataSource,
    private readonly medicion: MedicionService,
  ) {}

  async guardar(body: unknown): Promise<{ ignorado: true } | { ignorado: false; id_sesion: number; filas: number }> {
    const errores = validarPaquete(body);
    if (errores.length) throw new BadRequestException({ ok: false, errores });
    const p = body as Paquete;

    // Si la sesión ya no está activa (se pulsó Detener), los últimos datos en vuelo se descartan.
    const activa = this.medicion.getActiva();
    if (!activa || activa.id_sesion !== p.id_sesion) return { ignorado: true };

    const idVinculacion = await this.obtenerVinculacion(p);
    const filas = paqueteAFilas(p, idVinculacion);
    await this.ds.transaction(async (em) => {
      for (let i = 0; i < filas.length; i += TAM_LOTE_INSERT) {
        await em.insert(MuestreoDatos, filas.slice(i, i + TAM_LOTE_INSERT));
      }
    });
    return { ignorado: false, id_sesion: p.id_sesion, filas: filas.length };
  }

  /** Vinculación = "este sensor estuvo en esta sesión". Se crea con el primer paquete y se reutiliza. */
  private obtenerVinculacion(p: Paquete): Promise<number> {
    let pendiente = this.vinculaciones.get(p.id_sesion);
    if (!pendiente) {
      pendiente = this.crearVinculacion(p).catch((e) => { this.vinculaciones.delete(p.id_sesion); throw e; });
      this.vinculaciones.set(p.id_sesion, pendiente);
    }
    return pendiente;
  }

  private async crearVinculacion(p: Paquete): Promise<number> {
    const mac = p.direccion_mac?.trim() || 'desconocida';
    let sensor = await this.sensores.findOneBy({ direccion_MAC: mac });
    if (!sensor) {
      sensor = await this.sensores.save(this.sensores.create({
        Nombre_dispositivo: p.dispositivo.trim(), Estado: 'conectado', direccion_MAC: mac, tipo: 'Polar Verity Sense',
      }));
    } else if (sensor.Estado !== 'conectado') {
      await this.sensores.update({ id_sensor: sensor.id_sensor }, { Estado: 'conectado' });
    }
    const v = await this.vincs.save(this.vincs.create({
      id_sensor: sensor.id_sensor, id_sesion: p.id_sesion, fecha_vinculación: new Date(), Fecha_desvinculacion: null,
    }));
    return v.id_vinculacion;
  }
}
