import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { User } from '../../../../shared/models/user.model';
import { ROLE_DISPLAY_ORDER, ROLE_LABEL_KEYS } from '../../../../shared/constants/roles.constants';

@Component({
  selector: 'app-membre-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslatePipe],
  templateUrl: './membre-card.html',
  styleUrl: './membre-card.scss',
})
export class MembreCard {
  @Input({ required: true }) user!: User;
  @Input() showRoles = false;
  @Input() canDelete = false;
  @Input() clickable = false;

  @Output() selected = new EventEmitter<User>();
  @Output() deleteRequested = new EventEmitter<User>();

  get initials(): string {
    return (this.user.pseudo ?? '?')[0].toUpperCase();
  }

  get avatarUrl(): string {
    const picture = this.user.picture;
    if (!picture) return '';
    if (picture.startsWith('http') || picture.startsWith('/')) return picture;
    return `/${picture}`;
  }

  get badges() {
    const userRoles = this.user.roles ?? [];
    return ROLE_DISPLAY_ORDER.filter((role) => userRoles.includes(role)).map((role) => ({
      role,
      labelKey: ROLE_LABEL_KEYS[role],
    }));
  }

  onClick() {
    if (this.clickable) this.selected.emit(this.user);
  }
}
