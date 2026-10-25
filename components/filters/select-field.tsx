import { cn } from "@/lib/utils";

interface SelectFieldProps {
  name: string;
  defaultValue?: string;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
}

/** Native <select> styled like <Input>; used inside the GET filter forms. */
export function SelectField({
  name,
  defaultValue,
  className,
  children,
  ...props
}: SelectFieldProps) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className={cn(
        "h-10 rounded-md border border-slate-200 bg-white px-2 text-sm text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
