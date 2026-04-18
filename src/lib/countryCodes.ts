export interface CountryCode {
  code: string;
  dial: string;
  name: string;
  flag: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: "CO", dial: "57", name: "Colombia", flag: "🇨🇴" },
  { code: "MX", dial: "52", name: "México", flag: "🇲🇽" },
  { code: "AR", dial: "54", name: "Argentina", flag: "🇦🇷" },
  { code: "CL", dial: "56", name: "Chile", flag: "🇨🇱" },
  { code: "PE", dial: "51", name: "Perú", flag: "🇵🇪" },
  { code: "EC", dial: "593", name: "Ecuador", flag: "🇪🇨" },
  { code: "VE", dial: "58", name: "Venezuela", flag: "🇻🇪" },
  { code: "UY", dial: "598", name: "Uruguay", flag: "🇺🇾" },
  { code: "PY", dial: "595", name: "Paraguay", flag: "🇵🇾" },
  { code: "BO", dial: "591", name: "Bolivia", flag: "🇧🇴" },
  { code: "CR", dial: "506", name: "Costa Rica", flag: "🇨🇷" },
  { code: "PA", dial: "507", name: "Panamá", flag: "🇵🇦" },
  { code: "GT", dial: "502", name: "Guatemala", flag: "🇬🇹" },
  { code: "HN", dial: "504", name: "Honduras", flag: "🇭🇳" },
  { code: "SV", dial: "503", name: "El Salvador", flag: "🇸🇻" },
  { code: "NI", dial: "505", name: "Nicaragua", flag: "🇳🇮" },
  { code: "DO", dial: "1809", name: "Rep. Dominicana", flag: "🇩🇴" },
  { code: "PR", dial: "1787", name: "Puerto Rico", flag: "🇵🇷" },
  { code: "ES", dial: "34", name: "España", flag: "🇪🇸" },
  { code: "US", dial: "1", name: "Estados Unidos", flag: "🇺🇸" },
  { code: "BR", dial: "55", name: "Brasil", flag: "🇧🇷" },
];

export const DEFAULT_COUNTRY = COUNTRY_CODES[0];
