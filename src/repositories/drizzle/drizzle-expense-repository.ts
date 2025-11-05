import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { expense } from "../../db/schema";
import {
  CreateExpenseSchema,
  ExpenseRepository,
  ListExpensesSchema,
} from "../expense";
import { getUserTimezone, processIncomingDate } from "../../utils/date-utils";

export class DrizzleExpenseRepository implements ExpenseRepository {
  async createExpense({
    amount,
    description,
    date,
    balanceId,
  }: CreateExpenseSchema, userTimezone?: string): Promise<ListExpensesSchema> {
    const timezone = userTimezone || getUserTimezone();
    // Converter data do timezone do usuário para UTC antes de salvar
    const utcDate = processIncomingDate(date, timezone);
    
    const result = await db
      .insert(expense)
      .values({
        amount,
        description,
        balanceId,
        date: utcDate,
      })
      .returning();
    return result[0];
  }
  async createExpensesBulk(
    expensesToCreate: CreateExpenseSchema[],
    userTimezone?: string
  ): Promise<ListExpensesSchema[]> {
    if (expensesToCreate.length === 0) return [];
    const timezone = userTimezone || getUserTimezone();
    const normalized = expensesToCreate.map((e) => ({
      amount: e.amount,
      description: e.description,
      balanceId: e.balanceId,
      // Converter data do timezone do usuário para UTC antes de salvar
      date: processIncomingDate(e.date as unknown as string | number | Date, timezone),
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
