const PAGE_SIZE_DEFAULT = 50;

export default class GetAllLecturaUseCase {
  constructor(lecturaRepository) {
    this.lecturaRepository = lecturaRepository;
  }

  async execute(filters = {}) {
    const page = Math.max(1, Number(filters.page) || 1);
    const pageSize = Math.max(1, Number(filters.pageSize) || PAGE_SIZE_DEFAULT);

    const { items, total } = await this.lecturaRepository.findAll(filters, { page, pageSize });

    return { items, total, page, pageSize };
  }
}
