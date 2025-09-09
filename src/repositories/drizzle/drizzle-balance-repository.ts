import {
  addDays,
  differenceInDays,
  isSameDay,
  isWithinInterval,
} from "date-fns";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "../../db/client";
import { balance, expense, income } from "../../db/schema";
import {
  ConflictError,
  DatabaseError,
  NotFoundError,
} from "../../errors/app-error";
import {
  getUserTimezone,
  isSameDayInTimezone,
  processIncomingDate,
  processOutgoingDate,
  startOfDayInTimezone,
} from "../../utils/date-utils";
import {
  BalanceRepository,
  CreateBalanceSchema,
  DailyBalanceRow,
  SelectBalance,
} from "../balance";

export class DrizzleBalanceRepository implements BalanceRepository {
  async getTodayBalance(userId: string): Promise<SelectBalance> {
    const today = startOfDayInTimezone(new Date(), getUserTimezone());
    const findBalance = await db
      .select()
      .from(balance)
      .where(
        and(
          eq(balance.userId, userId),
          lte(balance.startDate, today),
          gte(balance.endDate, today)
        )
      )
      .orderBy(balance.startDate);
    return findBalance[0];
  }

  async createBalance({
    id,
    amount,
    startDate,
    endDate,
    userId,
  }: CreateBalanceSchema): Promise<SelectBalance> {
    // Processar datas recebidas do frontend (que já vêm em UTC)
    const processedStartDate = processIncomingDate(startDate);
    const processedEndDate = processIncomingDate(endDate);

    const findExistingBalance = await this.findBalanceByPeriod(
      processedStartDate,
      processedEndDate
    );
    console.log({ findExistingBalance: findExistingBalance.length });
    if (findExistingBalance.length > 0) {
      throw new ConflictError("Já existe um saldo para este período");
    }
    const newBalance = await db
      .insert(balance)
      .values({
        id,
        amount,
        startDate: processedStartDate,
        endDate: processedEndDate,
        userId,
      })
      .returning();
    return newBalance[0];
  }
  async findBalanceByPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<SelectBalance[]> {
    const findBalance = await db
      .select()
      .from(balance)
      .where(
        and(gte(balance.startDate, startDate), lte(balance.endDate, endDate))
      )
      .orderBy(balance.startDate);
    return findBalance;
  }
  async getBalanceById(id: string): Promise<SelectBalance | null> {
    try {
      const result = await db
        .select()
        .from(balance)
        .where(eq(balance.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      throw new DatabaseError(
        `Erro ao buscar saldo por ID: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );
    }
  }

  async getUserBalances(userId: string): Promise<SelectBalance[]> {
    try {
      return await db
        .select()
        .from(balance)
        .where(eq(balance.userId, userId))
        .orderBy(balance.startDate);
    } catch (error) {
      throw new DatabaseError(
        `Erro ao buscar saldos do usuário: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );
    }
  }

  async updateBalance(
    balanceData: CreateBalanceSchema & { id: string }
  ): Promise<SelectBalance> {
    try {
      const result = await db
        .update(balance)
        .set(balanceData)
        .where(eq(balance.id, balanceData.id))
        .returning();

      if (result.length === 0) {
        throw new NotFoundError("Saldo não encontrado para atualização");
      }

      return result[0];
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(
        `Erro ao atualizar saldo: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );
    }
  }

  async deleteBalance(id: string): Promise<void> {
    try {
      const result = await db
        .delete(balance)
        .where(eq(balance.id, id))
        .returning();

      if (result.length === 0) {
        throw new NotFoundError("Saldo não encontrado para exclusão");
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(
        `Erro ao deletar saldo: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );
    }
  }

  async getDailyBalancesByPeriod(
    startDate: Date,
    endDate: Date,
    balanceId: string
  ): Promise<DailyBalanceRow[]> {
    // Buscar saldos no período
    const balance = await this.getBalanceById(balanceId);

    if (!balance) return [];

    // Processar datas recebidas do frontend
    const processedStartDate = processIncomingDate(startDate);
    const processedEndDate = processIncomingDate(endDate);
    const userTimezone = getUserTimezone();

    // Para cada saldo, buscar suas transações e calcular os dias
    const results: DailyBalanceRow[] = [];

    const [expensesRows, incomesRows] = await Promise.all([
      db.select().from(expense).where(eq(expense.balanceId, balanceId)),
      db.select().from(income).where(eq(income.balanceId, balanceId)),
    ]);

    // Processar datas do saldo para o timezone local
    const balanceStartDate = processIncomingDate(
      balance.startDate as unknown as Date
    );
    const balanceEndDate = processIncomingDate(
      balance.endDate as unknown as Date
    );

    const start = startOfDayInTimezone(balanceStartDate, userTimezone);
    const end = startOfDayInTimezone(balanceEndDate, userTimezone);
    const totalDaysInclusive = Math.max(1, differenceInDays(end, start) + 1);

    const baseDailyBalance = Number(balance.amount) / totalDaysInclusive;

    // Construir lista de datas do período
    const allDates: Date[] = [];
    let currentDate = start;
    let currentEndDate = end;
    const today = startOfDayInTimezone(new Date(), userTimezone);
    console.log({ currentDate, currentEndDate });
    while (!isSameDay(currentDate, addDays(currentEndDate, 1))) {
      allDates.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }
    // Acumular saldo até o dia anterior ao primeiro exibido (aqui usamos todos)
    let accumulatedBalance = 0;
    for (const date of allDates) {
      const dayExpenses = expensesRows.filter((e) =>
        isSameDayInTimezone(e.date as unknown as Date, date, userTimezone)
      );
      const dayIncomes = incomesRows.filter((i) =>
        isSameDayInTimezone(i.date as unknown as Date, date, userTimezone)
      );

      const totalExpensesAmount = dayExpenses.reduce(
        (acc, e) => acc + Number(e.amount),
        0
      );
      const totalIncomesAmount = dayIncomes.reduce(
        (acc, i) => acc + Number(i.amount),
        0
      );
      const totalAvailable =
        baseDailyBalance + accumulatedBalance + totalIncomesAmount;
      const remaining = totalAvailable - totalExpensesAmount;

      results.push({
        balanceId: balance.id,
        date: processOutgoingDate(date), // Converter para UTC antes de retornar
        baseBalance: baseDailyBalance,
        previousDayLeftover: accumulatedBalance,
        expenses: dayExpenses.map((e) => ({
          id: e.id,
          amount: Number(e.amount),
          description: e.description,
          date: processOutgoingDate(e.date as unknown as Date), // Converter para UTC
          balanceId: e.balanceId,
        })),
        incomes: dayIncomes.map((i) => ({
          id: i.id,
          amount: Number(i.amount),
          description: i.description,
          date: processOutgoingDate(i.date as unknown as Date), // Converter para UTC
          balanceId: i.balanceId,
        })),
        totalAvailable,
        remainingBalance: remaining,
      });

      accumulatedBalance = remaining;
    }
    const filteredResults = results.filter(
      (result) =>
        isWithinInterval(result.date, {
          start: processedStartDate,
          end: processedEndDate,
        }) ||
        isSameDay(result.date, processedStartDate) ||
        isSameDay(result.date, processedEndDate)
    );

    return filteredResults;
  }
}
