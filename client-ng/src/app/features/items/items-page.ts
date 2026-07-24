import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, fromEvent } from 'rxjs';
import { auditTime } from 'rxjs/operators';

import { ItemsFacade } from './store/items.facade';
import { AuthFacade } from '../../store/auth/auth.facade';
import { Spinner } from '../../shared/components/spinner/spinner';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { ItemCard } from './components/item-card/item-card';
import { AddItemModal } from './components/add-item-modal/add-item-modal';
import { EditItemModal } from './components/edit-item-modal/edit-item-modal';
import { ExportModal } from './components/export-modal/export-modal';
import { FiltersModal, FiltersApplied } from './components/filters-modal/filters-modal';
import { Item, FetchItemsParams, NewItem } from '../../shared/models/item.model';
import { User } from '../../shared/models/user.model';
import { FOURNISSEURS, ETATS } from '../../shared/constants';
import { togglePrepaFilter } from '../../shared/utils/prepa-filter.utils';

function getItemsPerPage(): number {
  const w = window.innerWidth;
  if (w < 640) return 8;
  if (w < 768) return 12;
  let cols: number;
  if (w < 1024) cols = 3;
  else if (w < 1280) cols = 4;
  else if (w < 1536) cols = 5;
  else cols = 6;
  const rows = Math.max(1, Math.floor((window.innerHeight - 274) / 212));
  return cols * rows;
}

@Component({
  selector: 'app-items-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    Spinner,
    ConfirmDialog,
    ItemCard,
    AddItemModal,
    EditItemModal,
    ExportModal,
    FiltersModal,
    TranslatePipe,
  ],
  templateUrl: './items-page.html',
  styleUrl: './items-page.scss',
})
export class ItemsPage implements OnInit {
  private destroyRef = inject(DestroyRef);
  protected facade = inject(ItemsFacade);
  private authFacade = inject(AuthFacade);
  private itemsPerPage = signal(getItemsPerPage());

  isAdmin$ = this.authFacade.isAdmin$;
  isLoading$ = this.facade.isLoading$;
  items$ = this.facade.items$;
  total$ = this.facade.total$;
  page$ = this.facade.page$;
  totalPages$ = this.facade.totalPages$;
  canDecrement$ = this.facade.canDecrement$;
  allItems$ = this.facade.allItems$;

  readonly suppliers = FOURNISSEURS;
  readonly statuses = ETATS;
  readonly preps = ['CashGuard', 'Caisse TPV'] as const;

  showAddModal = signal(false);
  showExportModal = signal(false);
  showFiltersModal = signal(false);
  editingItem = signal<Item | null>(null);
  deletingItem = signal<Item | null>(null);
  modifierName = signal('');
  currentUserId = signal('');

  selectedSuppliers = signal<string[]>([]);
  selectedStatuses = signal<string[]>([]);
  cgKit = signal(false);
  tpvKit = signal(false);
  cgKitCount = signal(1);
  tpvKitCount = signal(1);

  private searchSubject = new Subject<string>();
  private currentSearch = '';
  private currentPage = 1;

  ngOnInit() {
    this.loadPage(1);

    fromEvent(window, 'resize')
      .pipe(auditTime(200), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const next = getItemsPerPage();
        if (next !== this.itemsPerPage()) {
          this.itemsPerPage.set(next);
          this.loadPage(1);
        }
      });

    this.authFacade.user$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((u: User | null) => {
      this.modifierName.set(u?.username ?? '');
      this.currentUserId.set(u?._id ?? '');
    });

    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => {
        this.currentSearch = term;
        this.loadPage(1);
      });
  }

  onSearchInput(event: Event) {
    this.searchSubject.next((event.target as HTMLInputElement).value);
  }

  toggleSupplier(supplier: string) {
    const current = this.selectedSuppliers();
    this.selectedSuppliers.set(
      current.includes(supplier)
        ? current.filter((item) => item !== supplier)
        : [...current, supplier],
    );
    this.loadPage(1);
  }

  toggleStatus(status: string) {
    const current = this.selectedStatuses();
    this.selectedStatuses.set(
      current.includes(status) ? current.filter((item) => item !== status) : [...current, status],
    );
    this.loadPage(1);
  }

  togglePrepa(prepa: 'CashGuard' | 'Caisse TPV') {
    const next = togglePrepaFilter({ cgKit: this.cgKit(), tpvKit: this.tpvKit() }, prepa);
    this.cgKit.set(next.cgKit);
    this.tpvKit.set(next.tpvKit);
    this.loadPage(1);
  }

  private buildFetchParams(page: number): FetchItemsParams {
    return {
      page,
      limit: this.itemsPerPage(),
      search: this.currentSearch,
      supplier: this.selectedSuppliers(),
      status: this.selectedStatuses(),
      cgKit: this.cgKit() || undefined,
      tpvKit: this.tpvKit() || undefined,
    };
  }

  loadPage(page: number) {
    this.currentPage = page;
    this.facade.fetchItems(this.buildFetchParams(page));
  }

  onPageChange(page: number) {
    this.loadPage(page);
  }

  onAddSubmit(item: NewItem) {
    this.facade.createItem(item);
    this.showAddModal.set(false);
  }

  onEditSubmit(data: Partial<Item>) {
    const item = this.editingItem();
    if (item) {
      this.facade.updateItem(item._id, data);
      this.editingItem.set(null);
    }
  }

  onDeleteConfirm() {
    const item = this.deletingItem();
    if (item) {
      this.facade.deleteItem(item._id);
      this.deletingItem.set(null);
    }
  }

  onIncrement(item: Item) {
    this.facade.updateQuantity(item._id, item.quantity + 1, this.modifierName(), 'add');
  }

  onDecrement(item: Item) {
    if (item.quantity <= 0) return;
    this.facade.updateQuantity(item._id, item.quantity - 1, this.modifierName(), 'subtract');
  }

  onUploadPicture(event: { item: Item; file: File }) {
    const formData = new FormData();
    formData.append('file', event.file);
    this.facade.uploadPicture(event.item._id, formData);
  }

  pageRange(totalPages: number): number[] {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  isSupplierActive(supplier: string) {
    return this.selectedSuppliers().includes(supplier);
  }
  isStatusActive(status: string) {
    return this.selectedStatuses().includes(status);
  }

  get hasActiveFilters(): boolean {
    return (
      this.selectedSuppliers().length > 0 ||
      this.selectedStatuses().length > 0 ||
      this.cgKit() ||
      this.tpvKit()
    );
  }

  clearPrepa() {
    this.cgKit.set(false);
    this.tpvKit.set(false);
    this.loadPage(1);
  }

  clearAllFilters() {
    this.selectedSuppliers.set([]);
    this.selectedStatuses.set([]);
    this.cgKit.set(false);
    this.tpvKit.set(false);
    this.loadPage(1);
  }

  onFiltersApplied(filters: FiltersApplied) {
    this.selectedSuppliers.set(filters.suppliers);
    this.selectedStatuses.set(filters.statuses);
    this.cgKit.set(filters.cgKit);
    this.tpvKit.set(filters.tpvKit);
    this.showFiltersModal.set(false);
    this.loadPage(1);
  }

  onCgKitCountChange(event: Event) {
    const parsedValue = +(event.target as HTMLInputElement).value;
    this.cgKitCount.set(parsedValue > 0 ? parsedValue : 1);
  }

  onTpvKitCountChange(event: Event) {
    const parsedValue = +(event.target as HTMLInputElement).value;
    this.tpvKitCount.set(parsedValue > 0 ? parsedValue : 1);
  }

  onPrepaBatch(prep: 'CashGuard' | 'Caisse TPV', operation: 'increment' | 'decrement') {
    const field = prep === 'CashGuard' ? 'cgKit' : 'tpvKit';
    const count =
      operation === 'decrement' ? 1 : prep === 'CashGuard' ? this.cgKitCount() : this.tpvKitCount();
    this.facade.prepaBatch(field, operation, count, this.buildFetchParams(this.currentPage));
  }
}
