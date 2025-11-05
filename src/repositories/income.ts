import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";
import { income } from "../db/schema";

const createIncomeSchema = createInsertSchema(income);
export type CreateIncomeSchema = z.infer<typeof createIncomeSchema>;

const listIncomesSchema = createSelectSchema(income);
export type ListIncomesSchema = z.infer<typeof listIncomesSchema>;

export interface IncomeRepository {
  createIncome(income: CreateIncomeSchema, userTimezone?: string): Promise<ListIncomesSchema>;
  createIncomesBulk(
    incomes: CreateIncomeSchema[],
    userTimezone?: string
  ): Promise<ListIncomesSchema[]>;
  getIncomesByBalanceId(balanceId: string): Promise<ListIncomesSchema[]>;
  getIncomeById(id: string): Promise<ListIncomesSchema>;
  updateIncome(income: CreateIncomeSchema): Promise<ListIncomesSchema>;
  deleteIncome(id: string): Promise<void>;
}
