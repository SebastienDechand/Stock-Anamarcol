export interface PrepaFilterState {
  cgKit: boolean;
  tpvKit: boolean;
}

export function togglePrepaFilter(
  current: PrepaFilterState,
  prepa: 'CashGuard' | 'Caisse TPV',
): PrepaFilterState {
  const isCashGuard = prepa === 'CashGuard';
  const wasActive = isCashGuard ? current.cgKit : current.tpvKit;
  return {
    cgKit: isCashGuard ? !wasActive : false,
    tpvKit: isCashGuard ? false : !wasActive,
  };
}
