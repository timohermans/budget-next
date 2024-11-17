"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import clsx from "clsx";
import { buttonVariants } from "@/components/ui/button";

type Props = {
  id: string;
  name: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  onFileSelected?: () => void;
  onChange: () => void;
}

export function InputFile({ id, name, label, icon, onChange }: Props) {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label className={clsx('cursor-pointer', buttonVariants({ variant: "default", size: "default" }))} htmlFor={id}>{icon}{label}</Label>
      <Input className="sr-only" name={name} id={id} type="file" onChange={() => onChange()} />
    </div>
  )
}
