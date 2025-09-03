import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { balance } from "../db/schema";
export const createBalanceSchema = createInsertSchema(balance);
const selectBalance = createSelectSchema(balance);
