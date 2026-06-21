import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { NewUserData } from '../../store/users.actions';
import { ALL_POLE_LABELS } from '../../../../shared/constants/poles.constants';

@Component({
  selector: 'app-add-membre-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './add-membre-modal.html',
  styleUrl: './add-membre-modal.scss',
})
export class AddMembreModal {
  @Output() submitted = new EventEmitter<NewUserData>();
  @Output() cancelled = new EventEmitter<void>();

  poles = ALL_POLE_LABELS;

  form: NewUserData & { password: string } = {
    pseudo: '',
    email: '',
    password: '',
    poste: '',
    numero: '',
    pole: '',
  };

  showPassword = false;

  submit() {
    if (!this.form.pseudo.trim() || !this.form.email.trim() || !this.form.password.trim()) return;
    this.submitted.emit(this.form);
  }
}
