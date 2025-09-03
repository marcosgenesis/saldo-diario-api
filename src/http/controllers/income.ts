import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { DrizzleIncomeRepository } from "../../repositories/drizzle/drizzle-income-repository";
import { CreateIncomeUseCase } from "../../use-cases/income/create-income";
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

      const income = await createIncomeUseCase.execute({
        amount: amount.toString(),
        description,
        date,
        balanceId,
      });
      return ApiResponseBuilder.success(
        reply,
        income,
        "Receita criada com sucesso",
        201
      );
    }
  );
}
