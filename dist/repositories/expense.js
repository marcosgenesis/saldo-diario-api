import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { expense } from "../db/schema";
const createExpenseSchema = createInsertSchema(expense);
const listExpensesSchema = createSelectSchema(expense);
