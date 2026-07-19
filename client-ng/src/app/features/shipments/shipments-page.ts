import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  LucideAngularModule,
  Plus,
  History,
  ChevronLeft,
  ChevronRight,
  ClipboardPaste,
  Search,
  Package,
  CircleAlert,
  Check,
  X,
  Eye,
  Send,
  Trash2,
  Truck,
  User,
  Phone,
  MapPin,
  Building2,
  Mail,
  Clock,
  FolderOpen,
  Link,
  Download,
} from 'lucide-angular';
import { ShipmentsFacade } from './store/shipments.facade';
import { AuthFacade } from '../../store/auth/auth.facade';
import { ShipmentHistoryModal } from './components/shipment-history-modal/shipment-history-modal';
import { ShipmentExportModal } from './components/shipment-export-modal/shipment-export-modal';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { Spinner } from '../../shared/components/spinner/spinner';
import { PageHero } from '../../shared/components/page-hero/page-hero';
import { Shipment, ShipmentForm } from '../../shared/models/shipment.model';
import { ClientFile } from '../../shared/models/client-file.model';
import { User as UserModel } from '../../shared/models/user.model';
import { ClientFilesFacade } from '../client-files/store/client-files.facade';

const EMPTY_FORM: ShipmentForm = {
  lastName: '',
  firstName: '',
  phone: '',
  phone2: '',
  email: '',
  address: '',
  postalCode: '',
  city: '',
  companyOrRole: '',
  company: '',
  part: '',
  requestDate: '',
};

const FIELD_MAP: Record<string, keyof ShipmentForm> = {
  nom: 'lastName',
  prenom: 'firstName',
  prénom: 'firstName',
  telephone: 'phone',
  téléphone: 'phone',
  tel: 'phone',
  telephone2: 'phone2',
  téléphone2: 'phone2',
  tel2: 'phone2',
  email: 'email',
  'e-mail': 'email',
  adresse: 'address',
  'code postal': 'postalCode',
  cp: 'postalCode',
  ville: 'city',
  'societe ou fonction': 'companyOrRole',
  'société ou fonction': 'companyOrRole',
  societe: 'company',
  société: 'company',
};

function parsePastedText(text: string): Partial<ShipmentForm> {
  const result: Partial<ShipmentForm> = {};
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.substring(0, colonIdx).trim().toLowerCase().replace(/\s+/g, ' ');
    const value = line.substring(colonIdx + 1).trim();
    const mapped = FIELD_MAP[key];
    if (mapped && value) (result as Record<string, string>)[mapped] = value;
  }
  return result;
}

type StatusFilter = 'all' | 'pending' | 'sent';
const ITEMS_PER_PAGE = 20;

@Component({
  selector: 'app-shipments-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    TranslatePipe,
    Spinner,
    ConfirmDialog,
    ShipmentHistoryModal,
    ShipmentExportModal,
    PageHero,
  ],
  templateUrl: './shipments-page.html',
  styleUrl: './shipments-page.scss',
})
export class ShipmentsPage implements OnInit {
  private destroyRef = inject(DestroyRef);
  protected facade = inject(ShipmentsFacade);
  private authFacade = inject(AuthFacade);
  private clientFilesFacade = inject(ClientFilesFacade);

  isLoading$ = this.facade.isLoading$;
  isAdmin$ = this.authFacade.isAdmin$;
  isHotline$ = this.authFacade.isHotline$;

  readonly plus = Plus;
  readonly history = History;
  readonly chevLeft = ChevronLeft;
  readonly chevRight = ChevronRight;
  readonly clipPaste = ClipboardPaste;
  readonly searchIcon = Search;
  readonly packageIcon = Package;
  readonly circleAlert = CircleAlert;
  readonly check = Check;
  readonly x = X;
  readonly eye = Eye;
  readonly send = Send;
  readonly trash2 = Trash2;
  readonly truck = Truck;
  readonly userIcon = User;
  readonly phone = Phone;
  readonly mapPin = MapPin;
  readonly building2 = Building2;
  readonly mail = Mail;
  readonly clock = Clock;
  readonly folderOpen = FolderOpen;
  readonly link = Link;
  readonly download = Download;

  readonly statusTabs: { value: StatusFilter; labelKey: string }[] = [
    { value: 'all', labelKey: 'SHIPMENTS.ALL' },
    { value: 'pending', labelKey: 'SHIPMENTS.PENDING' },
    { value: 'sent', labelKey: 'SHIPMENTS.SENT' },
  ];

  showForm = signal(false);
  showHistory = signal(false);
  showExportModal = signal(false);
  deletingShipment = signal<Shipment | null>(null);
  detailShipment = signal<Shipment | null>(null);
  form = signal<ShipmentForm>({ ...EMPTY_FORM });
  currentUserName = signal('');
  search = signal('');
  statusFilter = signal<StatusFilter>('all');
  currentPage = signal(1);
  allShipments = signal<Shipment[]>([]);

  linkedClientFileId = signal('');
  clientFileSearch = signal('');
  showCfSuggestions = signal(false);
  pasteText = signal('');

  readonly clientFiles = toSignal(this.clientFilesFacade.clientFiles$, { initialValue: [] });

  readonly filteredClientFiles = computed(() => {
    const searchTerm = this.clientFileSearch().toLowerCase().trim();
    const list = this.clientFiles() ?? [];
    if (!searchTerm) return list.slice(0, 8);
    return list
      .filter(
        (clientFile) =>
          clientFile.lastName.toLowerCase().includes(searchTerm) ||
          (clientFile.firstName ?? '').toLowerCase().includes(searchTerm) ||
          (clientFile.company ?? '').toLowerCase().includes(searchTerm) ||
          (clientFile.city ?? '').toLowerCase().includes(searchTerm) ||
          (clientFile.postalCode ?? '').includes(searchTerm),
      )
      .slice(0, 8);
  });

  readonly linkedClientFile = computed(() => {
    const id = this.linkedClientFileId();
    if (!id) return null;
    return this.clientFiles().find((clientFile) => clientFile._id === id) ?? null;
  });

  readonly totalCount = computed(() => this.allShipments().length);
  readonly pendingCount = computed(
    () => this.allShipments().filter((shipment) => !shipment.sent).length,
  );
  readonly sentCount = computed(
    () => this.allShipments().filter((shipment) => !!shipment.sent).length,
  );

  readonly filtered = computed(() => {
    const searchTerm = this.search().toLowerCase().trim();
    const status = this.statusFilter();
    return this.allShipments().filter((shipment) => {
      const matchSearch =
        !searchTerm ||
        [
          shipment.lastName,
          shipment.firstName,
          shipment.company,
          shipment.companyOrRole ?? '',
          shipment.part,
          shipment.city,
          shipment.postalCode,
          shipment.phone ?? '',
          shipment.email ?? '',
        ].some((value) => value.toLowerCase().includes(searchTerm));
      const matchStatus =
        status === 'all' ||
        (status === 'pending' && !shipment.sent) ||
        (status === 'sent' && !!shipment.sent);
      return matchSearch && matchStatus;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / ITEMS_PER_PAGE)),
  );

  readonly paginatedItems = computed(() => {
    const page = this.currentPage();
    return this.filtered().slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  });

  ngOnInit(): void {
    this.facade.shipments$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((shipments) => this.allShipments.set(shipments ?? []));
    this.facade.fetch({ page: 1, limit: 200 });
    this.authFacade.user$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user: UserModel | null) => this.currentUserName.set(user?.pseudo ?? ''));
  }

  setSearch(searchTerm: string): void {
    this.search.set(searchTerm);
    this.currentPage.set(1);
  }

  setStatusFilter(status: StatusFilter): void {
    this.statusFilter.set(status);
    this.currentPage.set(1);
  }

  loadPage(page: number): void {
    this.currentPage.set(Math.max(1, Math.min(this.totalPages(), page)));
  }

  selectClientFile(clientFile: ClientFile): void {
    this.linkedClientFileId.set(clientFile._id);
    this.clientFileSearch.set('');
    this.showCfSuggestions.set(false);
    this.form.update((currentForm) => ({
      ...currentForm,
      lastName: clientFile.lastName,
      firstName: clientFile.firstName ?? '',
      phone: clientFile.phone ?? clientFile.mobile ?? '',
      email: clientFile.email ?? '',
      address: clientFile.address ?? '',
      postalCode: clientFile.postalCode ?? '',
      city: clientFile.city ?? '',
      company: clientFile.company ?? '',
      companyOrRole: clientFile.company ?? '',
    }));
  }

  clearClientFile(): void {
    this.linkedClientFileId.set('');
    this.clientFileSearch.set('');
  }

  handleParse(): void {
    const text = this.pasteText();
    if (!text.trim()) return;
    const parsed = parsePastedText(text);
    if (Object.keys(parsed).length > 0) {
      this.form.update((currentForm) => ({ ...currentForm, ...parsed }));
      this.pasteText.set('');
    }
  }

  onPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    const parsed = parsePastedText(text);
    if (Object.keys(parsed).length > 0) {
      event.preventDefault();
      this.form.update((currentForm) => ({ ...currentForm, ...parsed }));
    }
  }

  updateField(field: keyof ShipmentForm, value: string): void {
    this.form.update((currentForm) => ({ ...currentForm, [field]: value }));
  }

  submitCreate(): void {
    const formValue = this.form();
    if (!formValue.lastName.trim() || !formValue.part.trim()) return;
    const clientFileId = this.linkedClientFileId();
    this.facade.create(
      clientFileId ? { ...formValue, clientFile: clientFileId } : formValue,
      this.currentUserName(),
    );
    this.form.set({ ...EMPTY_FORM });
    this.linkedClientFileId.set('');
    this.showForm.set(false);
  }

  onMarkSent(shipment: Shipment): void {
    this.facade.markSent(shipment._id, this.currentUserName());
  }

  onDeleteConfirm(shipment: Shipment): void {
    this.deletingShipment.set(shipment);
  }

  confirmDelete(): void {
    const shipment = this.deletingShipment();
    if (shipment) this.facade.delete(shipment._id);
    this.deletingShipment.set(null);
  }

  openHistory(): void {
    this.showHistory.set(true);
  }

  onArchived(): void {
    this.facade.fetch({ page: 1, limit: 200 });
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('fr-FR');
  }

  clientFileLabel(clientFile: ClientFile): string {
    return `${clientFile.lastName.toUpperCase()}${clientFile.firstName ? ' ' + clientFile.firstName : ''}${clientFile.company ? ' - ' + clientFile.company : ''}`;
  }
}
