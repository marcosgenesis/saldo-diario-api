import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";
import { expense } from "../db/schema";

const createExpenseSchema = createInsertSchema(expense);
export type CreateExpenseSchema = z.infer<typeof createExpenseSchema>;

const listExpensesSchema = createSelectSchema(expense);
export type ListExpensesSchema = z.infer<typeof listExpensesSchema>;

export interface ExpenseRepository {
  createExpense(expense: CreateExpenseSchema, userTimezone?: string): Promise<ListExpensesSchema>;
  createExpensesBulk(
    expenses: CreateExpenseSchema[],
    userTimezone?: string
  ): Promise<ListExpensesSchema[]>;
  getExpensesByBalanceId(balanceId: string): Promise<ListExpensesSchema[]>;
  getExpenseById(id: string): Promise<ListExpensesSchema>;
  updateExpense(expense: CreateExpenseSchema): Promise<ListExpensesSchema>;
  deleteExpense(id: string): Promise<void>;
}
