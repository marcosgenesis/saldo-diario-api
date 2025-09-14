import { ExpenseRepository } from "../../repositories/expense";

export class DeleteExpenseUseCase {
  constructor(private expenseRepository: ExpenseRepository) {}

  async execute(id: string): Promise<void> {
    return this.expenseRepository.deleteExpense(id);
  }
}
