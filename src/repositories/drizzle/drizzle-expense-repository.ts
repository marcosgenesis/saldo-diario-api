import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { expense } from "../../db/schema";
import {
  CreateExpenseSchema,
  ExpenseRepository,
  ListExpensesSchema,
} from "../expense";

export class DrizzleExpenseRepository implements ExpenseRepository {
  async createExpense({
    amount,
    description,
    date,
    balanceId,
  }: CreateExpenseSchema): Promise<ListExpensesSchema> {
    const result = await db
      .insert(expense)
      .values({
        amount,
        description,
        balanceId,
        date: new Date(date),
      })
      .returning();
    return result[0];
  }
  async createExpensesBulk(
    expensesToCreate: CreateExpenseSchema[]
  ): Promise<ListExpensesSchema[]> {
    if (expensesToCreate.length === 0) return [];
    const normalized = expensesToCreate.map((e) => ({
      amount: e.amount,
      description: e.description,
      balanceId: e.balanceId,
      date: new Date(e.date as unknown as string | number | Date),
    }));
    const result = await db.insert(expense).values(normalized).returning();
    return result;
  }
  getExpensesByBalanceId(balanceId: string): Promise<ListExpensesSchema[]> {
    throw new Error("Method not implemented.");
  }
  getExpenseById(id: string): Promise<ListExpensesSchema> {
    throw new Error("Method not implemented.");
  }
  updateExpense(expense: CreateExpenseSchema): Promise<ListExpensesSchema> {
    throw new Error("Method not implemented.");
  }
  async deleteExpense(id: string): Promise<void> {
    await db.delete(expense).where(eq(expense.id, id));
  }
}
