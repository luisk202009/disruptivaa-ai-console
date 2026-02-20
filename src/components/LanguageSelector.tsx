import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUserProfile, SupportedLanguage } from '@/hooks/useUserProfile';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const languages = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
] as const;

export const LanguageSelector = () => {
  const { t, i18n } = useTranslation();
  const { updateLanguage, isUpdatingLanguage } = useUserProfile();

  const handleChange = (value: string) => {
    const selected = languages.find(l => l.code === value);
    updateLanguage(value as SupportedLanguage);
    toast.success(`${t('language.updated')} ${selected?.label}`);
  };

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <Globe className="text-muted-foreground" size={18} />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">
          {t('settings.language')}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('settings.selectLanguage')}
        </p>
      </div>
      <Select
        value={i18n.language}
        onValueChange={handleChange}
        disabled={isUpdatingLanguage}
      >
        <SelectTrigger className="w-36">
          <SelectValue>
            <span className="flex items-center gap-2">
              <span>{currentLang.flag}</span>
              {currentLang.label}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                {lang.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
