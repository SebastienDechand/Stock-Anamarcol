import { STATUSES, STATUS_LABEL_KEYS, Status } from '../../constants';

function isStatus(value: string): value is Status {
  return STATUSES.some((status) => status === value);
}

export function statusLabelKey(status: string): string {
  return isStatus(status) ? STATUS_LABEL_KEYS[status] : status;
}
