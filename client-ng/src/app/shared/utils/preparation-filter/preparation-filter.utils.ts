export interface PreparationFilterState {
  cgKit: boolean;
  tpvKit: boolean;
}

export function togglePreparationFilter(
  current: PreparationFilterState,
  preparation: 'CashGuard' | 'Caisse TPV',
): PreparationFilterState {
  const isCashGuard = preparation === 'CashGuard';
  const wasActive = isCashGuard ? current.cgKit : current.tpvKit;
  return {
    cgKit: isCashGuard ? !wasActive : false,
    tpvKit: isCashGuard ? false : !wasActive,
  };
}
