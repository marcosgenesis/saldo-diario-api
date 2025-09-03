import { db } from "../../db/client";
import { income } from "../../db/schema";
export class DrizzleIncomeRepository {
    async createIncome({ amount, description, date, balanceId, }) {
        const result = await db
            .insert(income)
            .values({
            amount,
            description,
            balanceId,
            date: new Date(date),
        })
            .returning();
        return result[0];
    }
    getIncomesByBalanceId(balanceId) {
        throw new Error("Method not implemented.");
    }
    getIncomeById(id) {
        throw new Error("Method not implemented.");
    }
    updateIncome(_income) {
        throw new Error("Method not implemented.");
    }
    deleteIncome(_id) {
        throw new Error("Method not implemented.");
    }
}
