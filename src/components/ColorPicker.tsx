import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  '#FF7900', // Naranja (default)
  '#10B981', // Verde esmeralda
  '#3B82F6', // Azul
  '#8B5CF6', // Violeta
  '#EC4899', // Rosa
  '#F59E0B', // Ámbar
  '#EF4444', // Rojo
  '#6B7280', // Gris
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export const ColorPicker = ({ value, onChange }: ColorPickerProps) => (
  <div className="flex flex-wrap gap-2">
    {PRESET_COLORS.map((color) => (
      <button
        key={color}
        type="button"
        onClick={() => onChange(color)}
        className={cn(
          "w-8 h-8 rounded-full border-2 transition-all",
          value === color 
            ? "border-white scale-110" 
            : "border-transparent hover:border-zinc-500"
        )}
        style={{ backgroundColor: color }}
      />
    ))}
  </div>
);
