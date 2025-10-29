import { useAppSettings } from "@/contexts/AppSettingsContext";
import { translations, type TranslationKey } from "@/lib/translations";

export const useTranslation = () => {
  const { language } = useAppSettings();
  
  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations.ru[key] || key;
  };
  
  return { t, language };
};

