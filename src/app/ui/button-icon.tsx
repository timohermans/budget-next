import { ChevronRightIcon } from "@radix-ui/react-icons"

import { Button } from "@/components/ui/button"

type Props = {
    children: React.ReactNode
}

export function ButtonIcon({ children }: Props) {
    return (
        <Button variant="outline" size="icon">
            {children}
        </Button>
    )
}
