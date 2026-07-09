import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  @Input() posterId = '';
  @Output() submitted = new EventEmitter<NewItem>();
  @Output() cancelled = new EventEmitter<void>();

  fournisseurs = FOURNISSEURS;
  etats = ETATS;

  form = {
    denomination: '',
    fournisseur: '',
    etat: '',
    quantite: 0,
    prepaCG: false,
    prepaTPV: false,
  };

  get isFormValid(): boolean {
    return (
      !!this.form.denomination.trim() &&
      !!this.form.fournisseur &&
      !!this.form.etat &&
      this.form.quantite > 0
    );
  }

  submit() {
    if (!this.isFormValid) return;
    this.submitted.emit({
      denomination: this.form.denomination,
      fournisseur: this.form.fournisseur,
      etat: this.form.etat,
      quantite: this.form.quantite,
      posterId: this.posterId,
      prepaCG: this.form.prepaCG,
      prepaTPV: this.form.prepaTPV,
    });
  }
}
