import { db } from "../../db/client";
import { income } from "../../db/schema";
import {
  CreateIncomeSchema,
  IncomeRepository,
  ListIncomesSchema,
} from "../income";

export class DrizzleIncomeRepository implements IncomeRepository {
  async createIncome({
    amount,
    description,
    date,
    balanceId,
  }: CreateIncomeSchema): Promise<ListIncomesSchema> {
    const result = await db
      .insert(income)
      .values({
        amount,
        description,
        balanceId,
        date: new Date(date),
      })
      .returning();
    return result[0];
  }

  getIncomesByBalanceId(balanceId: string): Promise<ListIncomesSchema[]> {
    throw new Error("Method not implemented.");
  }

  getIncomeById(id: string): Promise<ListIncomesSchema> {
    throw new Error("Method not implemented.");
  }

  updateIncome(_income: CreateIncomeSchema): Promise<ListIncomesSchema> {
    throw new Error("Method not implemented.");
  }

  deleteIncome(_id: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
