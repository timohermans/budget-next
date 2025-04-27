"use client"

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../data-table";
import { Badge } from "@/components/ui/badge";
import { RepeatIcon } from "lucide-react";
import { ChangeEventHandler, useRef } from "react";
import { markTransactionAsCashback } from "@/app/actions";
import { Transaction } from "@/lib/models";

const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "week",
    header: "Wk"
  },
  {
    accessorKey: "dateTransaction",
    header: "Datum",
    cell: ({row}) => {
      const date = row.original.dateTransaction;
      return `${date.getDate()}-${date.getMonth() + 1}`;
    }
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
    accessorKey: "isFixed",
    header: "Vast",
    cell: ({ row }) => {
      const authorizationCode = row.getValue('isFixed');
      if (!!authorizationCode) {
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
      const transaction: Transaction = row.original;

      if (transaction.amount < 0 || !transaction.isFromOtherParty) {
        return null;
      }

      return <CashbackForm transaction={transaction} />;
    },
  }
];

function CashbackForm({ transaction }: { transaction: Transaction }) {
  const ref: React.ForwardedRef<HTMLFormElement> = useRef(null);
  const markCashbackWithId = markTransactionAsCashback.bind(null, transaction.id);

  const handleCheck: ChangeEventHandler<HTMLInputElement> = () => {
    ref.current?.requestSubmit();
  }

  return (
    <form action={markCashbackWithId} className="text-center" ref={ref}>
      <input name="date" type="hidden" value={transaction.dateTransaction.toISOString()} />
      <input name="isCashback" type="checkbox" onChange={handleCheck} defaultChecked={transaction.cashbackForDate != null} />
    </form>
  )
}

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <DataTable columns={columns} data={transactions} />
  )
}
