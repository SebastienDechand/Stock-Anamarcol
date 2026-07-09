import { Component, OnInit, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';

import { UsersFacade } from '../members/store/users.facade';
import { AuthFacade } from '../../store/auth/auth.facade';
import { Spinner } from '../../shared/components/spinner/spinner';
import { AccessDenied } from '../../shared/components/access-denied/access-denied';
import { PageHero } from '../../shared/components/page-hero/page-hero';
import { User } from '../../shared/models/user.model';
import { Role, ROLE_DISPLAY_ORDER, ROLE_LABEL_KEYS } from '../../shared/constants/roles.constants';

const ROLE_COLUMNS: { role: Role; labelKey: string }[] = ROLE_DISPLAY_ORDER.map((role) => ({
  role,
  labelKey: ROLE_LABEL_KEYS[role],
}));

@Component({
  selector: 'app-admin-roles-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    TranslatePipe,
    Spinner,
    AccessDenied,
    PageHero,
  ],
  templateUrl: './admin-roles-page.html',
  styleUrl: './admin-roles-page.scss',
})
export class AdminRolesPage implements OnInit {
  // ─── Context & Redux ────────────────────────────────
  protected facade = inject(UsersFacade);
  private authFacade = inject(AuthFacade);

  // ─── Streams ─────────────────────────────────────────
  users$ = this.facade.users$;
  isLoading$ = this.facade.isLoading$;
  isSuperadmin$ = this.authFacade.isSuperadmin$;
  readonly savingRoleIds = toSignal(this.facade.savingRoleIds$, { initialValue: [] as string[] });

  // ─── Local State ────────────────────────────────────
  searchTerm = signal('');

  readonly roleColumns = ROLE_COLUMNS;
  readonly roleUser = Role.USER;

  // ─── Side Effects ─────────────────────────────────────
  ngOnInit() {
    this.facade.loadAll();
  }

  // ─── Helpers ─────────────────────────────────────────
  filterUsers(users: User[]): User[] {
    const searchTerm = this.searchTerm().toLowerCase();
    if (!searchTerm) return users;
    return users.filter(
      (u) =>
        u.pseudo.toLowerCase().includes(searchTerm) || u.email.toLowerCase().includes(searchTerm),
    );
  }

  userRoles(user: User): Role[] {
    const roles = user.roles && user.roles.length ? user.roles : [Role.USER];
    const withUser = roles.includes(Role.USER) ? roles : [Role.USER, ...roles];
    return [...new Set(withUser)];
  }

  hasRole(user: User, role: Role): boolean {
    return this.userRoles(user).includes(role);
  }

  isSaving(userId: string): boolean {
    return this.savingRoleIds().includes(userId);
  }

  // ─── Handlers ────────────────────────────────────────
  toggleRole(user: User, role: Role) {
    if (role === Role.USER) return;
    if (this.isSaving(user._id)) return;

    const current = this.userRoles(user);
    const next = current.includes(role) ? current.filter((r) => r !== role) : [...current, role];
    const safeNext = next.includes(Role.USER) ? next : [Role.USER, ...next];

    this.facade.updateRoles(user._id, safeNext);
  }
}
