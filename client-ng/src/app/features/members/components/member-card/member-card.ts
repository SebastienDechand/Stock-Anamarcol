import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { User } from '../../../../shared/models/user/user.model';
import { ROLE_DISPLAY_ORDER, ROLE_LABEL_KEYS } from '../../../../shared/constants/roles/roles.constants';

@Component({
  selector: 'app-member-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslatePipe],
  templateUrl: './member-card.html',
  styleUrl: './member-card.scss',
})
export class MemberCard {
  user = input.required<User>();
  showRoles = input(false);
  canDelete = input(false);
  clickable = input(false);

  selected = output<User>();
  deleteRequested = output<User>();

  get initials(): string {
    return (this.user().username ?? '?')[0].toUpperCase();
  }

  get avatarUrl(): string {
    const picture = this.user().picture;
    if (!picture) return '';
    if (picture.startsWith('http') || picture.startsWith('/')) return picture;
    return `/${picture}`;
  }

  get badges() {
    const userRoles = this.user().roles ?? [];
    return ROLE_DISPLAY_ORDER.filter((role) => userRoles.includes(role)).map((role) => ({
      role,
      labelKey: ROLE_LABEL_KEYS[role],
    }));
  }

  onClick() {
    if (this.clickable()) this.selected.emit(this.user());
  }
}
