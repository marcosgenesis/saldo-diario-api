import { FastifyInstance } from "fastify";
import { BalanceController } from "../controllers/balance.js";
import { authMiddleware } from "../middleware/auth.js";

export async function balanceRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", authMiddleware);

  // Rotas de saldo
  fastify.post("/api/balance", BalanceController.createBalance);
  fastify.get("/api/balance/find/period", BalanceController.getBalanceByPeriod);
  fastify.get("/api/balances", BalanceController.getUserBalances);
  fastify.get("/api/balances/:id", BalanceController.getBalanceById);
  fastify.put("/api/balance/:id", BalanceController.updateBalance);
  fastify.delete("/api/balances/:id", BalanceController.deleteBalance);

  // Saldos diários por período
  fastify.get(
    "/api/balance/daily/period",
    BalanceController.getDailyBalancesByPeriod
  );

  // Rotas de transações
  fastify.post("/api/expenses", BalanceController.createExpense);
  fastify.post("/api/incomes", BalanceController.createIncome);
  fastify.get(
    "/api/balances/:id/transactions",
    BalanceController.getBalanceWithTransactions
  );
}
