import { createInsertSchema } from "drizzle-zod";
import { transactions } from "./schema";

export const insertTransactionSchema = createInsertSchema(transactions);