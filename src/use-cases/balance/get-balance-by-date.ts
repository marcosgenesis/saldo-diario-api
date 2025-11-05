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
  processIncomingDate,
  processOutgoingDate,
  startOfDayInTimezone,
  fromUTC,
} from "../../utils/date-utils";

export class GetBalanceByDateUseCase {
  constructor(private readonly balanceRepository: BalanceRepository) {}

  async execute(userId: string, userTimezone?: string, targetDate?: Date): Promise<
    SelectBalance & {
      dailyBalanceToday: number;
      totalRemainingUntilToday: number;
    }
  > {
    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    const timezone = userTimezone || getUserTimezone();
    
    // Se targetDate foi fornecido, interpretar como data no timezone do usuário
    // Quando vem da query string como string ISO, o Zod já converteu para Date (UTC)
    // Precisamos converter de UTC para o timezone do usuário e pegar o início do dia
    let target: Date;
    if (targetDate) {
      // Converter de UTC (vinda do Zod) para o timezone do usuário
      const dateInUserTimezone = fromUTC(targetDate, timezone);
      target = startOfDayInTimezone(dateInUserTimezone, timezone);
    } else {
      target = startOfDayInTimezone(new Date(), timezone);
    }
    
    const balance = await this.balanceRepository.getBalanceByDate(
      userId, 
      target, 
      timezone
    );

    if (!balance) {
      throw new NotFoundError("Balance not found for the specified date");
    }

    const dailyRows: DailyBalanceRow[] =
      await this.balanceRepository.getDailyBalancesByPeriod(
        balance.startDate as unknown as Date,
        balance.endDate as unknown as Date,
        balance.id,
        timezone
      );
    const targetRow = dailyRows.find((row) =>
      isSameDayInTimezone(row.date as unknown as Date, target, timezone)
    );
    const dailyBalanceToday = targetRow ? Number(targetRow.remainingBalance) : 0;

    const expensesUntilTarget = dailyRows
      .filter(
        (row) =>
          isBefore(row.date as unknown as Date, target) ||
          isSameDayInTimezone(row.date as unknown as Date, target, timezone)
      )
      .flatMap((row) => row.expenses)
      .reduce((acc, e) => acc + Number(e.amount), 0);

    const incomesUntilTarget = dailyRows
      .filter(
        (row) =>
          isBefore(row.date as unknown as Date, target) ||
          isSameDayInTimezone(row.date as unknown as Date, target, timezone)
      )
      .flatMap((row) => row.incomes)
      .reduce((acc, i) => acc + Number(i.amount), 0);

    const totalRemainingUntilToday =
      Number(balance.amount) + incomesUntilTarget - expensesUntilTarget;

    return {
      ...balance,
      startDate: processOutgoingDate(balance.startDate as unknown as Date, timezone), // Converter para timezone do usuário
      endDate: processOutgoingDate(balance.endDate as unknown as Date, timezone), // Converter para timezone do usuário
      dailyBalanceToday,
      totalRemainingUntilToday,
    };
  }
}
