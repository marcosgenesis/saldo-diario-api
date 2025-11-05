import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { DrizzleExpenseRepository } from "../../repositories/drizzle/drizzle-expense-repository";
import {
  CreateExpenseUseCase,
  CreateExpensesBulkUseCase,
} from "../../use-cases/expense/create-expense";
import { DeleteExpenseUseCase } from "../../use-cases/expense/delete-expense";
import { ApiResponseBuilder } from "../../utils";
import { asyncErrorHandler } from "../middleware/error-handler";

const createExpenseSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  date: z.date(),
  balanceId: z.uuid(),
});

export class ExpenseController {
  static createBalance = asyncErrorHandler(
    async (
      request: FastifyRequest<{ Body: z.infer<typeof createExpenseSchema> }>,
      reply: FastifyReply
    ) => {
      const { amount, description, date, balanceId } = request.body;

      const createExpenseUseCase = new CreateExpenseUseCase(
        new DrizzleExpenseRepository()
      );

      // Extrair timezone do header se disponível
      const userTimezone = request.headers["x-timezone"] as string;

      const expense = await createExpenseUseCase.execute({
        amount: amount.toString(),
        description,
        date,
        balanceId,
      }, userTimezone);
      return ApiResponseBuilder.success(
        reply,
        expense,
        "Despesa criada com sucesso",
        201
      );
    }
  );

  static createExpensesBulk = asyncErrorHandler(
    async (
      request: FastifyRequest<{
        Body: z.infer<typeof createExpenseSchema>[];
      }>,
      reply: FastifyReply
    ) => {
      const expenses = request.body;

      const useCase = new CreateExpensesBulkUseCase(
        new DrizzleExpenseRepository()
      );

      // Extrair timezone do header se disponível
      const userTimezone = request.headers["x-timezone"] as string;

      const created = await useCase.execute(
        expenses.map((e) => ({
          amount: e.amount.toString(),
          description: e.description,
          date: e.date,
          balanceId: e.balanceId,
        })),
        userTimezone
      );

      return ApiResponseBuilder.success(
        reply,
        created,
        "Despesas criadas com sucesso",
        201
      );
    }
  );

  static deleteExpense = asyncErrorHandler(
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;

      const deleteExpenseUseCase = new DeleteExpenseUseCase(
        new DrizzleExpenseRepository()
      );

      await deleteExpenseUseCase.execute(id);

      return ApiResponseBuilder.success(
        reply,
        null,
        "Despesa excluída com sucesso",
        200
      );
    }
  );
}
