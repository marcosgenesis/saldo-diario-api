import { and, eq, gte, lte } from "drizzle-orm";
import { FastifyReply, FastifyRequest } from "fastify";
import { nanoid } from "nanoid";
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

      console.log({ amount, startDate, endDate, userId: request.user.id });
      const response = await createBalanceUseCase.execute({
        amount,
        startDate: startDate,
        endDate: endDate,
        userId: request.user.id,
      });

      return ApiResponseBuilder.success(
        reply,
        response,
        "Saldo criado com sucesso",
        201
      );
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

      const response = await getBalanceByPeriodUseCase.execute(
        startDate,
        endDate
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
      const response = await getDailyBalanceByPeriodUseCase.execute(
        startDate,
        endDate,
        balanceId
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

      return ApiResponseBuilder.success(reply, balances);
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

  // Criar despesa
  static createExpense = asyncErrorHandler(
    async (
      request: FastifyRequest<{ Body: z.infer<typeof createExpenseSchema> }>,
      reply: FastifyReply
    ) => {
      const { amount, description, date, balanceId } =
        createExpenseSchema.parse(request.body);

      const newExpense = await db
        .insert(expense)
        .values({
          id: nanoid(),
          amount,
          description,
          date: new Date(date),
          balanceId,
        })
        .returning();

      return ApiResponseBuilder.success(
        reply,
        newExpense[0],
        "Despesa criada com sucesso",
        201
      );
    }
  );

  // Criar receita
  static createIncome = asyncErrorHandler(
    async (
      request: FastifyRequest<{ Body: z.infer<typeof createIncomeSchema> }>,
      reply: FastifyReply
    ) => {
      const { amount, description, date, balanceId } = createIncomeSchema.parse(
        request.body
      );

      const newIncome = await db
        .insert(income)
        .values({
          id: nanoid(),
          amount,
          description,
          date: new Date(date),
          balanceId,
        })
        .returning();

      return ApiResponseBuilder.success(
        reply,
        newIncome[0],
        "Receita criada com sucesso",
        201
      );
    }
  );

  // Buscar saldo com despesas e receitas por período
  static getBalanceWithTransactions = asyncErrorHandler(
    async (
      request: FastifyRequest<{
        Querystring: {
          startDate?: string;
          endDate?: string;
          balanceId?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      const { startDate, endDate, balanceId } = request.query;

      let whereClause = undefined;

      if (balanceId) {
        whereClause = eq(balance.id, balanceId);
      } else if (startDate && endDate) {
        whereClause = and(
          gte(balance.startDate, new Date(startDate)),
          lte(balance.endDate, new Date(endDate))
        );
      }

      const balances = await db
        .select()
        .from(balance)
        .where(whereClause)
        .orderBy(balance.startDate);

      // Buscar despesas e receitas para cada saldo
      const balancesWithTransactions = await Promise.all(
        balances.map(async (bal) => {
          const expenses = await db
            .select()
            .from(expense)
            .where(eq(expense.balanceId, bal.id));

          const incomes = await db
            .select()
            .from(income)
            .where(eq(income.balanceId, bal.id));

          return {
            ...bal,
            expenses,
            incomes,
          };
        })
      );

      return ApiResponseBuilder.success(reply, balancesWithTransactions);
    }
  );
}
