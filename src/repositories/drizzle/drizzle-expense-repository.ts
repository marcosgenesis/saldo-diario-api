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
    try {
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
    } catch (error) {
      console.log({ error });
    }
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
  deleteExpense(id: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
