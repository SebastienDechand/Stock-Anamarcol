import { Component, OnInit, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { User } from '../../../../shared/models/user/user.model';
import { UpdateUserData } from '../../store/actions/users.actions';
import {
  ALL_DEPARTMENT_LABELS,
  DEPARTMENT_LABEL_KEYS,
} from '../../../../shared/constants/poles/poles.constants';

@Component({
  selector: 'app-edit-member-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './edit-member-modal.html',
  styleUrl: './edit-member-modal.scss',
})
export class EditMemberModal implements OnInit {
  user = input.required<User>();
  isSuperadmin = input(false);
  saved = output<UpdateUserData>();
  pictureUploaded = output<{ id: string; formData: FormData }>();
  cancelled = output<void>();

  departments = ALL_DEPARTMENT_LABELS;
  departmentLabelKeys = DEPARTMENT_LABEL_KEYS;

  form: UpdateUserData = {};

  ngOnInit() {
    this.form = {
      username: this.user().username,
      email: this.user().email,
      position: this.user().position ?? '',
      phone: this.user().phone ?? '',
      department: this.user().department ?? '',
    };
  }

  get avatarUrl(): string {
    const picture = this.user().picture;
    if (!picture) return '';
    if (picture.startsWith('http') || picture.startsWith('/')) return picture;
    return `/${picture}`;
  }

  get initials(): string {
    return (this.user().username ?? '?')[0].toUpperCase();
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
    if (!this.form.username?.trim() || !this.form.email?.trim()) return;
    this.saved.emit(this.form);
  }
}
