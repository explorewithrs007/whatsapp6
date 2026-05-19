import { cn } from "@/lib/utils";

type FilterChipsProps<TValue extends string> = {
  onChange: (value: TValue) => void;
  options: readonly TValue[];
  value: TValue;
};

export function FilterChips<TValue extends string>({ onChange, options, value }: FilterChipsProps<TValue>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option === value;

        return (
          <button
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp",
              active
                ? "border-whatsapp/30 bg-whatsapp-light text-whatsapp-dark"
                : "border-slate-200 bg-card text-slate-600 hover:bg-slate-50 hover:text-slate-800",
            )}
            key={option}
            onClick={() => onChange(option)}
            type="button"
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
