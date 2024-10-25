'use client'

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Combobox } from "../combobox";

type Props = {
    ibans: string[];
}

export function IbanCommand({ ibans }: Props) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { replace } = useRouter();
    const iban = searchParams.get('iban');

    const handleOnChange = (value: string) => {
        const newParams = new URLSearchParams(searchParams);

        newParams.set('iban', value);

        replace(`${pathname}?${newParams.toString()}`);
    };

    return (
        <Combobox placeholder="Kies rekening" initialValue={iban ?? ibans[0]} items={ibans.map(iban => ({ label: iban, value: iban }))} onChange={handleOnChange} />
    );
}