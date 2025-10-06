import z from "zod";
import { BalanceRepository, DailyBalanceRow } from "../../repositories/balance";

export const getDailyBalanceByPeriodSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  balanceId: z.string(),
});

export class GetDailyBalanceByPeriodUseCase {
  constructor(private readonly balanceRepository: BalanceRepository) {}

  async execute(
    startDate: Date,
    endDate: Date,
    balanceId: string,
    userTimezone?: string
  ): Promise<DailyBalanceRow[]> {
    return this.balanceRepository.getDailyBalancesByPeriod(
      startDate,
      endDate,
      balanceId,
      userTimezone
    );
  }
}
