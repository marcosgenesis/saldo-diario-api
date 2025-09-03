import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { DrizzleExpenseRepository } from "../../repositories/drizzle/drizzle-expense-repository";
import { CreateExpenseUseCase } from "../../use-cases/expense/create-expense";
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

      const expense = await createExpenseUseCase.execute({
        amount: amount.toString(),
        description,
        date,
        balanceId,
      });
      return ApiResponseBuilder.success(
        reply,
        expense,
        "Despesa criada com sucesso",
        201
      );
    }
  );
}
