import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { ETATS, FOURNISSEURS } from '../../../../shared/constants';
import { NewItem } from '../../../../shared/models/item.model';

@Component({
  selector: 'app-add-item-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './add-item-modal.html',
  styleUrl: './add-item-modal.scss',
})
export class AddItemModal {
  posterId = input('');
  submitted = output<NewItem>();
  cancelled = output<void>();

  suppliers = FOURNISSEURS;
  statuses = ETATS;

  form = {
    name: '',
    supplier: '',
    status: '',
    quantity: 0,
    cgKit: false,
    tpvKit: false,
  };

  get isFormValid(): boolean {
    return (
      !!this.form.name.trim() &&
      !!this.form.supplier &&
      !!this.form.status &&
      this.form.quantity > 0
    );
  }

  submit() {
    if (!this.isFormValid) return;
    this.submitted.emit({
      name: this.form.name,
      supplier: this.form.supplier,
      status: this.form.status,
      quantity: this.form.quantity,
      posterId: this.posterId(),
      cgKit: this.form.cgKit,
      tpvKit: this.form.tpvKit,
    });
  }
}
