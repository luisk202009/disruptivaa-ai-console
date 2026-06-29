import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEAD_SERVICES } from "@/lib/leadServices";

interface ServiceMultiSelectProps {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

// Selector múltiple de servicios mediante chips toggleables.
const ServiceMultiSelect = ({ value, onChange, disabled }: ServiceMultiSelectProps) => {
  const toggle = (v: string) => {
    if (disabled) return;
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {LEAD_SERVICES.map((s) => {
        const active = value.includes(s.value);
        return (
          <button
            key={s.value}
            type="button"
            onClick={() => toggle(s.value)}
            disabled={disabled}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border transition-colors",
              active
                ? "bg-primary/15 text-primary border-primary/40"
                : "bg-background/40 text-muted-foreground border-border hover:bg-muted",
              disabled && "opacity-70 cursor-default",
            )}
          >
            {active && <Check size={12} />}
            {s.label}
          </button>
        );
      })}
    </div>
  );
};

export default ServiceMultiSelect;
