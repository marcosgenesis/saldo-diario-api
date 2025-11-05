import {
  CreateExpenseSchema,
  ExpenseRepository,
  ListExpensesSchema,
} from "../../repositories/expense";

export class CreateExpenseUseCase {
  constructor(private expenseRepository: ExpenseRepository) {}

  async execute(expense: CreateExpenseSchema, userTimezone?: string): Promise<ListExpensesSchema> {
    return this.expenseRepository.createExpense(expense, userTimezone);
  }
}

export class CreateExpensesBulkUseCase {
  constructor(private expenseRepository: ExpenseRepository) {}

  async execute(
    expenses: CreateExpenseSchema[],
    userTimezone?: string
  ): Promise<ListExpensesSchema[]> {
    return this.expenseRepository.createExpensesBulk(expenses, userTimezone);
  }
}
