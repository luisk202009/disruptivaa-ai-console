import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRY_CODES } from "@/lib/countryCodes";

interface Props {
  value: string;
  onChange: (dial: string) => void;
  className?: string;
}

const CountryCodeSelector = ({ value, onChange, className }: Props) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? "w-[140px]"}>
        <SelectValue placeholder="País" />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {COUNTRY_CODES.map((c) => (
          <SelectItem key={c.code} value={c.dial}>
            <span className="flex items-center gap-2">
              <span>{c.flag}</span>
              <span>+{c.dial}</span>
              <span className="text-muted-foreground text-xs">{c.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CountryCodeSelector;
