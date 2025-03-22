'use client'

import { addTransactions } from "@/app/actions";
import { InputFile } from "@/app/ui/input-file";
import { Button } from "@/components/ui/button";
import { UploadIcon } from "@radix-ui/react-icons";
import { LoaderCircle } from "lucide-react";
import { useRef, useState } from "react";

export function UploadTransactionsForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    formRef.current?.requestSubmit();
  }

  return (
    <form action={addTransactions} ref={formRef}>
      <InputFile id="transactionsFile" icon={isLoading ? <LoaderCircle className="animate-spin" /> : <UploadIcon />} name="transactionsFile" label="Voeg nieuwe transacties toe" onChange={(e) => handleUpload(e)} />
      <Button type="submit" className="sr-only">
        Voeg toe
      </Button>
    </form>
  );
}
