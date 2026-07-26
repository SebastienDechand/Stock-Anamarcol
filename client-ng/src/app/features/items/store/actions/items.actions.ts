import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  FetchItemsParams,
  Item,
  ItemHistory,
  NewItem,
} from '../../../../shared/models/item/item.model';

export const ItemsActions = createActionGroup({
  source: 'Items',
  events: {
    'Load All Items': emptyProps(),
    'Load All Items Success': props<{ items: Item[] }>(),
    'Load All Items Failure': props<{ error: string }>(),

    'Fetch Items': props<{ params: FetchItemsParams }>(),
    'Fetch Items Success': props<{
      items: Item[];
      total: number;
      page: number;
      totalPages: number;
      canDecrement: Record<string, boolean>;
    }>(),
    'Fetch Items Failure': props<{ error: string }>(),

    'Create Item': props<{ data: NewItem }>(),
    'Create Item Success': props<{ item: Item }>(),
    'Create Item Failure': props<{ error: string }>(),

    'Update Item': props<{ id: string; data: Partial<Item> }>(),
    'Update Item Success': props<{ item: Item }>(),
    'Update Item Failure': props<{ error: string }>(),

    'Delete Item': props<{ id: string }>(),
    'Delete Item Success': props<{ id: string }>(),
    'Delete Item Failure': props<{ error: string }>(),

    'Update Quantity': props<{
      id: string;
      quantity: number;
      modifierName: string;
      operation: 'add' | 'subtract';
    }>(),
    'Update Quantity Success': props<{ id: string; quantity: number }>(),
    'Update Quantity Failure': props<{ error: string }>(),

    'Upload Item Picture': props<{ id: string; formData: FormData }>(),
    'Upload Item Picture Success': props<{ item: Item }>(),
    'Upload Item Picture Failure': props<{ error: string }>(),

    'Preparation Batch': props<{
      field: string;
      operation: string;
      count: number;
      params: FetchItemsParams;
    }>(),
    'Preparation Batch Success': emptyProps(),

    'Set Selected Item Id': props<{ id: string | null }>(),
    'Load Item History': props<{ id: string }>(),
    'Load Item History Success': props<{ history: ItemHistory[] }>(),
  },
});
