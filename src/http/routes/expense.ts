import { FastifyInstance } from "fastify";
import { ExpenseController } from "../controllers/expense.js";
import { authMiddleware } from "../middleware/auth.js";

export async function expenseRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", authMiddleware);
  // Rotas de transações
  fastify.post("/api/expense", ExpenseController.createBalance);
}
