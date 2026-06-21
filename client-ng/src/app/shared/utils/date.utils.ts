export function formatDateFr(value: string | Date | undefined | null): string {
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
  return new Date(timestamp).toLocaleDateString('fr-FR', options);
}
