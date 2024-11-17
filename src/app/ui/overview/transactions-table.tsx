"use client"

import { TransactionGet } from "@/app/use-cases";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../data-table";
import { Badge } from "@/components/ui/badge";
import { RepeatIcon } from "lucide-react";
import { ChangeEventHandler, useRef } from "react";
import { markTransactionAsCashback } from "@/app/actions";

const columns: ColumnDef<TransactionGet>[] = [
  {
    accessorKey: "week",
    header: "Wk"
  },
  {
    accessorKey: "dateTransaction",
    header: "Datum"
  },
  {
    accessorKey: "nameOtherParty",
    header: "Naam"
  },
  {
    accessorKey: "amount",
    header: "Bedrag",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("nl-NL", {
        style: "currency",
        currency: "EUR",
      }).format(amount);

      return <div className="text-right font-medium">
        <Badge variant={amount < 0 ? 'outline' : 'success'}>{formatted}</Badge>
      </div>
    }
  },
  {
    accessorKey: "authorizationCode",
    header: "Vast",
    cell: ({ row }) => {
      const authorizationCode = row.getValue('authorizationCode');
      if (authorizationCode != null && authorizationCode !== '') {
        return <RepeatIcon className="h-4 w-4" />
      }

      return null;
    }
  },
  {
    accessorKey: "description",
    header: "Omschrijving",
  },
  {
    id: "actions",
    header: "Terugbetaling",
    cell: ({ row }) => {
      const transaction: TransactionGet = row.original;

      if (parseFloat(transaction.amount) < 0 || !transaction.isFromOtherParty) {
        return null;
      }

      return <CashbackForm transaction={transaction} />;
    },
  }
];

function CashbackForm({ transaction }: { transaction: TransactionGet }) {
  const ref: React.ForwardedRef<HTMLFormElement> = useRef(null);
  const markCashbackWithId = markTransactionAsCashback.bind(null, transaction.id);

  const handleCheck: ChangeEventHandler<HTMLInputElement> = () => {
    ref.current?.requestSubmit();
  }

  return (
    <form action={markCashbackWithId} className="text-center" ref={ref}>
      <input name="date" type="hidden" value={transaction.dateTransaction} />
      <input name="isCashback" type="checkbox" onChange={handleCheck} defaultChecked={transaction.cashbackForDate != null} />
    </form>
  )
}

export function TransactionsTable({ transactions }: { transactions: TransactionGet[] }) {
  return (
    <DataTable columns={columns} data={transactions} />
  )
}
