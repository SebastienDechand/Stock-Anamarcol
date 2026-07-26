import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { NewUserData } from '../../store/actions/users.actions';
import {
  phoneFormatValidator,
  requiredTrimmedValidator,
} from '../../../../shared/utils/validators/validators.utils';
import {
  ALL_DEPARTMENT_LABELS,
  DEPARTMENT_LABEL_KEYS,
} from '../../../../shared/constants/poles/poles.constants';

@Component({
  selector: 'app-add-member-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './add-member-modal.html',
  styleUrl: './add-member-modal.scss',
})
export class AddMemberModal {
  private fb = inject(FormBuilder);

  submitted = output<NewUserData>();
  cancelled = output<void>();

  departments = ALL_DEPARTMENT_LABELS;
  departmentLabelKeys = DEPARTMENT_LABEL_KEYS;

  form = this.fb.nonNullable.group({
    username: ['', requiredTrimmedValidator],
    email: ['', [requiredTrimmedValidator, Validators.email]],
    password: ['', requiredTrimmedValidator],
    position: [''],
    phone: ['', phoneFormatValidator],
    department: [''],
  });

  showPassword = false;

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.emit(this.form.getRawValue());
  }
}
