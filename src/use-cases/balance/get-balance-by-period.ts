import { isBefore, isSameDay, startOfDay } from "date-fns";
import { z } from "zod";
import {
  BalanceRepository,
  DailyBalanceRow,
  SelectBalance,
} from "../../repositories/balance";

export const getBalanceByPeriodSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export class GetBalanceByPeriodUseCase {
  constructor(private readonly balanceRepository: BalanceRepository) {}

  async execute(
    startDate: Date,
    endDate: Date
  ): Promise<
    Array<
      SelectBalance & {
        dailyBalanceToday: number;
        totalRemainingUntilToday: number;
      }
    >
  > {
    const balances = await this.balanceRepository.findBalanceByPeriod(
      startDate,
      endDate
    );

    const today = startOfDay(new Date());

    const results = await Promise.all(
      balances.map(async (bal) => {
        const dailyRows: DailyBalanceRow[] =
          await this.balanceRepository.getDailyBalancesByPeriod(
            new Date(bal.startDate as unknown as Date),
            new Date(bal.endDate as unknown as Date),
            bal.id
          );

        const todayRow = dailyRows.find((row) =>
          isSameDay(row.date as unknown as Date, today)
        );
        const dailyBalanceToday = todayRow
          ? Number(todayRow.remainingBalance)
          : 0;

        const expensesUntilToday = dailyRows
          .filter(
            (row) =>
              isBefore(row.date as unknown as Date, today) ||
              isSameDay(row.date as unknown as Date, today)
          )
          .flatMap((row) => row.expenses)
          .reduce((acc, e) => acc + Number(e.amount), 0);

        const incomesUntilToday = dailyRows
          .filter(
            (row) =>
              isBefore(row.date as unknown as Date, today) ||
              isSameDay(row.date as unknown as Date, today)
          )
          .flatMap((row) => row.incomes)
          .reduce((acc, i) => acc + Number(i.amount), 0);

        const totalRemainingUntilToday =
          Number(bal.amount) + incomesUntilToday - expensesUntilToday;

        return {
          ...bal,
          dailyBalanceToday,
          totalRemainingUntilToday,
        };
      })
    );

    return results;
  }
}
