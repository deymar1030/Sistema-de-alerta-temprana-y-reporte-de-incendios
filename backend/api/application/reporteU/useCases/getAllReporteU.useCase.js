export default class GetAllReporteUUseCase {
  constructor(reporteURepository) {
    this.reporteURepository = reporteURepository;
  }

  async execute(filters) {
    return await this.reporteURepository.findAll(filters);
  }
}
