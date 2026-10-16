import MotorDetRepository from "../../../../application/motorDet/repositories/motorDet.repository.js";

export default class PrismaMotorDetRepository extends MotorDetRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async findAll() {
    return await this.prisma.motor_det.findMany({
      orderBy: { id_motordet: "asc" },
      include: { parametro_variable: true },
    });
  }

  async findById(id) {
    return await this.prisma.motor_det.findUnique({
      where: { id_motordet: Number(id) },
      include: { parametro_variable: true },
    });
  }
}
