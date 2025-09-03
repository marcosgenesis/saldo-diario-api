import { db } from "../../db/client";
import { expense } from "../../db/schema";
export class DrizzleExpenseRepository {
    async createExpense({ amount, description, date, balanceId, }) {
        const result = await db
            .insert(expense)
            .values({
            amount,
            description,
            balanceId,
            date: new Date(date),
        })
            .returning();
        return result[0];
    }
    getExpensesByBalanceId(balanceId) {
        throw new Error("Method not implemented.");
    }
    getExpenseById(id) {
        throw new Error("Method not implemented.");
    }
    updateExpense(expense) {
        throw new Error("Method not implemented.");
    }
    deleteExpense(id) {
        throw new Error("Method not implemented.");
    }
}
