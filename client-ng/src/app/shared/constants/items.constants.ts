export const SUPPLIERS = [
  'Amazon',
  'CashGuard',
  'LDLC',
  'MD Ouest',
  'Monétique et Services',
  'Oxhoo',
  'Solumag',
  'Tigra',
  'TPV Line',
  'VNE',
] as const;

export type Supplier = (typeof SUPPLIERS)[number];

export const STATUSES = ['NEW', 'RMA'] as const;
export type Status = (typeof STATUSES)[number];

export const LOW_STOCK_THRESHOLD = 5;
