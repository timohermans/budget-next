'use client'

import { addTransactions } from "@/app/actions";
import { InputFile } from "@/app/ui/input-file";
import { Button } from "@/components/ui/button";
import { UploadIcon } from "@radix-ui/react-icons";
import { useRef } from "react";

export function UploadTransactionsForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={addTransactions} ref={formRef}>
      <InputFile id="transactionsFile" icon={<UploadIcon />} name="transactionsFile" label="Voeg nieuwe transacties toe" onChange={() => formRef.current?.requestSubmit()} />
      <Button type="submit" className="sr-only">Voeg toe</Button>
    </form>
  );
}
