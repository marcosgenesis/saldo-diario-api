import { isBefore } from "date-fns";
import { BadRequestError, NotFoundError } from "../../errors";
import {
  BalanceRepository,
  DailyBalanceRow,
  SelectBalance,
} from "../../repositories/balance";
import {
  getUserTimezone,
  isSameDayInTimezone,
  processOutgoingDate,
  startOfDayInTimezone,
} from "../../utils/date-utils";

export class GetTodayBalanceUseCase {
  constructor(private readonly balanceRepository: BalanceRepository) {}

  async execute(userId: string, userTimezone?: string): Promise<
    SelectBalance & {
      dailyBalanceToday: number;
      totalRemainingUntilToday: number;
    }
  > {
    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    const balance = await this.balanceRepository.getTodayBalance(userId);

    if (!balance) {
      throw new NotFoundError("Balance not found for today");
    }
    // Processar datas recebidas do frontend
    const timezone = userTimezone || getUserTimezone();
    const today = startOfDayInTimezone(new Date(), timezone);

    const dailyRows: DailyBalanceRow[] =
      await this.balanceRepository.getDailyBalancesByPeriod(
        balance.startDate as unknown as Date,
        balance.endDate as unknown as Date,
        balance.id,
        timezone
      );
    const todayRow = dailyRows.find((row) =>
      isSameDayInTimezone(row.date as unknown as Date, today, timezone)
    );
    const dailyBalanceToday = todayRow ? Number(todayRow.remainingBalance) : 0;

    const expensesUntilToday = dailyRows
      .filter(
        (row) =>
          isBefore(row.date as unknown as Date, today) ||
          isSameDayInTimezone(row.date as unknown as Date, today, timezone)
      )
      .flatMap((row) => row.expenses)
      .reduce((acc, e) => acc + Number(e.amount), 0);

    const incomesUntilToday = dailyRows
      .filter(
        (row) =>
          isBefore(row.date as unknown as Date, today) ||
          isSameDayInTimezone(row.date as unknown as Date, today, timezone)
      )
      .flatMap((row) => row.incomes)
      .reduce((acc, i) => acc + Number(i.amount), 0);

    const totalRemainingUntilToday =
      Number(balance.amount) + incomesUntilToday - expensesUntilToday;

    return {
      ...balance,
      startDate: processOutgoingDate(balance.startDate as unknown as Date, timezone), // Converter para timezone do usuário
      endDate: processOutgoingDate(balance.endDate as unknown as Date, timezone), // Converter para timezone do usuário
      dailyBalanceToday,
      totalRemainingUntilToday,
    };
  }
}
