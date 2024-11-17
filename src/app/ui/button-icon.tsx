import { Button } from "@/components/ui/button"

type Props = {
  children: React.ReactNode
  onClick?: () => void;
}

export function ButtonIcon({ children, onClick }: Props) {
  return (
    <Button onClick={() => onClick && onClick()} variant="outline" size="icon">
      {children}
    </Button>
  )
}
