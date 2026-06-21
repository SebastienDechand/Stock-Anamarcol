import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { User } from '../../../../shared/models/user.model';
import { UpdateUserData } from '../../store/users.actions';
import { ALL_POLE_LABELS } from '../../../../shared/constants/poles.constants';

@Component({
  selector: 'app-edit-membre-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './edit-membre-modal.html',
  styleUrl: './edit-membre-modal.scss',
})
export class EditMembreModal implements OnInit {
  @Input({ required: true }) user!: User;
  @Input() isSuperadmin = false;
  @Output() saved = new EventEmitter<UpdateUserData>();
  @Output() pictureUploaded = new EventEmitter<{ id: string; formData: FormData }>();
  @Output() cancelled = new EventEmitter<void>();

  poles = ALL_POLE_LABELS;

  form: UpdateUserData = {};

  ngOnInit() {
    this.form = {
      pseudo: this.user.pseudo,
      email: this.user.email,
      poste: this.user.poste ?? '',
      numero: this.user.numero ?? '',
      pole: this.user.pole ?? '',
    };
  }

  get avatarUrl(): string {
    const picture = this.user.picture;
    if (!picture) return '';
    if (picture.startsWith('http') || picture.startsWith('/')) return picture;
    return `/${picture}`;
  }

  get initials(): string {
    return (this.user.pseudo ?? '?')[0].toUpperCase();
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', this.user.pseudo || 'user');
    formData.append('userId', this.user._id);
    this.pictureUploaded.emit({ id: this.user._id, formData });
  }

  submit() {
    if (!this.form.pseudo?.trim() || !this.form.email?.trim()) return;
    this.saved.emit(this.form);
  }
}
