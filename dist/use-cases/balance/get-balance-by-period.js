import { isBefore, isSameDay, startOfDay } from "date-fns";
import { z } from "zod";
export const getBalanceByPeriodSchema = z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
});
export class GetBalanceByPeriodUseCase {
    balanceRepository;
    constructor(balanceRepository) {
        this.balanceRepository = balanceRepository;
    }
    async execute(startDate, endDate) {
        const balances = await this.balanceRepository.findBalanceByPeriod(startDate, endDate);
        const today = startOfDay(new Date());
        const results = await Promise.all(balances.map(async (bal) => {
            const dailyRows = await this.balanceRepository.getDailyBalancesByPeriod(new Date(bal.startDate), new Date(bal.endDate), bal.id);
            const todayRow = dailyRows.find((row) => isSameDay(row.date, today));
            const dailyBalanceToday = todayRow
                ? Number(todayRow.remainingBalance)
                : 0;
            const expensesUntilToday = dailyRows
                .filter((row) => isBefore(row.date, today) ||
                isSameDay(row.date, today))
                .flatMap((row) => row.expenses)
                .reduce((acc, e) => acc + Number(e.amount), 0);
            const incomesUntilToday = dailyRows
                .filter((row) => isBefore(row.date, today) ||
                isSameDay(row.date, today))
                .flatMap((row) => row.incomes)
                .reduce((acc, i) => acc + Number(i.amount), 0);
            const totalRemainingUntilToday = Number(bal.amount) + incomesUntilToday - expensesUntilToday;
            return {
                ...bal,
                dailyBalanceToday,
                totalRemainingUntilToday,
            };
        }));
        return results;
    }
}
