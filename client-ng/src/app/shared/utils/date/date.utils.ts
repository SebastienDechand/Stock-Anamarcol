import { Lang } from '../../../core/services/language/language.service';

const LOCALE_BY_LANG: Record<Lang, string> = { fr: 'fr-FR', en: 'en-GB' };

export function resolveLocale(lang: Lang): string {
  return LOCALE_BY_LANG[lang];
}

export function formatDateFr(value: string | Date | undefined | null, lang: Lang = 'fr'): string {
  if (!value) return '';
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  const timestamp = Date.parse(String(value));
  if (isNaN(timestamp)) return '';
  return new Date(timestamp).toLocaleDateString(resolveLocale(lang), options);
}
