import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map, take } from 'rxjs';
import { FetchItemsParams, Item, NewItem } from '../../../../shared/models/item/item.model';
import { ItemsActions } from '../actions/items.actions';
import {
  selectAllItems,
  selectCanDecrement,
  selectHistory,
  selectIsLoadingHistory,
  selectItemsLoaded,
  selectItemsLoading,
  selectPage,
  selectPageItems,
  selectSelectedItem,
  selectSelectedItemId,
  selectTotal,
  selectTotalPages,
} from '../selectors/items.selectors';

@Injectable({ providedIn: 'root' })
export class ItemsFacade {
  private store = inject(Store);

  allItems$ = this.store.select(selectAllItems);
  items$ = this.store.select(selectPageItems);
  total$ = this.store.select(selectTotal);
  page$ = this.store.select(selectPage);
  totalPages$ = this.store.select(selectTotalPages);
  isLoading$ = combineLatest([
    this.store.select(selectItemsLoading),
    this.store.select(selectItemsLoaded),
  ]).pipe(map(([loading, loaded]) => loading && !loaded));
  selectedItemId$ = this.store.select(selectSelectedItemId);
  selectedItem$ = this.store.select(selectSelectedItem);
  canDecrement$ = this.store.select(selectCanDecrement);
  history$ = this.store.select(selectHistory);
  isLoadingHistory$ = this.store.select(selectIsLoadingHistory);

  loadAllItems() {
    this.store.dispatch(ItemsActions.loadAllItems());
  }

  loadAllItemsIfNeeded() {
    this.store
      .select(selectItemsLoaded)
      .pipe(take(1))
      .subscribe((loaded) => {
        if (!loaded) this.loadAllItems();
      });
  }
  fetchItems(params: FetchItemsParams = {}) {
    this.store.dispatch(ItemsActions.fetchItems({ params }));
  }
  createItem(data: NewItem) {
    this.store.dispatch(ItemsActions.createItem({ data }));
  }
  updateItem(id: string, data: Partial<Item>) {
    this.store.dispatch(ItemsActions.updateItem({ id, data }));
  }
  deleteItem(id: string) {
    this.store.dispatch(ItemsActions.deleteItem({ id }));
  }
  updateQuantity(
    id: string,
    quantity: number,
    modifierName: string,
    operation: 'add' | 'subtract',
  ) {
    this.store.dispatch(ItemsActions.updateQuantity({ id, quantity, modifierName, operation }));
  }
  uploadPicture(id: string, formData: FormData) {
    this.store.dispatch(ItemsActions.uploadItemPicture({ id, formData }));
  }
  setSelectedItemId(id: string | null) {
    this.store.dispatch(ItemsActions.setSelectedItemId({ id }));
  }
  prepaBatch(
    field: string,
    operation: 'increment' | 'decrement',
    count: number,
    params: FetchItemsParams,
  ) {
    this.store.dispatch(ItemsActions.prepaBatch({ field, operation, count, params }));
  }
  loadHistory(id: string) {
    this.store.dispatch(ItemsActions.loadItemHistory({ id }));
  }
}
