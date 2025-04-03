'use server'

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createBudgetApiClient, getTokenHeader } from "@/lib/fetch";
import type { paths } from "@/lib/budget-api/v1";

const AddTransactionsFormSchema = z.object({
  transactionsFile: z.instanceof(File)
});

export async function addTransactions(formData: FormData) {
  const client = createBudgetApiClient();

  const data = AddTransactionsFormSchema.parse(Object.fromEntries(formData));
  const file = data.transactionsFile;
  const apiForm = new FormData();
  apiForm.append('file', file);

  const response = await client.POST("/Transactions/upload", {
    body:  apiForm as unknown as paths["/Transactions/upload"]["post"]["requestBody"]["content"]["multipart/form-data"],
    headers: await getTokenHeader(),
  });

  if (!response.response.ok) {
    throw new Error(`Upload failed: ${response.response.statusText}`);
  }

  const result = response.data;
  console.log('json upload result', result);
  const jobId = result?.jobId;

  if (!jobId) throw new Error('No job ID returned from upload.');

  console.log(`Upload successful, job ID: ${jobId}`);

  // Polling mechanism to check job status
  let jobStatus = null;
  while (jobStatus !== 'Completed') {
    try {
      const jobResponse = await client.GET('/TransactionsFileJob/{id}', {
        params: {
          path: {
            id: jobId,
          }
        },
        headers: await getTokenHeader(),
      });

      if (!jobResponse.response.ok) {
        throw new Error(`Job status check failed: ${jobResponse.response.statusText}`);
      }

      jobStatus = jobResponse.data?.status;
      if (jobStatus === 'failed') {
        throw new Error('Job processing failed.');
      }

      if (jobStatus !== 'completed') {
        console.log(`Job status: ${jobStatus}, retrying in 2 seconds...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`Error checking job status: ${error}`);
      throw new Error('Error checking job status.');
    }
  }

  console.log('Job completed successfully.');

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
