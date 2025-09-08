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

  async execute(userId: string): Promise<
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
    const userTimezone = getUserTimezone();
    const today = startOfDayInTimezone(new Date(), userTimezone);

    const dailyRows: DailyBalanceRow[] =
      await this.balanceRepository.getDailyBalancesByPeriod(
        balance.startDate as unknown as Date,
        balance.endDate as unknown as Date,
        balance.id
      );
    const todayRow = dailyRows.find((row) =>
      isSameDayInTimezone(row.date as unknown as Date, today, userTimezone)
    );
    const dailyBalanceToday = todayRow ? Number(todayRow.remainingBalance) : 0;

    const expensesUntilToday = dailyRows
      .filter(
        (row) =>
          isBefore(row.date as unknown as Date, today) ||
          isSameDayInTimezone(row.date as unknown as Date, today, userTimezone)
      )
      .flatMap((row) => row.expenses)
      .reduce((acc, e) => acc + Number(e.amount), 0);

    const incomesUntilToday = dailyRows
      .filter(
        (row) =>
          isBefore(row.date as unknown as Date, today) ||
          isSameDayInTimezone(row.date as unknown as Date, today, userTimezone)
      )
      .flatMap((row) => row.incomes)
      .reduce((acc, i) => acc + Number(i.amount), 0);

    const totalRemainingUntilToday =
      Number(balance.amount) + incomesUntilToday - expensesUntilToday;

    return {
      ...balance,
      startDate: processOutgoingDate(balance.startDate as unknown as Date), // Converter para UTC
      endDate: processOutgoingDate(balance.endDate as unknown as Date), // Converter para UTC
      dailyBalanceToday,
      totalRemainingUntilToday,
    };

    return balance;
  }
}
