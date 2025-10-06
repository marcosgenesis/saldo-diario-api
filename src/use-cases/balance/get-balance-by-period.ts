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
    endDate: Date,
    userTimezone?: string
  ): Promise<
    Array<
      SelectBalance & {
        dailyBalanceToday: number;
        totalRemainingUntilToday: number;
      }
    >
  > {
    // Processar datas recebidas do frontend (convertem qualquer formato para UTC, depois para timezone local)
    const timezone = userTimezone || getUserTimezone();
    const processedStartDate = processIncomingDate(startDate, timezone);
    const processedEndDate = processIncomingDate(endDate, timezone);

    const balances = await this.balanceRepository.findBalanceByPeriod(
      processedStartDate,
      processedEndDate
    );

    const today = startOfDayInTimezone(new Date(), timezone);

    const results = await Promise.all(
      balances.map(async (bal) => {
        const dailyRows: DailyBalanceRow[] =
          await this.balanceRepository.getDailyBalancesByPeriod(
            bal.startDate as unknown as Date,
            bal.endDate as unknown as Date,
            bal.id,
            timezone
          );
        const todayRow = dailyRows.find((row) =>
          isSameDayInTimezone(row.date as unknown as Date, today, timezone)
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
                timezone
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
                timezone
              )
          )
          .flatMap((row) => row.incomes)
          .reduce((acc, i) => acc + Number(i.amount), 0);

        const totalRemainingUntilToday =
          Number(bal.amount) + incomesUntilToday - expensesUntilToday;

        return {
          ...bal,
          startDate: processOutgoingDate(bal.startDate as unknown as Date, timezone), // Converter para UTC
          endDate: processOutgoingDate(bal.endDate as unknown as Date, timezone), // Converter para UTC
          dailyBalanceToday,
          totalRemainingUntilToday,
        };
      })
    );

    return results;
  }
}
