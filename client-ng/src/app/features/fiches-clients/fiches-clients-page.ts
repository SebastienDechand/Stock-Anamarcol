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
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  Phone,
  Mail,
} from 'lucide-angular';
import { ClientFilesFacade } from './store/client-files.facade';
import { AuthFacade } from '../../store/auth/auth.facade';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { Spinner } from '../../shared/components/spinner/spinner';
import { ClientFile, ClientFileForm } from '../../shared/models/client-file.model';
import { ClientFileModal } from './components/client-file-modal/client-file-modal';
import { PageHero } from '../../shared/components/page-hero/page-hero';

const ITEMS_PER_PAGE = 9;

@Component({
  selector: 'app-fiches-clients-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    Spinner,
    ConfirmDialog,
    ClientFileModal,
    PageHero,
    TranslatePipe,
  ],
  templateUrl: './fiches-clients-page.html',
  styleUrl: './fiches-clients-page.scss',
})
export class FichesClientsPage implements OnInit {
  // ─── Context & Redux ────────────────────────────────
  protected facade = inject(ClientFilesFacade);
  private authFacade = inject(AuthFacade);
  private router = inject(Router);

  // ─── Streams ─────────────────────────────────────────
  isLoading$ = this.facade.isLoading$;
  clientFiles$ = this.facade.clientFiles$;
  isMonteur$ = this.authFacade.isMonteur$;
  isAdmin$ = this.authFacade.isAdmin$;

  // ─── Icons ───────────────────────────────────────────
  readonly plus = Plus;
  readonly search = Search;
  readonly folderOpen = FolderOpen;
  readonly trash2 = Trash2;
  readonly pencil = Pencil;
  readonly clipboardList = ClipboardList;
  readonly chevLeft = ChevronLeft;
  readonly chevRight = ChevronRight;
  readonly building2 = Building2;
  readonly mapPin = MapPin;
  readonly phone = Phone;
  readonly mail = Mail;

  // ─── Local State ────────────────────────────────────
  searchTerm = signal('');
  currentPage = signal(1);
  modalOpen = signal(false);
  editTarget = signal<ClientFile | null>(null);
  deletingFile = signal<ClientFile | null>(null);

  // ─── Side Effects ─────────────────────────────────────
  ngOnInit(): void {
    this.facade.loadAll();
  }

  // ─── Helpers ─────────────────────────────────────────
  filter(files: ClientFile[]): ClientFile[] {
    const q = this.searchTerm().toLowerCase().trim();
    const sorted = [...files].sort((a, b) =>
      a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }),
    );
    if (!q) return sorted;
    return sorted.filter(
      (f) =>
        f.nom?.toLowerCase().includes(q) ||
        f.prenom?.toLowerCase().includes(q) ||
        f.societe?.toLowerCase().includes(q) ||
        f.ville?.toLowerCase().includes(q) ||
        f.cp?.includes(q),
    );
  }

  paginate(files: ClientFile[]): ClientFile[] {
    const page = this.currentPage();
    return files.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  }

  totalPages(files: ClientFile[]): number {
    return Math.ceil(files.length / ITEMS_PER_PAGE);
  }

  pageNumbers(total: number): (number | '...')[] {
    const currentPage = this.currentPage();
    const pages = Array.from({ length: total }, (_, i) => i + 1).filter(
      (page) => page === 1 || page === total || Math.abs(page - currentPage) <= 1,
    );
    return pages.reduce<(number | '...')[]>((result, page, index, pageList) => {
      if (index > 0 && page - (pageList[index - 1] as number) > 1) result.push('...');
      result.push(page);
      return result;
    }, []);
  }

  displayName(file: ClientFile): string {
    const parts = [file.nom?.toUpperCase(), file.prenom].filter(Boolean).join(' ');
    return file.societe ? `${parts} - ${file.societe}` : parts;
  }

  // ─── Handlers ────────────────────────────────────────
  openDossier(file: ClientFile): void {
    this.facade.setSelected(file);
    this.router.navigate(['/fiches-clients', file._id]);
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
