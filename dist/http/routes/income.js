import { IncomeController } from "../controllers/income.js";
import { authMiddleware } from "../middleware/auth.js";
export async function incomeRoutes(fastify) {
    fastify.addHook("preHandler", authMiddleware);
    fastify.post("/api/income", IncomeController.createIncome);
}
