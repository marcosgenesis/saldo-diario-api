import { FastifyInstance } from "fastify";
import { balanceRoutes } from "./balance.js";
import { expenseRoutes } from "./expense.js";
import { incomeRoutes } from "./income.js";

export async function registerRoutes(fastify: FastifyInstance) {
  // Registrar todas as rotas
  await fastify.register(balanceRoutes);
  await fastify.register(expenseRoutes);
  await fastify.register(incomeRoutes);
}
