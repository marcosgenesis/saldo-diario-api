export class CreateIncomeUseCase {
    incomeRepository;
    constructor(incomeRepository) {
        this.incomeRepository = incomeRepository;
    }
    async execute(income) {
        return this.incomeRepository.createIncome(income);
    }
}
