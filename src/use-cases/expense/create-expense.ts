import {
  CreateExpenseSchema,
  ExpenseRepository,
  ListExpensesSchema,
} from "../../repositories/expense";

export class CreateExpenseUseCase {
  constructor(private expenseRepository: ExpenseRepository) {}

  async execute(expense: CreateExpenseSchema): Promise<ListExpensesSchema> {
    return this.expenseRepository.createExpense(expense);
  }
}

export class CreateExpensesBulkUseCase {
  constructor(private expenseRepository: ExpenseRepository) {}

  async execute(
    expenses: CreateExpenseSchema[]
  ): Promise<ListExpensesSchema[]> {
    return this.expenseRepository.createExpensesBulk(expenses);
  }
}
