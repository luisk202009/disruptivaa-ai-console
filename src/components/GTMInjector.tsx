import { useEffect } from "react";
import { useSiteSetting } from "@/hooks/useSiteSetting";

export const GTM_SETTINGS_KEY = "gtm_integration";

export interface GTMSettings {
  head_code: string;
  body_code: string;
}

/**
 * Inyecta dinámicamente los fragmentos de Google Tag Manager configurados
 * por el administrador desde /admin/settings/gtm.
 *
 * - El código HEAD se agrega dentro de <head> (ejecutando <script> reales).
 * - El código BODY (noscript) se agrega inmediatamente después de <body>.
 */
const GTMInjector = () => {
  const { data } = useSiteSetting<GTMSettings>(GTM_SETTINGS_KEY);

  useEffect(() => {
    if (!data) return;
    const headCode = (data.head_code || "").trim();
    const bodyCode = (data.body_code || "").trim();

    const injectedNodes: Node[] = [];

    // --- HEAD: extraer contenido de <script>...</script> y crear scripts reales
    if (headCode) {
      const container = document.createElement("div");
      container.innerHTML = headCode;

      // Scripts inline / externos
      container.querySelectorAll("script").forEach((oldScript) => {
        const s = document.createElement("script");
        // copiar atributos (src, async, etc.)
        for (const attr of Array.from(oldScript.attributes)) {
          s.setAttribute(attr.name, attr.value);
        }
        s.text = oldScript.textContent || "";
        s.setAttribute("data-gtm-injected", "head");
        document.head.appendChild(s);
        injectedNodes.push(s);
      });

      // Nodos que no sean <script> (comentarios/meta) también al head
      Array.from(container.childNodes).forEach((node) => {
        if (node.nodeName.toLowerCase() === "script") return;
        const clone = node.cloneNode(true);
        if (clone instanceof HTMLElement) {
          clone.setAttribute("data-gtm-injected", "head");
        }
        document.head.appendChild(clone);
        injectedNodes.push(clone);
      });
    }

    // --- BODY: insertar el noscript inmediatamente después de la apertura de <body>
    if (bodyCode) {
      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-gtm-injected", "body");
      wrapper.innerHTML = bodyCode;
      document.body.insertBefore(wrapper, document.body.firstChild);
      injectedNodes.push(wrapper);
    }

    return () => {
      injectedNodes.forEach((n) => {
        if (n.parentNode) n.parentNode.removeChild(n);
      });
    };
  }, [data?.head_code, data?.body_code]);

  return null;
};

export default GTMInjector;
