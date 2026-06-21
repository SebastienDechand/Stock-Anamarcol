import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';

import { UsersFacade } from './store/users.facade';
import { AuthFacade } from '../../store/auth/auth.facade';
import { Spinner } from '../../shared/components/spinner/spinner';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { MembreCard } from './components/membre-card/membre-card';
import { AddMembreModal } from './components/add-membre-modal/add-membre-modal';
import { EditMembreModal } from './components/edit-membre-modal/edit-membre-modal';
import { PageHero } from '../../shared/components/page-hero/page-hero';
import { NewUserData, UpdateUserData } from './store/users.actions';
import { User } from '../../shared/models/user.model';
import { Role } from '../../shared/constants/roles.constants';
import {
  ALL_POLE_LABELS,
  POLE_DIRECTION,
  POLE_GESTION,
  POLE_ENTREPOT,
} from '../../shared/constants/poles.constants';

function getUserPole(user: User): string {
  return user.pole ?? 'autre';
}

@Component({
  selector: 'app-membres-page',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    LucideAngularModule,
    Spinner,
    ConfirmDialog,
    MembreCard,
    AddMembreModal,
    EditMembreModal,
    PageHero,
  ],
  templateUrl: './membres-page.html',
  styleUrl: './membres-page.scss',
})
export class MembresPage {
  // ─── Context & Redux ────────────────────────────────
  protected facade = inject(UsersFacade);
  private authFacade = inject(AuthFacade);

  // ─── Streams ─────────────────────────────────────────
  users$ = this.facade.users$;
  isLoading$ = this.facade.isLoading$;
  readonly isAdmin = toSignal(this.authFacade.isAdmin$, { initialValue: false });
  readonly isSuperadmin = toSignal(this.authFacade.isSuperadmin$, { initialValue: false });

  // ─── Local State ────────────────────────────────────
  showAddModal = signal(false);
  editingUser = signal<User | null>(null);
  deletingUser = signal<User | null>(null);

  // ─── Constants ───────────────────────────────────────
  readonly poleDirection = POLE_DIRECTION;
  readonly poleGestion = POLE_GESTION;
  readonly poleEntrepot = POLE_ENTREPOT;

  // ─── Helpers ─────────────────────────────────────────
  byPole(users: User[], pole: string): User[] {
    return users.filter((user) => getUserPole(user) === pole);
  }

  canEdit(user: User): boolean {
    if (this.isSuperadmin()) return true;
    if (this.isAdmin()) return !user.roles?.includes(Role.SUPERADMIN);
    return false;
  }

  showRoles(): boolean {
    return this.isAdmin() || this.isSuperadmin();
  }

  // ─── Handlers ────────────────────────────────────────
  openEditModal(user: User) {
    this.editingUser.set(user);
  }

  onSave(data: UpdateUserData) {
    const user = this.editingUser();
    if (user) {
      this.facade.updateUser(user._id, data);
      this.editingUser.set(null);
    }
  }

  onAdd(data: NewUserData) {
    this.facade.addUser(data);
    this.showAddModal.set(false);
  }

  onPictureUpload(event: { id: string; formData: FormData }) {
    this.facade.uploadPicture(event.id, event.formData);
  }

  onDeleteConfirm() {
    const user = this.deletingUser();
    if (user) {
      this.facade.deleteUser(user._id);
      this.deletingUser.set(null);
    }
  }
}
