'use server'

import { z } from "zod";
import { addTransactionsFrom } from "./use-cases";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const AddTransactionsFormSchema = z.object({
    transactionsFile: z.instanceof(File)
});

export async function addTransactions(formData: FormData) {
    console.log(formData);
    const data = AddTransactionsFormSchema.parse(Object.fromEntries(formData));

    await addTransactionsFrom(data.transactionsFile);

    revalidatePath('/');
    redirect('/');
}