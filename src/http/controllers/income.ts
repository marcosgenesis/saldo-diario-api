import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { DrizzleIncomeRepository } from "../../repositories/drizzle/drizzle-income-repository";
import {
  CreateIncomeUseCase,
  CreateIncomesBulkUseCase,
} from "../../use-cases/income/create-income";
import { DeleteIncomeUseCase } from "../../use-cases/income/delete-income";
import { ApiResponseBuilder } from "../../utils";
import { asyncErrorHandler } from "../middleware/error-handler";

const createIncomeSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  date: z.date(),
  balanceId: z.uuid(),
});

export class IncomeController {
  static createIncome = asyncErrorHandler(
    async (
      request: FastifyRequest<{ Body: z.infer<typeof createIncomeSchema> }>,
      reply: FastifyReply
    ) => {
      const { amount, description, date, balanceId } = request.body;

      const createIncomeUseCase = new CreateIncomeUseCase(
        new DrizzleIncomeRepository()
      );

      // Extrair timezone do header se disponível
      const userTimezone = request.headers["x-timezone"] as string;

      const income = await createIncomeUseCase.execute({
        amount: amount.toString(),
        description,
        date,
        balanceId,
      }, userTimezone);
      return ApiResponseBuilder.success(
        reply,
        income,
        "Receita criada com sucesso",
        201
      );
    }
  );

  static createIncomesBulk = asyncErrorHandler(
    async (
      request: FastifyRequest<{
        Body: z.infer<typeof createIncomeSchema>[];
      }>,
      reply: FastifyReply
    ) => {
      const incomes = request.body;

      const useCase = new CreateIncomesBulkUseCase(
        new DrizzleIncomeRepository()
      );

      // Extrair timezone do header se disponível
      const userTimezone = request.headers["x-timezone"] as string;

      const created = await useCase.execute(
        incomes.map((i) => ({
          amount: i.amount.toString(),
          description: i.description,
          date: i.date,
          balanceId: i.balanceId,
        })),
        userTimezone
      );

      return ApiResponseBuilder.success(
        reply,
        created,
        "Receitas criadas com sucesso",
        201
      );
    }
  );

  static deleteIncome = asyncErrorHandler(
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;

      const deleteIncomeUseCase = new DeleteIncomeUseCase(
        new DrizzleIncomeRepository()
      );

      await deleteIncomeUseCase.execute(id);

      return ApiResponseBuilder.success(
        reply,
        null,
        "Receita excluída com sucesso",
        200
      );
    }
  );
}
