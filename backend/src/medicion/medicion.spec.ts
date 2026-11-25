import { describe, expect, it, vi } from 'vitest';
import type { DataSource, Repository } from 'typeorm';
import type { SujetoEstudio } from '../entities/sujeto-estudio.entity.js';
import { MuestreoDatos } from '../entities/muestreodatos.entity.js';
import { IngestaService } from '../ingesta/ingesta.service.js';
import { MedicionService } from './medicion.service.js';

const brazo = '02:00:00:00:00:11';
const pierna = '02:00:00:00:00:12';
const solicitud = {
  datos: ['fc', 'acc'],
  asignaciones: [
    { direccion_mac: brazo, id_sujeto: 7, ubicacion: 'Brazo izquierdo' },
    { direccion_mac: pierna, id_sujeto: 7, ubicacion: 'Pierna derecha' },
  ],
};

function crearServicios() {
  const query = {
    where: vi.fn().mockReturnThis(), orderBy: vi.fn().mockReturnThis(),
    setLock: vi.fn().mockReturnThis(), getMany: vi.fn().mockResolvedValue([]),
  };
  const em = {
    save: vi.fn((_, filas: object[]) => filas.map((fila, i) => ({ ...fila, id_sesion: 101 + i }))),
    createQueryBuilder: vi.fn().mockReturnValue(query),
    update: vi.fn(), query: vi.fn(), insert: vi.fn(),
    findOne: vi.fn().mockResolvedValue({ estado_sesion: 'en_curso' }),
    getRepository: vi.fn().mockReturnValue({
      findOne: vi.fn(({ where }) => ({
        id_vinculacion: where.id_sesion === 101 ? 201 : 202,
        sensor: { direccion_MAC: where.id_sesion === 101 ? brazo : pierna },
      })),
    }),
  };
  const transaccion = vi.fn((operacion) => operacion(em));
  const ds = { transaction: transaccion } as unknown as DataSource;
  const sujetos = { findBy: vi.fn().mockResolvedValue([{ id_sujeto: 7, Nombre: 'Sujeto de prueba' }]) };
  const medicion = new MedicionService(sujetos as unknown as Repository<SujetoEstudio>, ds);
  return { medicion, ingesta: new IngestaService(ds, medicion), transaccion, em };
}

describe('grabación simultánea', () => {
  it('asigna una sesión y ubicación a cada MAC aunque el sujeto sea el mismo', async () => {
    const { medicion, transaccion } = crearServicios();
    medicion.estadoParaPuente(brazo, 'Polar brazo');
    medicion.estadoParaPuente(pierna, 'Polar pierna');
    const estado = await medicion.iniciar(solicitud);

    expect(estado.sesiones_activas).toMatchObject([
      { id_sesion: 101, id_sujeto: 7, direccion_mac: brazo, ubicacion: 'Brazo izquierdo' },
      { id_sesion: 102, id_sujeto: 7, direccion_mac: pierna, ubicacion: 'Pierna derecha' },
    ]);
    expect(estado.sesiones_activas[0].fecha_inicio).toEqual(estado.sesiones_activas[1].fecha_inicio);
    expect(transaccion).toHaveBeenCalledTimes(1);
    expect(medicion.estadoParaPuente('02-00-00-00-00-11').id_sesion).toBe(101);
    expect(medicion.estadoParaPuente(pierna).id_sesion).toBe(102);
    expect(medicion.estadoParaPuente('02:00:00:00:00:13').midiendo).toBe(false);
    expect(medicion.estadoParaPuente().midiendo).toBe(false);
    await expect(medicion.iniciar(solicitud)).rejects.toMatchObject({ status: 409 });

    const cerrado = await medicion.detener();
    expect(cerrado.sesiones_activas).toEqual([]);
    expect(medicion.estadoParaPuente(pierna).midiendo).toBe(false);
    expect(transaccion).toHaveBeenCalledTimes(2);
  });

  it('rechaza asignaciones duplicadas o sin un puente disponible antes de escribir', async () => {
    const { medicion, transaccion } = crearServicios();
    medicion.estadoParaPuente(brazo);
    await expect(medicion.iniciar(solicitud)).rejects.toMatchObject({ status: 400 });
    await expect(medicion.iniciar({
      ...solicitud, asignaciones: [{ ...solicitud.asignaciones[0] }, { id_sujeto: 7, direccion_mac: '020000000011' }],
    })).rejects.toMatchObject({ status: 400 });
    expect(transaccion).not.toHaveBeenCalled();
  });

  it('guarda cada lectura en su vinculación y descarta una MAC cruzada', async () => {
    const { medicion, ingesta, em } = crearServicios();
    medicion.estadoParaPuente(brazo);
    medicion.estadoParaPuente(pierna);
    await medicion.iniciar(solicitud);
    const paquete = { dispositivo: 'Polar', timestamp: '2026-11-25T14:00:00.000Z' };

    await expect(ingesta.guardar({ ...paquete, id_sesion: 102, direccion_mac: brazo, frecuencia_cardiaca: 140 }))
      .resolves.toEqual({ ignorado: true });
    await ingesta.guardar({ ...paquete, id_sesion: 101, direccion_mac: brazo, frecuencia_cardiaca: 73 });
    await ingesta.guardar({ ...paquete, id_sesion: 102, direccion_mac: pierna, frecuencia_cardiaca: 92 });
    expect(em.insert).toHaveBeenCalledTimes(2);
    expect(em.insert).toHaveBeenNthCalledWith(1, MuestreoDatos, [expect.objectContaining({ id_vinculacion: 201, frecuencia_cardiaca: 73 })]);
    expect(em.insert).toHaveBeenNthCalledWith(2, MuestreoDatos, [expect.objectContaining({ id_vinculacion: 202, frecuencia_cardiaca: 92 })]);
  });
});
