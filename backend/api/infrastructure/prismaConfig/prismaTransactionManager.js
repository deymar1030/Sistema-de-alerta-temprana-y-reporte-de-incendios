import { TransactionManagerPort } from "../../application/shared/ports/transactionManager.port.js";

export default class PrismaTransactionManager extends TransactionManagerPort {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async runInTransaction(callback) {
    return await this.prisma.$transaction((tx) => callback(tx));
  }
}
