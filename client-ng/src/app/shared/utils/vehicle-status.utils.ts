import { Lang } from '../../core/services/language.service';
import { resolveLocale } from './date.utils';

export type VehicleDateStatus = 'expired' | 'soon' | 'ok' | 'none';

const EXPIRING_SOON_THRESHOLD_DAYS = 30;
const REVISION_VALIDITY_YEARS = 1;

export function isDateExpired(date: string | Date | undefined): boolean {
  if (!date) return false;
  return new Date(date).getTime() < Date.now();
}

export function isDateExpiringSoon(date: string | Date | undefined): boolean {
  if (!date) return false;
  const days = (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days <= EXPIRING_SOON_THRESHOLD_DAYS && days > 0;
}

export function formatVehicleDate(date: string | Date | undefined, lang: Lang = 'fr'): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString(resolveLocale(lang));
}

export function vehicleDateStatus(date: string | Date | undefined): VehicleDateStatus {
  if (!date) return 'none';
  if (isDateExpired(date)) return 'expired';
  if (isDateExpiringSoon(date)) return 'soon';
  return 'ok';
}

export function vehicleRevisionStatus(date: string | Date | undefined): VehicleDateStatus {
  if (!date) return 'none';
  const due = new Date(date);
  due.setFullYear(due.getFullYear() + REVISION_VALIDITY_YEARS);
  const days = (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (days <= 0) return 'expired';
  if (days <= EXPIRING_SOON_THRESHOLD_DAYS) return 'soon';
  return 'ok';
}
