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
  // ─── Context & Redux ────────────────────────────────
  private destroyRef = inject(DestroyRef);
  protected facade = inject(ItemsFacade);
  private authFacade = inject(AuthFacade);
  private itemsPerPage = signal(getItemsPerPage());

  // ─── Streams ─────────────────────────────────────────
  isAdmin$ = this.authFacade.isAdmin$;
  isLoading$ = this.facade.isLoading$;
  items$ = this.facade.items$;
  total$ = this.facade.total$;
  page$ = this.facade.page$;
  totalPages$ = this.facade.totalPages$;
  canDecrement$ = this.facade.canDecrement$;
  allItems$ = this.facade.allItems$;

  // ─── Constants ───────────────────────────────────────
  readonly fournisseurs = FOURNISSEURS;
  readonly etats = ETATS;
  readonly preps = ['CashGuard', 'Caisse TPV'] as const;

  // ─── Local State (Signals) ───────────────────────────
  showAddModal = signal(false);
  showExportModal = signal(false);
  showFiltersModal = signal(false);
  editingItem = signal<Item | null>(null);
  deletingItem = signal<Item | null>(null);
  modifierName = signal('');
  currentUserId = signal('');

  selectedFournisseurs = signal<string[]>([]);
  selectedEtats = signal<string[]>([]);
  prepaCG = signal(false);
  prepaTPV = signal(false);
  prepaCGCount = signal(1);
  prepaTPVCount = signal(1);

  // ─── Search ───────────────────────────────────────────
  private searchSubject = new Subject<string>();
  private currentSearch = '';
  private currentPage = 1;

  // ─── Side Effects ─────────────────────────────────────
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
      this.modifierName.set(u?.pseudo ?? '');
      this.currentUserId.set(u?._id ?? '');
    });

    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => {
        this.currentSearch = term;
        this.loadPage(1);
      });
  }

  // ─── Handlers ────────────────────────────────────────
  onSearchInput(event: Event) {
    this.searchSubject.next((event.target as HTMLInputElement).value);
  }

  toggleFournisseur(fournisseur: string) {
    const current = this.selectedFournisseurs();
    this.selectedFournisseurs.set(
      current.includes(fournisseur)
        ? current.filter((item) => item !== fournisseur)
        : [...current, fournisseur],
    );
    this.loadPage(1);
  }

  toggleEtat(etat: string) {
    const current = this.selectedEtats();
    this.selectedEtats.set(
      current.includes(etat) ? current.filter((item) => item !== etat) : [...current, etat],
    );
    this.loadPage(1);
  }

  togglePrepa(prepa: 'CashGuard' | 'Caisse TPV') {
    const next = togglePrepaFilter({ prepaCG: this.prepaCG(), prepaTPV: this.prepaTPV() }, prepa);
    this.prepaCG.set(next.prepaCG);
    this.prepaTPV.set(next.prepaTPV);
    this.loadPage(1);
  }

  private buildFetchParams(page: number): FetchItemsParams {
    return {
      page,
      limit: this.itemsPerPage(),
      search: this.currentSearch,
      fournisseur: this.selectedFournisseurs(),
      etat: this.selectedEtats(),
      prepaCG: this.prepaCG() || undefined,
      prepaTPV: this.prepaTPV() || undefined,
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
    this.facade.updateQuantite(item._id, item.quantite + 1, this.modifierName(), 'add');
  }

  onDecrement(item: Item) {
    if (item.quantite <= 0) return;
    this.facade.updateQuantite(item._id, item.quantite - 1, this.modifierName(), 'subtract');
  }

  onUploadPicture(event: { item: Item; file: File }) {
    const formData = new FormData();
    formData.append('file', event.file);
    this.facade.uploadPicture(event.item._id, formData);
  }

  pageRange(totalPages: number): number[] {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  isFournisseurActive(fournisseur: string) {
    return this.selectedFournisseurs().includes(fournisseur);
  }
  isEtatActive(etat: string) {
    return this.selectedEtats().includes(etat);
  }

  get hasActiveFilters(): boolean {
    return (
      this.selectedFournisseurs().length > 0 ||
      this.selectedEtats().length > 0 ||
      this.prepaCG() ||
      this.prepaTPV()
    );
  }

  clearPrepa() {
    this.prepaCG.set(false);
    this.prepaTPV.set(false);
    this.loadPage(1);
  }

  clearAllFilters() {
    this.selectedFournisseurs.set([]);
    this.selectedEtats.set([]);
    this.prepaCG.set(false);
    this.prepaTPV.set(false);
    this.loadPage(1);
  }

  onFiltersApplied(filters: FiltersApplied) {
    this.selectedFournisseurs.set(filters.fournisseurs);
    this.selectedEtats.set(filters.etats);
    this.prepaCG.set(filters.prepaCG);
    this.prepaTPV.set(filters.prepaTPV);
    this.showFiltersModal.set(false);
    this.loadPage(1);
  }

  onPrepaCGCountChange(event: Event) {
    const parsedValue = +(event.target as HTMLInputElement).value;
    this.prepaCGCount.set(parsedValue > 0 ? parsedValue : 1);
  }

  onPrepaTPVCountChange(event: Event) {
    const parsedValue = +(event.target as HTMLInputElement).value;
    this.prepaTPVCount.set(parsedValue > 0 ? parsedValue : 1);
  }

  onPrepaBatch(prep: 'CashGuard' | 'Caisse TPV', operation: 'increment' | 'decrement') {
    const field = prep === 'CashGuard' ? 'prepaCG' : 'prepaTPV';
    const count =
      operation === 'decrement'
        ? 1
        : prep === 'CashGuard'
          ? this.prepaCGCount()
          : this.prepaTPVCount();
    this.facade.prepaBatch(field, operation, count, this.buildFetchParams(this.currentPage));
  }
}
