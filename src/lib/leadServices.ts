// Catálogo de servicios ofrecidos. Sincronizado con las páginas en /src/pages/servicios.
export interface LeadService {
  value: string;
  label: string;
}

export const LEAD_SERVICES: LeadService[] = [
  { value: "crm-hubspot", label: "CRM HubSpot" },
  { value: "negocio-14-dias", label: "Negocio Digital en 14 días" },
  { value: "shopify", label: "Shopify" },
  { value: "marketing-ads", label: "Marketing & Ads" },
  { value: "websites-landings", label: "Websites & Landings" },
  { value: "mvp-aplicaciones", label: "MVP & Aplicaciones" },
];

// Convierte la cadena almacenada en BD ("a, b, c") a un array de valores.
export const parseServices = (raw?: string | null): string[] => {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

// Serializa el array de valores a la cadena para guardar en BD.
export const serializeServices = (values: string[]): string | null => {
  const cleaned = values.map((v) => v.trim()).filter(Boolean);
  return cleaned.length ? cleaned.join(", ") : null;
};

export const getServiceLabel = (value: string): string =>
  LEAD_SERVICES.find((s) => s.value === value)?.label ?? value;

// Normaliza una URL: añade https:// si falta protocolo. Devuelve null si es inválida.
export const normalizeWebsite = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withProto);
    if (!u.hostname.includes(".")) return null;
    return u.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
};
