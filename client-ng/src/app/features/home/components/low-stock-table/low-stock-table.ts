import { Component, input, signal, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { LowStockItem } from '../../../../shared/models/statistics.model';

type StockTab = 'all' | 'SAV' | 'Neuf';

@Component({
  selector: 'app-low-stock-table',
  standalone: true,
  imports: [LucideAngularModule, TranslatePipe],
  templateUrl: './low-stock-table.html',
  styleUrl: './low-stock-table.scss',
})
export class LowStockTable {
  items = input.required<LowStockItem[]>();

  activeTab = signal<StockTab>('all');

  readonly tabs: { key: StockTab; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'SAV', label: 'SAV' },
    { key: 'Neuf', label: 'Neuf' },
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
}
