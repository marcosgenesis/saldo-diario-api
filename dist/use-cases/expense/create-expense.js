export class CreateExpenseUseCase {
    expenseRepository;
    constructor(expenseRepository) {
        this.expenseRepository = expenseRepository;
    }
    async execute(expense) {
        return this.expenseRepository.createExpense(expense);
    }
}
