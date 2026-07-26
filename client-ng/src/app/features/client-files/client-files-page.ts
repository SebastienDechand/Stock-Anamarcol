import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Plus,
  Search,
  FolderOpen,
  Trash2,
  Pencil,
  ClipboardList,
  Building2,
  MapPin,
  Phone,
  Mail,
} from 'lucide-angular';
import { ClientFilesFacade } from './store/facade/client-files.facade';
import { AuthFacade } from '../../store/auth/facade/auth.facade';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { Spinner } from '../../shared/components/spinner/spinner';
import { ClientFile, ClientFileForm } from '../../shared/models/client-file/client-file.model';
import { ClientFileModal } from './components/client-file-modal/client-file-modal';
import { PageHero } from '../../shared/components/page-hero/page-hero';
import { Pagination } from '../../shared/components/pagination/pagination';
import { Badge } from '../../shared/components/badge/badge';

const ITEMS_PER_PAGE = 9;

@Component({
  selector: 'app-client-files-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    Spinner,
    ConfirmDialog,
    ClientFileModal,
    PageHero,
    Pagination,
    Badge,
    TranslatePipe,
  ],
  templateUrl: './client-files-page.html',
  styleUrl: './client-files-page.scss',
})
export class ClientFilesPage implements OnInit {
  protected facade = inject(ClientFilesFacade);
  private authFacade = inject(AuthFacade);
  private router = inject(Router);

  isLoading$ = this.facade.isLoading$;
  clientFiles$ = this.facade.clientFiles$;
  isMonteur$ = this.authFacade.isMonteur$;
  isAdmin$ = this.authFacade.isAdmin$;

  readonly plus = Plus;
  readonly search = Search;
  readonly folderOpen = FolderOpen;
  readonly trash2 = Trash2;
  readonly pencil = Pencil;
  readonly clipboardList = ClipboardList;
  readonly building2 = Building2;
  readonly mapPin = MapPin;
  readonly phone = Phone;
  readonly mail = Mail;

  searchTerm = signal('');
  currentPage = signal(1);
  modalOpen = signal(false);
  editTarget = signal<ClientFile | null>(null);
  deletingFile = signal<ClientFile | null>(null);

  ngOnInit(): void {
    this.facade.loadAll();
  }

  filter(files: ClientFile[]): ClientFile[] {
    const q = this.searchTerm().toLowerCase().trim();
    const sorted = [...files].sort((a, b) =>
      a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' }),
    );
    if (!q) return sorted;
    return sorted.filter(
      (f) =>
        f.lastName?.toLowerCase().includes(q) ||
        f.firstName?.toLowerCase().includes(q) ||
        f.company?.toLowerCase().includes(q) ||
        f.city?.toLowerCase().includes(q) ||
        f.postalCode?.includes(q),
    );
  }

  paginate(files: ClientFile[]): ClientFile[] {
    const page = this.currentPage();
    return files.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  }

  totalPages(files: ClientFile[]): number {
    return Math.ceil(files.length / ITEMS_PER_PAGE);
  }

  displayName(file: ClientFile): string {
    const parts = [file.lastName?.toUpperCase(), file.firstName].filter(Boolean).join(' ');
    return file.company ? `${parts} - ${file.company}` : parts;
  }

  openDossier(file: ClientFile): void {
    this.facade.setSelected(file);
    this.router.navigate(['/client-files', file._id]);
  }

  openCreate(): void {
    this.editTarget.set(null);
    this.modalOpen.set(true);
  }

  openEdit(file: ClientFile, event: Event): void {
    event.stopPropagation();
    this.facade.setSelected(file);
    this.editTarget.set(file);
    this.modalOpen.set(true);
  }

  onModalSave(data: { id?: string; data: ClientFileForm }): void {
    if (data.id) {
      this.facade.update(data.id, data.data);
    } else {
      this.facade.create(data.data);
    }
    this.modalOpen.set(false);
    this.editTarget.set(null);
  }

  onModalClose(): void {
    this.modalOpen.set(false);
    this.editTarget.set(null);
  }

  confirmDelete(): void {
    const f = this.deletingFile();
    if (f) this.facade.delete(f._id);
    this.deletingFile.set(null);
  }

  onSearchChange(): void {
    this.currentPage.set(1);
  }
}
