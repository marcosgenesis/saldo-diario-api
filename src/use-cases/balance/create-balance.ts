import { ValidationError } from "../../errors";
import {
  BalanceRepository,
  CreateBalanceSchema,
  SelectBalance,
} from "../../repositories/balance";

export class CreateBalanceUseCase {
  constructor(private readonly balanceRepository: BalanceRepository) {}

  async execute(balance: CreateBalanceSchema): Promise<SelectBalance> {
    // Validações básicas
    if (balance.startDate >= balance.endDate) {
      throw new ValidationError(
        "A data de início deve ser anterior à data de fim"
      );
    }

    if (balance.amount <= 0) {
      throw new ValidationError("O valor deve ser maior que zero");
    }

    return this.balanceRepository.createBalance(balance);
  }
}
