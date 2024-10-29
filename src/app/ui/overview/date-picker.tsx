'use client'

import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { ButtonIcon } from "@/app/ui/button-icon";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function DatePicker({ year, month }: { year: number, month: number }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const changeDate = (date: Date) => {
        const params = new URLSearchParams(searchParams);
        params.set('year', date.getFullYear().toString());
        params.set('month', (date.getMonth() + 1).toString());
        replace(`${pathname}?${params.toString()}`);
    }

    return (
        <>
            <ButtonIcon onClick={() => changeDate(new Date(year, month - 1, 1))}>
                <ChevronLeftIcon className="h-4 w-4" />
            </ButtonIcon>
            <div className="font-bold text-lg">
                {year}-{month + 1}
            </div>
            <ButtonIcon onClick={() => changeDate(new Date(year, month + 1, 1))}>
                <ChevronRightIcon className="h-4 w-4" />
            </ButtonIcon>
        </>
    );
}