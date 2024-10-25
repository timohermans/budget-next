import { getIbans } from "@/app/use-cases";
import { IbanCommand } from "./iban-command";

export async function IbanCommandWrapper() {
    const ibans = await getIbans();

    // todo: add suspense here
    return (
        <IbanCommand ibans={ibans} />
    )
}