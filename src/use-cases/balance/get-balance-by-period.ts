import { isBefore } from "date-fns";
import { z } from "zod";
import {
  BalanceRepository,
  DailyBalanceRow,
  SelectBalance,
} from "../../repositories/balance";
import {
  getUserTimezone,
  isSameDayInTimezone,
  processIncomingDate,
  processOutgoingDate,
  startOfDayInTimezone,
} from "../../utils/date-utils";

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
    // Processar datas recebidas do frontend
    const processedStartDate = processIncomingDate(startDate);
    const processedEndDate = processIncomingDate(endDate);
    const userTimezone = getUserTimezone();

    const balances = await this.balanceRepository.findBalanceByPeriod(
      processedStartDate,
      processedEndDate
    );

    const today = startOfDayInTimezone(new Date(), userTimezone);

    const results = await Promise.all(
      balances.map(async (bal) => {
        const dailyRows: DailyBalanceRow[] =
          await this.balanceRepository.getDailyBalancesByPeriod(
            bal.startDate as unknown as Date,
            bal.endDate as unknown as Date,
            bal.id
          );
        console.log({ startDate: bal.startDate, endDate: bal.endDate });
        const todayRow = dailyRows.find((row) =>
          isSameDayInTimezone(row.date as unknown as Date, today, userTimezone)
        );
        const dailyBalanceToday = todayRow
          ? Number(todayRow.remainingBalance)
          : 0;

        const expensesUntilToday = dailyRows
          .filter(
            (row) =>
              isBefore(row.date as unknown as Date, today) ||
              isSameDayInTimezone(
                row.date as unknown as Date,
                today,
                userTimezone
              )
          )
          .flatMap((row) => row.expenses)
          .reduce((acc, e) => acc + Number(e.amount), 0);

        const incomesUntilToday = dailyRows
          .filter(
            (row) =>
              isBefore(row.date as unknown as Date, today) ||
              isSameDayInTimezone(
                row.date as unknown as Date,
                today,
                userTimezone
              )
          )
          .flatMap((row) => row.incomes)
          .reduce((acc, i) => acc + Number(i.amount), 0);

        const totalRemainingUntilToday =
          Number(bal.amount) + incomesUntilToday - expensesUntilToday;

        return {
          ...bal,
          startDate: processOutgoingDate(bal.startDate as unknown as Date), // Converter para UTC
          endDate: processOutgoingDate(bal.endDate as unknown as Date), // Converter para UTC
          dailyBalanceToday,
          totalRemainingUntilToday,
        };
      })
    );

    return results;
  }
}
