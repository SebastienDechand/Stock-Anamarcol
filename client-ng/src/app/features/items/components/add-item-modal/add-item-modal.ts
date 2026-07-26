import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { STATUSES, SUPPLIERS } from '../../../../shared/constants';
import { NewItem } from '../../../../shared/models/item/item.model';
import { requiredTrimmedValidator } from '../../../../shared/utils/validators/validators.utils';

@Component({
  selector: 'app-add-item-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './add-item-modal.html',
  styleUrl: './add-item-modal.scss',
})
export class AddItemModal {
  private fb = inject(FormBuilder);

  posterId = input('');
  submitted = output<NewItem>();
  cancelled = output<void>();

  suppliers = SUPPLIERS;
  statuses = STATUSES;

  form = this.fb.nonNullable.group({
    name: ['', requiredTrimmedValidator],
    supplier: ['', Validators.required],
    status: ['', Validators.required],
    quantity: [0, [Validators.required, Validators.min(0)]],
    cgKit: [false],
    tpvKit: [false],
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.submitted.emit({ ...value, posterId: this.posterId() });
  }
}
