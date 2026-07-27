import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { LowStockItem } from '../../../../shared/models/statistics/statistics.model';
import { STATUSES, STATUS_LABEL_KEYS, Status } from '../../../../shared/constants';
import { statusLabelKey } from '../../../../shared/utils/item-status/item-status.utils';

type StockTab = 'all' | Status;

@Component({
  selector: 'app-low-stock-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [LucideAngularModule, TranslatePipe],
  templateUrl: './low-stock-table.html',
  styleUrl: './low-stock-table.scss',
})
export class LowStockTable {
  items = input.required<LowStockItem[]>();

  activeTab = signal<StockTab>('all');
  readonly statusLabelKeys = STATUS_LABEL_KEYS;

  readonly tabs: { key: StockTab; label: string }[] = [
    { key: 'all', label: 'Tous' },
    ...STATUSES.map((status) => ({ key: status, label: STATUS_LABEL_KEYS[status] })),
  ];

  get filteredItems(): LowStockItem[] {
    const tab = this.activeTab();
    return tab === 'all' ? this.items() : this.items().filter((item) => item.status === tab);
  }

  countByTab(key: StockTab): number {
    return key === 'all'
      ? this.items().length
      : this.items().filter((item) => item.status === key).length;
  }

  get activeTabLabelKey(): string | null {
    const tab = this.activeTab();
    return tab === 'all' ? null : this.statusLabelKeys[tab];
  }

  readonly statusLabelKey = statusLabelKey;
}
