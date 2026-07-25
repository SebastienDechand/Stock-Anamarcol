import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { NewUserData } from '../../store/actions/users.actions';
import {
  ALL_DEPARTMENT_LABELS,
  DEPARTMENT_LABEL_KEYS,
} from '../../../../shared/constants/poles/poles.constants';

@Component({
  selector: 'app-add-member-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './add-member-modal.html',
  styleUrl: './add-member-modal.scss',
})
export class AddMemberModal {
  submitted = output<NewUserData>();
  cancelled = output<void>();

  departments = ALL_DEPARTMENT_LABELS;
  departmentLabelKeys = DEPARTMENT_LABEL_KEYS;

  form: NewUserData & { password: string } = {
    username: '',
    email: '',
    password: '',
    position: '',
    phone: '',
    department: '',
  };

  showPassword = false;

  submit() {
    if (!this.form.username.trim() || !this.form.email.trim() || !this.form.password.trim())
      return;
    this.submitted.emit(this.form);
  }
}
