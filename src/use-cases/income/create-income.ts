import {
  CreateIncomeSchema,
  IncomeRepository,
  ListIncomesSchema,
} from "../../repositories/income";

export class CreateIncomeUseCase {
  constructor(private incomeRepository: IncomeRepository) {}

  async execute(income: CreateIncomeSchema): Promise<ListIncomesSchema> {
    return this.incomeRepository.createIncome(income);
  }
}
