import { Component, OnInit, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { FOURNISSEURS, ETATS } from '../../../../shared/constants';
import { togglePrepaFilter } from '../../../../shared/utils/prepa-filter.utils';

export interface FiltersApplied {
  suppliers: string[];
  statuses: string[];
  cgKit: boolean;
  tpvKit: boolean;
}

@Component({
  selector: 'app-filters-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslatePipe],
  templateUrl: './filters-modal.html',
  styleUrl: './filters-modal.scss',
})
export class FiltersModal implements OnInit {
  selectedSuppliers = input<string[]>([]);
  selectedStatuses = input<string[]>([]);
  cgKit = input(false);
  tpvKit = input(false);

  applied = output<FiltersApplied>();
  cancelled = output<void>();

  readonly suppliers = FOURNISSEURS;
  readonly statuses = ETATS;

  localSuppliers = signal<string[]>([]);
  localStatuses = signal<string[]>([]);
  localCgKit = signal(false);
  localTpvKit = signal(false);

  ngOnInit() {
    this.localSuppliers.set([...this.selectedSuppliers()]);
    this.localStatuses.set([...this.selectedStatuses()]);
    this.localCgKit.set(this.cgKit());
    this.localTpvKit.set(this.tpvKit());
  }

  toggleSupplier(supplier: string) {
    const current = this.localSuppliers();
    this.localSuppliers.set(
      current.includes(supplier)
        ? current.filter((item) => item !== supplier)
        : [...current, supplier],
    );
  }

  toggleStatus(status: string) {
    const current = this.localStatuses();
    this.localStatuses.set(
      current.includes(status) ? current.filter((item) => item !== status) : [...current, status],
    );
  }

  togglePrepa(prepa: 'CashGuard' | 'Caisse TPV') {
    const next = togglePrepaFilter({ cgKit: this.localCgKit(), tpvKit: this.localTpvKit() }, prepa);
    this.localCgKit.set(next.cgKit);
    this.localTpvKit.set(next.tpvKit);
  }

  reset() {
    this.localSuppliers.set([]);
    this.localStatuses.set([]);
    this.localCgKit.set(false);
    this.localTpvKit.set(false);
  }

  apply() {
    this.applied.emit({
      suppliers: this.localSuppliers(),
      statuses: this.localStatuses(),
      cgKit: this.localCgKit(),
      tpvKit: this.localTpvKit(),
    });
  }
}
