import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { income } from "../db/schema";
const createIncomeSchema = createInsertSchema(income);
const listIncomesSchema = createSelectSchema(income);
