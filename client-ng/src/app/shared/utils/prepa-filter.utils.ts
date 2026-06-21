export interface PrepaFilterState {
  prepaCG: boolean;
  prepaTPV: boolean;
}

export function togglePrepaFilter(
  current: PrepaFilterState,
  prepa: 'CashGuard' | 'Caisse TPV',
): PrepaFilterState {
  const isCashGuard = prepa === 'CashGuard';
  const wasActive = isCashGuard ? current.prepaCG : current.prepaTPV;
  return {
    prepaCG: isCashGuard ? !wasActive : false,
    prepaTPV: isCashGuard ? false : !wasActive,
  };
}
