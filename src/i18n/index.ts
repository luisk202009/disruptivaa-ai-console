import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import esCommon from './locales/es/common.json';
import esAgents from './locales/es/agents.json';
import enCommon from './locales/en/common.json';
import enAgents from './locales/en/agents.json';
import ptCommon from './locales/pt/common.json';
import ptAgents from './locales/pt/agents.json';

const resources = {
  es: { common: esCommon, agents: esAgents },
  en: { common: enCommon, agents: enAgents },
  pt: { common: ptCommon, agents: ptAgents },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'pt'],
    defaultNS: 'common',
    ns: ['common', 'agents'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
