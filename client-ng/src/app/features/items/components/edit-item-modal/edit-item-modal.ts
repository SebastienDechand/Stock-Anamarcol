import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import {
  ACCEPTED_IMAGE_TYPES,
  ETATS,
  FOURNISSEURS,
  MAX_FILE_SIZE,
} from '../../../../shared/constants';
import { Item, ItemHistory } from '../../../../shared/models/item.model';
import { ItemsFacade } from '../../store/items.facade';
import { UsersFacade } from '../../../members/store/users.facade';
import { AuthFacade } from '../../../../store/auth/auth.facade';

@Component({
  selector: 'app-edit-item-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './edit-item-modal.html',
  styleUrl: './edit-item-modal.scss',
})
export class EditItemModal implements OnInit, OnDestroy {
  @Input({ required: true }) item!: Item;
  @Output() submitted = new EventEmitter<Partial<Item>>();
  @Output() cancelled = new EventEmitter<void>();

  private facade = inject(ItemsFacade);
  private usersFacade = inject(UsersFacade);
  private authFacade = inject(AuthFacade);
  private translate = inject(TranslateService);

  fournisseurs = FOURNISSEURS;
  etats = ETATS;

  readonly isAdmin = toSignal(this.authFacade.isAdmin$, { initialValue: false });
  readonly currentUser = toSignal(this.authFacade.user$, { initialValue: null });
  readonly users = toSignal(this.usersFacade.users$, { initialValue: [] });
  readonly liveItem = toSignal(this.facade.selectedItem$.pipe(map((item) => item ?? this.item)), {
    initialValue: null,
  });
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
    denomination: '',
    fournisseur: '',
    etat: '',
    quantite: 0,
    prepaCG: false,
    prepaTPV: false,
  };

  ngOnInit() {
    this.facade.setSelectedItemId(this.item._id);
    this.resetForm();
  }

  ngOnDestroy() {
    this.facade.setSelectedItemId(null);
    const preview = this.imagePreview();
    if (preview) URL.revokeObjectURL(preview);
  }

  get displayItem(): Item {
    return this.liveItem() ?? this.item;
  }

  get poster() {
    return this.users().find((user) => user._id === this.displayItem.posterId);
  }

  resetForm() {
    const currentItem = this.displayItem;
    this.form = {
      denomination: currentItem.denomination,
      fournisseur: currentItem.fournisseur ?? '',
      etat: currentItem.etat ?? '',
      quantite: currentItem.quantite,
      prepaCG: currentItem.prepaCG ?? false,
      prepaTPV: currentItem.prepaTPV ?? false,
    };
  }

  switchTab(tab: 'detail' | 'history') {
    this.activeTab = tab;
    if (tab === 'history' && !this.historyFetched) {
      this.facade.loadHistory(this.item._id);
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
    if (!this.form.denomination.trim() || !this.form.fournisseur || !this.form.etat) {
      this.error = this.translate.instant('ITEMS.REQUIRED_FIELDS');
      return;
    }
    this.submitted.emit({ ...this.form });
    this.editing = false;
    this.error = '';
  }

  submitQty() {
    const newQty = Math.max(0, this.form.quantite);
    const current = this.displayItem.quantite;
    const name = this.currentUser()?.pseudo ?? '';
    const operation = newQty >= current ? 'add' : 'subtract';
    this.facade.updateQuantite(this.item._id, newQty, name, operation);
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
    this.facade.uploadPicture(this.item._id, formData);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '–';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
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
    denomination: 'ITEMS.DENOMINATION',
    fournisseur: 'ITEMS.SUPPLIER',
    etat: 'ITEMS.STATE',
    quantite: 'ITEMS.QUANTITY',
    prepaCG: 'ITEMS.PREPA_CG',
    prepaTPV: 'ITEMS.PREPA_TPV',
    image: 'ITEMS.IMAGE',
  };
}
