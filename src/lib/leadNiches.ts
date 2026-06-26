// Catálogo de nichos para clasificar leads.
export interface LeadNiche {
  value: string;
  label: string;
  emoji: string;
}

export const LEAD_NICHES: LeadNiche[] = [
  { value: "extranjeria", label: "Despacho de extranjería", emoji: "⚖️" },
  { value: "mercantil", label: "Despacho mercantil", emoji: "⚖️" },
  { value: "laboral", label: "Despacho laboral", emoji: "⚖️" },
  { value: "fiscal", label: "Asesoría fiscal", emoji: "📊" },
  { value: "gestoria", label: "Gestoría", emoji: "📑" },
  { value: "inmobiliaria", label: "Inmobiliaria", emoji: "🏡" },
  { value: "dental", label: "Clínica dental", emoji: "🦷" },
  { value: "estetica", label: "Clínica estética", emoji: "🏥" },
  { value: "reformas", label: "Empresa de reformas", emoji: "🏗️" },
  { value: "concesionario", label: "Concesionario", emoji: "🚗" },
  { value: "restaurante", label: "Restaurante", emoji: "🍽️" },
  { value: "gimnasio", label: "Gimnasio", emoji: "🏋️" },
  { value: "consultoria", label: "Consultoría", emoji: "💼" },
  { value: "otro", label: "Otro", emoji: "✨" },
];

export const getNicheLabel = (value: string | null | undefined): string => {
  if (!value) return "—";
  const n = LEAD_NICHES.find((x) => x.value === value);
  return n ? `${n.emoji} ${n.label}` : value;
};
