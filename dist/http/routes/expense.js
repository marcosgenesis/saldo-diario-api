import { ExpenseController } from "../controllers/expense.js";
import { authMiddleware } from "../middleware/auth.js";
export async function expenseRoutes(fastify) {
    fastify.addHook("preHandler", authMiddleware);
    // Rotas de transações
    fastify.post("/api/expense", ExpenseController.createBalance);
}
