import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';

import {
  ACCEPTED_IMAGE_TYPES,
  STATUSES,
  SUPPLIERS,
  MAX_FILE_SIZE,
} from '../../../../shared/constants';
import { Item, ItemHistory } from '../../../../shared/models/item/item.model';
import { ItemsFacade } from '../../store/facade/items.facade';
import { UsersFacade } from '../../../members/store/facade/users.facade';
import { AuthFacade } from '../../../../store/auth/facade/auth.facade';
import { LanguageService } from '../../../../core/services/language/language.service';
import { resolveLocale } from '../../../../shared/utils/date/date.utils';

@Component({
  selector: 'app-edit-item-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './edit-item-modal.html',
  styleUrl: './edit-item-modal.scss',
})
export class EditItemModal implements OnInit, OnDestroy {
  item = input.required<Item>();
  submitted = output<Partial<Item>>();
  cancelled = output<void>();

  private facade = inject(ItemsFacade);
  private usersFacade = inject(UsersFacade);
  private authFacade = inject(AuthFacade);
  private translate = inject(TranslateService);
  private languageService = inject(LanguageService);

  suppliers = SUPPLIERS;
  statuses = STATUSES;

  readonly isAdmin = toSignal(this.authFacade.isAdmin$, { initialValue: false });
  readonly currentUser = toSignal(this.authFacade.user$, { initialValue: null });
  readonly users = toSignal(this.usersFacade.users$, { initialValue: [] });
  readonly liveItem = toSignal(this.facade.selectedItem$, { initialValue: null });
  readonly history = toSignal(this.facade.history$, { initialValue: [] as ItemHistory[] });
  readonly isLoadingHistory = toSignal(this.facade.isLoadingHistory$, { initialValue: false });

  activeTab: 'detail' | 'history' = 'detail';
  historyFetched = false;
  editing = false;
  editingQty = false;
  error = '';
  imagePreview = signal<string | null>(null);
  fileError = '';

  form = {
    name: '',
    supplier: '',
    status: '',
    quantity: 0,
    cgKit: false,
    tpvKit: false,
  };

  ngOnInit() {
    this.facade.setSelectedItemId(this.item()._id);
    this.resetForm();
  }

  ngOnDestroy() {
    this.facade.setSelectedItemId(null);
    const preview = this.imagePreview();
    if (preview) URL.revokeObjectURL(preview);
  }

  get displayItem(): Item {
    return this.liveItem() ?? this.item();
  }

  get poster() {
    return this.users().find((user) => user._id === this.displayItem.posterId);
  }

  resetForm() {
    const currentItem = this.displayItem;
    this.form = {
      name: currentItem.name,
      supplier: currentItem.supplier ?? '',
      status: currentItem.status ?? '',
      quantity: currentItem.quantity,
      cgKit: currentItem.cgKit ?? false,
      tpvKit: currentItem.tpvKit ?? false,
    };
  }

  switchTab(tab: 'detail' | 'history') {
    this.activeTab = tab;
    if (tab === 'history' && !this.historyFetched) {
      this.facade.loadHistory(this.item()._id);
      this.historyFetched = true;
    }
  }

  startEditing() {
    this.resetForm();
    this.editing = true;
    this.error = '';
  }

  cancelEditing() {
    this.resetForm();
    this.editing = false;
    this.editingQty = false;
    this.error = '';
  }

  submit() {
    if (!this.form.name.trim() || !this.form.supplier || !this.form.status) {
      this.error = this.translate.instant('ITEMS.REQUIRED_FIELDS');
      return;
    }
    this.submitted.emit({ ...this.form });
    this.editing = false;
    this.error = '';
  }

  submitQty() {
    const newQty = Math.max(0, this.form.quantity);
    const current = this.displayItem.quantity;
    const name = this.currentUser()?.username ?? '';
    const operation = newQty >= current ? 'add' : 'subtract';
    this.facade.updateQuantity(this.item()._id, newQty, name, operation);
    this.editingQty = false;
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.fileError = '';

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      this.fileError = this.translate.instant('ITEMS.IMAGE_FORMAT_ERROR');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      this.fileError = this.translate.instant('ITEMS.IMAGE_SIZE_ERROR');
      return;
    }

    const previousPreview = this.imagePreview();
    if (previousPreview) URL.revokeObjectURL(previousPreview);
    this.imagePreview.set(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append('file', file);
    this.facade.uploadPicture(this.item()._id, formData);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '–';
    return new Date(dateStr).toLocaleDateString(resolveLocale(this.languageService.current), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  readonly ACTION_LABEL_KEYS: Record<string, string> = {
    create: 'ITEMS.ACTION_CREATE',
    update: 'ITEMS.ACTION_UPDATE',
    delete: 'ITEMS.ACTION_DELETE',
    quantity_change: 'ITEMS.QUANTITY',
  };
  readonly ACTION_MODS: Record<string, string> = {
    create: 'create',
    update: 'update',
    delete: 'delete',
    quantity_change: 'qty',
  };
  readonly FIELD_LABEL_KEYS: Record<string, string> = {
    name: 'ITEMS.DENOMINATION',
    supplier: 'ITEMS.SUPPLIER',
    status: 'ITEMS.STATE',
    quantity: 'ITEMS.QUANTITY',
    cgKit: 'ITEMS.PREPA_CG',
    tpvKit: 'ITEMS.PREPA_TPV',
    image: 'ITEMS.IMAGE',
  };
}
