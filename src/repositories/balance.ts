import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";
import { balance } from "../db/schema";

export const createBalanceSchema = createInsertSchema(balance);
export type CreateBalanceSchema = z.infer<typeof createBalanceSchema>;

const selectBalance = createSelectSchema(balance);
export type SelectBalance = z.infer<typeof selectBalance>;

export interface DailyBalanceRowExpense {
  id: string;
  amount: number;
  description: string;
  date: Date;
  balanceId: string;
}

export interface DailyBalanceRowIncome {
  id: string;
  amount: number;
  description: string;
  date: Date;
  balanceId: string;
}

export interface DailyBalanceRow {
  balanceId: string;
  date: Date;
  baseBalance: number;
  previousDayLeftover: number;
  expenses: DailyBalanceRowExpense[];
  incomes: DailyBalanceRowIncome[];
  totalAvailable: number;
  remainingBalance: number;
}

export interface BalanceRepository {
  createBalance(balance: CreateBalanceSchema, userTimezone?: string): Promise<SelectBalance>;
  getBalanceById(id: string): Promise<SelectBalance | null>;
  getUserBalances(userId: string): Promise<SelectBalance[]>;
  updateBalance(
    balance: CreateBalanceSchema & { id: string }
  ): Promise<SelectBalance>;
  deleteBalance(id: string): Promise<void>;
  findBalanceByPeriod(startDate: Date, endDate: Date): Promise<SelectBalance[]>;
  getDailyBalancesByPeriod(
    startDate: Date,
    endDate: Date,
    balanceId: string,
    userTimezone?: string
  ): Promise<DailyBalanceRow[]>;
  getTodayBalance(userId: string): Promise<SelectBalance>;
}
