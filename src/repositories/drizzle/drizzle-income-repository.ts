import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { income } from "../../db/schema";
import {
  CreateIncomeSchema,
  IncomeRepository,
  ListIncomesSchema,
} from "../income";
import { getUserTimezone, processIncomingDate } from "../../utils/date-utils";

export class DrizzleIncomeRepository implements IncomeRepository {
  async createIncome({
    amount,
    description,
    date,
    balanceId,
  }: CreateIncomeSchema, userTimezone?: string): Promise<ListIncomesSchema> {
    const timezone = userTimezone || getUserTimezone();
    // Converter data do timezone do usuário para UTC antes de salvar
    const utcDate = processIncomingDate(date, timezone);
    
    const result = await db
      .insert(income)
      .values({
        amount,
        description,
        balanceId,
        date: utcDate,
      })
      .returning();
    return result[0];
  }

  async createIncomesBulk(
    incomesToCreate: CreateIncomeSchema[],
    userTimezone?: string
  ): Promise<ListIncomesSchema[]> {
    if (incomesToCreate.length === 0) return [];
    const timezone = userTimezone || getUserTimezone();
    const normalized = incomesToCreate.map((i) => ({
      amount: i.amount,
      description: i.description,
      balanceId: i.balanceId,
      // Converter data do timezone do usuário para UTC antes de salvar
      date: processIncomingDate(i.date as unknown as string | number | Date, timezone),
    }));
    const result = await db.insert(income).values(normalized).returning();
    return result;
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

  async deleteIncome(id: string): Promise<void> {
    await db.delete(income).where(eq(income.id, id));
  }
}
