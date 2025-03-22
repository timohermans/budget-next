'use server'

import { z } from "zod";
import { addTransactionsFrom } from "./use-cases";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { fetchWithToken } from "@/lib/fetch";

const AddTransactionsFormSchema = z.object({
  transactionsFile: z.instanceof(File)
});

export async function addTransactions(formData: FormData) {
  const data = AddTransactionsFormSchema.parse(Object.fromEntries(formData));
  const file = data.transactionsFile;
  const apiForm = new FormData();
  apiForm.append('file', file);

  const response = await fetchWithToken(`${process.env.API_URL}/transactions/upload`, {
    method: 'POST',
    headers: {
      // 'Content-Type': 'multipart/form-data',
    },
    body: apiForm,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const result = await response.json();

  console.log(result);

  // await addTransactionsFrom(data.transactionsFile);

  revalidatePath('/');
  redirect('/');
}

export async function markTransactionAsCashback(id: number, formData: FormData) {
  const isCashback = formData.get('isCashback');
  const date = formData.get('date')?.toString();

  await db
    .update(transactions)
    .set({ cashbackForDate: isCashback === 'on' ? date : null })
    .where(eq(transactions.id, id));

  revalidatePath('/');
}
