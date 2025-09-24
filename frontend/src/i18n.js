import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar archivos de traducción
import enTranslations from './translations/en.json';
import esTranslations from './translations/es.json';
import frTranslations from './translations/fr.json';

const resources = {
  en: {
    translation: enTranslations,
  },
  es: {
    translation: esTranslations,
  },
  'es-MX': {
    translation: esTranslations, // Usar las mismas traducciones que 'es'
  },
  fr: {
    translation: frTranslations,
  },
};

i18n
  .use(LanguageDetector) // Detecta el idioma del navegador
  .use(initReactI18next) // Pasa i18n a react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Idioma por defecto si no encuentra el solicitado
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // React ya hace escape
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'twentyOnePilots-language',
      caches: ['localStorage'],
    },

    // Configuración adicional para persistencia de divisa
    interpolation: {
      ...i18n.options.interpolation,
      format: function(value, format, lng) {
        if (format === 'currency') {
          const currency = localStorage.getItem('twentyOnePilots-currency') || 'USD';
          const formatter = new Intl.NumberFormat(lng, {
            style: 'currency',
            currency: currency,
          });
          return formatter.format(value);
        }
        return value;
      }
    },

    react: {
      useSuspense: false, // Desactivar suspense para evitar problemas de carga
    },
  });

export default i18n;