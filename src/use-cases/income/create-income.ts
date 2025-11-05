import {
  CreateIncomeSchema,
  IncomeRepository,
  ListIncomesSchema,
} from "../../repositories/income";

export class CreateIncomeUseCase {
  constructor(private incomeRepository: IncomeRepository) {}

  async execute(income: CreateIncomeSchema, userTimezone?: string): Promise<ListIncomesSchema> {
    return this.incomeRepository.createIncome(income, userTimezone);
  }
}

export class CreateIncomesBulkUseCase {
  constructor(private incomeRepository: IncomeRepository) {}

  async execute(incomes: CreateIncomeSchema[], userTimezone?: string): Promise<ListIncomesSchema[]> {
    return this.incomeRepository.createIncomesBulk(incomes, userTimezone);
  }
}
