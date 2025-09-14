import { IncomeRepository } from "../../repositories/income";

export class DeleteIncomeUseCase {
  constructor(private incomeRepository: IncomeRepository) {}

  async execute(id: string): Promise<void> {
    return this.incomeRepository.deleteIncome(id);
  }
}
