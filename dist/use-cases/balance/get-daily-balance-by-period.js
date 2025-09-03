import z from "zod";
export const getDailyBalanceByPeriodSchema = z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    balanceId: z.string(),
});
export class GetDailyBalanceByPeriodUseCase {
    balanceRepository;
    constructor(balanceRepository) {
        this.balanceRepository = balanceRepository;
    }
    async execute(startDate, endDate, balanceId) {
        return this.balanceRepository.getDailyBalancesByPeriod(startDate, endDate, balanceId);
    }
}
