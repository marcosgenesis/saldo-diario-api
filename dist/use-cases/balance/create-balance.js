import { ValidationError } from "../../errors";
export class CreateBalanceUseCase {
    balanceRepository;
    constructor(balanceRepository) {
        this.balanceRepository = balanceRepository;
    }
    async execute(balance) {
        // Validações básicas
        if (balance.startDate >= balance.endDate) {
            throw new ValidationError("A data de início deve ser anterior à data de fim");
        }
        if (Number(balance.amount) <= 0) {
            throw new ValidationError("O valor deve ser maior que zero");
        }
        return this.balanceRepository.createBalance(balance);
    }
}
