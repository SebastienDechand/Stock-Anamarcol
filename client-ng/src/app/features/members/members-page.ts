import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';

import { UsersFacade } from './store/facade/users.facade';
import { AuthFacade } from '../../store/auth/facade/auth.facade';
import { Spinner } from '../../shared/components/spinner/spinner';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { MemberCard } from './components/member-card/member-card';
import { AddMemberModal } from './components/add-member-modal/add-member-modal';
import { EditMemberModal } from './components/edit-member-modal/edit-member-modal';
import { PageHero } from '../../shared/components/page-hero/page-hero';
import { NewUserData, UpdateUserData } from './store/actions/users.actions';
import { User } from '../../shared/models/user/user.model';
import { Role } from '../../shared/constants/roles/roles.constants';
import {
  DEPARTMENT_MANAGEMENT,
  DEPARTMENT_SITE_MANAGEMENT,
  DEPARTMENT_WAREHOUSE,
} from '../../shared/constants/poles/poles.constants';

function getUserDepartment(user: User): string {
  return user.department ?? 'Other';
}

@Component({
  selector: 'app-members-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    LucideAngularModule,
    Spinner,
    ConfirmDialog,
    MemberCard,
    AddMemberModal,
    EditMemberModal,
    PageHero,
  ],
  templateUrl: './members-page.html',
  styleUrl: './members-page.scss',
})
export class MembersPage {
  protected facade = inject(UsersFacade);
  private authFacade = inject(AuthFacade);

  users$ = this.facade.users$;
  isLoading$ = this.facade.isLoading$;
  readonly isAdmin = toSignal(this.authFacade.isAdmin$, { initialValue: false });
  readonly isSuperadmin = toSignal(this.authFacade.isSuperadmin$, { initialValue: false });

  showAddModal = signal(false);
  editingUser = signal<User | null>(null);
  deletingUser = signal<User | null>(null);

  readonly departmentManagement = DEPARTMENT_MANAGEMENT;
  readonly departmentSiteManagement = DEPARTMENT_SITE_MANAGEMENT;
  readonly departmentWarehouse = DEPARTMENT_WAREHOUSE;

  byDepartment(users: User[], department: string): User[] {
    return users.filter((user) => getUserDepartment(user) === department);
  }

  canEdit(user: User): boolean {
    if (this.isSuperadmin()) return true;
    if (this.isAdmin()) return !user.roles?.includes(Role.SUPERADMIN);
    return false;
  }

  showRoles(): boolean {
    return this.isAdmin() || this.isSuperadmin();
  }

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
