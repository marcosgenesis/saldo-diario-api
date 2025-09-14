import { FastifyInstance } from "fastify";
import { IncomeController } from "../controllers/income.js";
import { authMiddleware } from "../middleware/auth.js";

export async function incomeRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", authMiddleware);
  fastify.post("/api/income", IncomeController.createIncome);
  fastify.post("/api/incomes/bulk", IncomeController.createIncomesBulk);
  fastify.delete("/api/income/:id", IncomeController.deleteIncome);
}
