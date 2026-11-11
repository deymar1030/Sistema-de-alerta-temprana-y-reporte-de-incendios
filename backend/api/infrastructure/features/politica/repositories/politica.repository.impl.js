import PoliticaRepository from "../../../../application/politica/repositories/politica.repository.js";

export default class PrismaPoliticaRepository extends PoliticaRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  // Un rol puede tener 0 o varias politicas asociadas (rol_politica es N:M).
  // Sin ninguna fila -> sin limite de intentos (ver docs/PoliticaLockout.md).
  // Con varias, gana la combinacion mas restrictiva.
  async findEfectivaByRol(id_rol) {
    const politicas = await this.prisma.politica.findMany({
      where: { rol_politica: { some: { id_rol: Number(id_rol) } } },
      select: { max_intentos_fallidos: true, tiempo_bloqueo_minutos: true },
    });

    if (politicas.length === 0) return null;

    return politicas.reduce((efectiva, actual) => ({
      max_intentos_fallidos: Math.min(efectiva.max_intentos_fallidos, actual.max_intentos_fallidos),
      tiempo_bloqueo_minutos: Math.max(efectiva.tiempo_bloqueo_minutos, actual.tiempo_bloqueo_minutos),
    }));
  }
}
