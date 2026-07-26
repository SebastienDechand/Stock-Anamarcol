import { ChangeDetectionStrategy, Component, OnInit, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { User } from '../../../../shared/models/user/user.model';
import { UpdateUserData } from '../../store/actions/users.actions';
import {
  phoneFormatValidator,
  requiredTrimmedValidator,
} from '../../../../shared/utils/validators/validators.utils';
import {
  ALL_DEPARTMENT_LABELS,
  DEPARTMENT_LABEL_KEYS,
} from '../../../../shared/constants/poles/poles.constants';

@Component({
  selector: 'app-edit-member-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './edit-member-modal.html',
  styleUrl: './edit-member-modal.scss',
})
export class EditMemberModal implements OnInit {
  private fb = inject(FormBuilder);

  user = input.required<User>();
  isSuperadmin = input(false);
  saved = output<UpdateUserData>();
  pictureUploaded = output<{ id: string; formData: FormData }>();
  cancelled = output<void>();

  departments = ALL_DEPARTMENT_LABELS;
  departmentLabelKeys = DEPARTMENT_LABEL_KEYS;

  form = this.fb.nonNullable.group({
    username: ['', requiredTrimmedValidator],
    email: ['', [requiredTrimmedValidator, Validators.email]],
    position: [''],
    phone: ['', phoneFormatValidator],
    department: [''],
  });

  ngOnInit() {
    this.form.setValue({
      username: this.user().username,
      email: this.user().email,
      position: this.user().position ?? '',
      phone: this.user().phone ?? '',
      department: this.user().department ?? '',
    });
  }

  get avatarUrl(): string {
    const picture = this.user().picture;
    if (!picture) return '';
    if (picture.startsWith('http') || picture.startsWith('/')) return picture;
    return `/${picture}`;
  }

  get initials(): string {
    return (this.user().username || '?')[0].toUpperCase();
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', this.user().username || 'user');
    formData.append('userId', this.user()._id);
    this.pictureUploaded.emit({ id: this.user()._id, formData });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit(this.form.getRawValue());
  }
}
