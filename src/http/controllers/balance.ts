import { eq, sum } from "drizzle-orm";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { db } from "../../db/client";
import { balance, expense, income } from "../../db/schema";
import { NotFoundError, UnauthorizedError } from "../../errors/app-error";
import { DrizzleBalanceRepository } from "../../repositories/drizzle/drizzle-balance-repository";
import { CreateBalanceUseCase } from "../../use-cases/balance/create-balance";
import {
  getBalanceByPeriodSchema,
  GetBalanceByPeriodUseCase,
} from "../../use-cases/balance/get-balance-by-period";
import {
  getDailyBalanceByPeriodSchema,
  GetDailyBalanceByPeriodUseCase,
} from "../../use-cases/balance/get-daily-balance-by-period";
import { GetTodayBalanceUseCase } from "../../use-cases/balance/get-today-balance";
import { ApiResponseBuilder } from "../../utils/api-response";
import { asyncErrorHandler } from "../middleware/error-handler";

const createBalanceSchema = z.object({
  amount: z.number().positive(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

const createExpenseSchema = z.object({
  amount: z.number().int().positive(),
  description: z.string().min(1),
  date: z.date(),
  balanceId: z.uuid(),
});

const createIncomeSchema = z.object({
  amount: z.number().int().positive(),
  description: z.string().min(1),
  date: z.date(),
  balanceId: z.uuid(),
});

const updateBalanceSchema = z.object();

export class BalanceController {
  // Criar novo saldo
  static createBalance = asyncErrorHandler(
    async (
      request: FastifyRequest<{ Body: z.infer<typeof createBalanceSchema> }>,
      reply: FastifyReply
    ) => {
      const { amount, endDate, startDate } = createBalanceSchema.parse(
        request.body
      );

      // Usar o usuário autenticado do middleware
      if (!request.user) {
        throw new UnauthorizedError("Usuário não está logado");
      }

      const createBalanceUseCase = new CreateBalanceUseCase(
        new DrizzleBalanceRepository()
      );

      // Extrair timezone do header se disponível
      const userTimezone = request.headers["x-timezone"] as string;

      const response = await createBalanceUseCase.execute(
        {
          amount: amount.toString(),
          startDate: startDate,
          endDate: endDate,
          userId: request.user.id,
        },
        userTimezone
      );

      return ApiResponseBuilder.success(
        reply,
        response,
        "Saldo criado com sucesso",
        201
      );
    }
  );

  static getTodayBalance = asyncErrorHandler(
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Usar o usuário autenticado do middleware
      if (!request.user) {
        throw new UnauthorizedError("Usuário não está logado");
      }

      const getTodayBalanceUseCase = new GetTodayBalanceUseCase(
        new DrizzleBalanceRepository()
      );

      // Extrair timezone do header se disponível
      const userTimezone = request.headers["x-timezone"] as string;

      const response = await getTodayBalanceUseCase.execute(request.user.id, userTimezone);

      return ApiResponseBuilder.success(reply, response);
    }
  );

  static getBalanceByPeriod = asyncErrorHandler(
    async (
      request: FastifyRequest<{
        Querystring: z.infer<typeof getBalanceByPeriodSchema>;
      }>,
      reply: FastifyReply
    ) => {
      const { startDate, endDate } = getBalanceByPeriodSchema.parse(
        request.query
      );

      // Usar o usuário autenticado do middleware
      if (!request.user) {
        throw new UnauthorizedError("Usuário não está logado");
      }
      const getBalanceByPeriodUseCase = new GetBalanceByPeriodUseCase(
        new DrizzleBalanceRepository()
      );

      // Extrair timezone do header se disponível
      const userTimezone = request.headers["x-timezone"] as string;

      const response = await getBalanceByPeriodUseCase.execute(
        startDate,
        endDate,
        userTimezone
      );
      return ApiResponseBuilder.success(
        reply,
        response,
        "Saldo encontrado com sucesso",
        200
      );
    }
  );

  static getDailyBalancesByPeriod = asyncErrorHandler(
    async (
      request: FastifyRequest<{
        Querystring: z.infer<typeof getDailyBalanceByPeriodSchema>;
      }>,
      reply: FastifyReply
    ) => {
      const { startDate, endDate, balanceId } =
        getDailyBalanceByPeriodSchema.parse(request.query);

      if (!request.user) {
        throw new UnauthorizedError("Usuário não está logado");
      }

      const getDailyBalanceByPeriodUseCase = new GetDailyBalanceByPeriodUseCase(
        new DrizzleBalanceRepository()
      );

      // Extrair timezone do header se disponível
      const userTimezone = request.headers["x-timezone"] as string;

      const response = await getDailyBalanceByPeriodUseCase.execute(
        startDate,
        endDate,
        balanceId,
        userTimezone
      );

      return ApiResponseBuilder.success(
        reply,
        response,
        "Saldos diários calculados com sucesso",
        200
      );
    }
  );

  // Buscar saldo por ID
  static getBalanceById = asyncErrorHandler(
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;

      const balanceData = await db
        .select()
        .from(balance)
        .where(eq(balance.id, id))
        .limit(1);

      if (balanceData.length === 0) {
        throw new NotFoundError("Saldo não encontrado");
      }

      return ApiResponseBuilder.success(reply, balanceData[0]);
    }
  );

  // Listar todos os saldos do usuário
  static getUserBalances = asyncErrorHandler(
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Usar o usuário autenticado do middleware
      if (!request.user) {
        throw new UnauthorizedError("Usuário não está logado");
      }

      const balances = await db
        .select()
        .from(balance)
        .where(eq(balance.userId, request.user.id))
        .orderBy(balance.startDate);

      // Para cada balance, buscar a soma dos valores de incomes e expenses
      const balancesWithSums = await Promise.all(
        balances.map(async (balanceItem) => {
          const [incomeSum, expenseSum] = await Promise.all([
            db
              .select({ total: sum(income.amount) })
              .from(income)
              .where(eq(income.balanceId, balanceItem.id)),
            db
              .select({ total: sum(expense.amount) })
              .from(expense)
              .where(eq(expense.balanceId, balanceItem.id)),
          ]);

          return {
            ...balanceItem,
            totalIncomes: Number(incomeSum[0]?.total) || 0,
            totalExpenses: Number(expenseSum[0]?.total) || 0,
          };
        })
      );

      return ApiResponseBuilder.success(reply, balancesWithSums);
    }
  );

  // Atualizar saldo
  static updateBalance = asyncErrorHandler(
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: z.infer<typeof updateBalanceSchema>;
      }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const updateData = updateBalanceSchema.parse(request.body);

      const updatedBalance = await db
        .update(balance)
        .set({
          ...updateData,
          startDate: updateData.startDate
            ? new Date(updateData.startDate)
            : undefined,
          endDate: updateData.endDate
            ? new Date(updateData.endDate)
            : undefined,
        })
        .where(eq(balance.id, id))
        .returning();

      if (updatedBalance.length === 0) {
        throw new NotFoundError("Saldo não encontrado");
      }

      return ApiResponseBuilder.success(
        reply,
        updatedBalance[0],
        "Saldo atualizado com sucesso"
      );
    }
  );

  // Deletar saldo
  static deleteBalance = asyncErrorHandler(
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;

      const deletedBalance = await db
        .delete(balance)
        .where(eq(balance.id, id))
        .returning();

      if (deletedBalance.length === 0) {
        throw new NotFoundError("Saldo não encontrado");
      }

      return reply.status(204).send();
    }
  );
}
