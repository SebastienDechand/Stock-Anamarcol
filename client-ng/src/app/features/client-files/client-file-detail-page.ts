import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideAngularModule,
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  ClipboardList,
  Wrench,
  Plus,
  Pencil,
  Trash2,
  Eye,
  X,
  FileText,
  Truck,
  Package,
  Check,
  CircleAlert,
  Send,
  UploadCloud,
  FileDown,
  ChevronLeft,
} from 'lucide-angular';
import { ClientFilesFacade } from './store/client-files.facade';
import { InterventionReportsFacade } from '../intervention-reports/store/intervention-reports.facade';
import { AuthFacade } from '../../store/auth/auth.facade';
import { ApiService } from '../../core/http/api.service';
import { ToastService } from '../../core/toast/toast.service';
import { Spinner } from '../../shared/components/spinner/spinner';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { ReportWizardModal } from './components/report-wizard-modal/report-wizard-modal';
import {
  ClientFile,
  ClientFileDoc,
  ClientFileDocType,
} from '../../shared/models/client-file.model';
import { CashguardUnit, InterventionReport } from '../../shared/models/intervention-report.model';
import { Shipment } from '../../shared/models/shipment.model';
import { environment } from '../../../environments/environment';
import { LanguageService } from '../../core/services/language.service';
import { resolveLocale } from '../../shared/utils/date.utils';

type ClientFileDetailTab = 'fiche' | 'technique' | 'shipments' | 'documents';

const DOC_TYPE_LABELS: Record<ClientFileDocType, string> = {
  purchase_order: 'CLIENT_FILES.DOC_TYPE_BDC',
  report: 'CLIENT_FILES.DOC_TYPE_RAPPORT',
  acceptance_report: 'CLIENT_FILES.DOC_TYPE_PVRECETTE',
  visit: 'CLIENT_FILES.DOC_TYPE_VISITE',
  other: 'CLIENT_FILES.DOC_TYPE_AUTRE',
};

@Component({
  selector: 'app-client-file-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    Spinner,
    ConfirmDialog,
    ReportWizardModal,
    TranslatePipe,
  ],
  templateUrl: './client-file-detail-page.html',
  styleUrl: './client-file-detail-page.scss',
})
export class ClientFileDetailPage implements OnInit {
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected filesFacade = inject(ClientFilesFacade);
  protected interventionReportsFacade = inject(InterventionReportsFacade);
  private authFacade = inject(AuthFacade);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private sanitizer = inject(DomSanitizer);
  private languageService = inject(LanguageService);

  isLoading$ = this.filesFacade.isLoading$;
  file$ = this.filesFacade.selectedFile$;
  reports$ = this.interventionReportsFacade.reports$;
  isMonteur$ = this.authFacade.isMonteur$;
  isAdmin$ = this.authFacade.isAdmin$;
  isHotline$ = this.authFacade.isHotline$;

  readonly arrowLeft = ArrowLeft;
  readonly building2 = Building2;
  readonly mapPin = MapPin;
  readonly phone = Phone;
  readonly mail = Mail;
  readonly clipboardList = ClipboardList;
  readonly wrench = Wrench;
  readonly plus = Plus;
  readonly pencil = Pencil;
  readonly trash2 = Trash2;
  readonly eye = Eye;
  readonly x = X;
  readonly fileText = FileText;
  readonly truck = Truck;
  readonly package = Package;
  readonly check = Check;
  readonly circleAlert = CircleAlert;
  readonly send = Send;
  readonly uploadCloud = UploadCloud;
  readonly fileDown = FileDown;
  readonly chevLeft = ChevronLeft;

  activeTab = signal<ClientFileDetailTab>('fiche');
  wizardOpen = signal(false);
  editReport = signal<InterventionReport | null>(null);
  deleteReportId = signal<string | null>(null);
  deleteDocId = signal<string | null>(null);
  detailShipment = signal<Shipment | null>(null);
  showUploadForm = signal(false);
  shipments = signal<Shipment[]>([]);
  shipmentsLoading = signal(false);
  docUploading = signal(false);
  docType = signal<ClientFileDocType>('purchase_order');
  uploadFile = signal<File | null>(null);

  readonly docTypeLabels = DOC_TYPE_LABELS;
  readonly docTypeOptions = (Object.entries(DOC_TYPE_LABELS) as [ClientFileDocType, string][]).map(
    ([value, label]) => ({ value, label }),
  );

  readonly apiUrl = environment.apiUrl;
  readonly sentCount = computed(() => this.shipments().filter((s) => !!s.sent).length);
  readonly pendingCount = computed(() => this.shipments().filter((s) => !s.sent).length);

  private fileId: string | null = null;

  readonly TABS: { key: ClientFileDetailTab; label: string; icon: typeof ClipboardList }[] = [
    { key: 'fiche', label: 'CLIENT_FILES.TAB_FICHE', icon: ClipboardList },
    { key: 'technique', label: 'CLIENT_FILES.TAB_TECHNIQUE', icon: Wrench },
    { key: 'shipments', label: 'SHIPMENTS.TITLE', icon: Truck },
    { key: 'documents', label: 'CLIENT_FILES.TAB_DOCUMENTS', icon: FileText },
  ];

  ngOnInit(): void {
    this.fileId = this.route.snapshot.paramMap.get('id');
    if (this.fileId) {
      this.filesFacade.loadOne(this.fileId);
      this.interventionReportsFacade.loadByClientFile(this.fileId);
      this.loadShipments();
    }
  }

  private loadShipments(): void {
    if (!this.fileId) return;
    this.shipmentsLoading.set(true);
    this.api
      .get<Shipment[]>(`api/shipments`, { clientFileId: this.fileId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.shipments.set(data);
          this.shipmentsLoading.set(false);
        },
        error: () => this.shipmentsLoading.set(false),
      });
  }

  goBack(): void {
    this.router.navigate(['/client-files']);
  }

  openWizard(report: InterventionReport | null = null): void {
    this.editReport.set(report);
    this.wizardOpen.set(true);
  }

  onWizardSaved(): void {
    this.wizardOpen.set(false);
    this.editReport.set(null);
    if (this.fileId) this.interventionReportsFacade.loadByClientFile(this.fileId);
  }

  confirmDeleteReport(): void {
    const id = this.deleteReportId();
    if (id) this.interventionReportsFacade.delete(id);
    this.deleteReportId.set(null);
  }

  markSent(shipmentId: string): void {
    this.api
      .put<Shipment>(`api/shipments/${shipmentId}/sent`, {})
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.shipments.update((prev) => prev.map((s) => (s._id === shipmentId ? updated : s)));
          this.toast.success('TOAST.MARKED_SENT');
        },
        error: () => this.toast.error('TOAST.MARK_SENT_ERROR'),
      });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.uploadFile.set(input.files?.[0] ?? null);
  }

  submitUpload(fileId: string): void {
    const file = this.uploadFile();
    if (!file || !this.fileId) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', this.docType());
    this.docUploading.set(true);
    this.api
      .postFormData<ClientFile>(`api/client-files/${fileId}/documents`, formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.filesFacade.loadOne(fileId);
          this.toast.success('TOAST.DOC_ADDED');
          this.uploadFile.set(null);
          this.showUploadForm.set(false);
          this.docUploading.set(false);
        },
        error: () => {
          this.toast.error('TOAST.DOC_UPLOAD_ERROR');
          this.docUploading.set(false);
        },
      });
  }

  confirmDeleteDoc(fileId: string): void {
    const docId = this.deleteDocId();
    if (!docId) return;
    this.api
      .delete<ClientFile>(`api/client-files/${fileId}/documents/${docId}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.filesFacade.loadOne(fileId);
          this.toast.success('TOAST.DOC_DELETED');
          this.deleteDocId.set(null);
        },
        error: () => {
          this.toast.error('TOAST.DOC_DELETE_ERROR');
          this.deleteDocId.set(null);
        },
      });
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(resolveLocale(this.languageService.current));
  }

  getFileUrl(doc: ClientFileDoc): string {
    return `${this.apiUrl}uploads/client-files/${doc.filename}`;
  }

  getClientLabel(file: ClientFile): string {
    return [file.lastName.toUpperCase(), file.firstName, file.company ? `- ${file.company}` : '']
      .filter(Boolean)
      .join(' ');
  }

  getMapsUrl(file: ClientFile): SafeResourceUrl {
    const address = [file.address, file.postalCode, file.city].filter(Boolean).join(', ');
    const url = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed&hl=fr`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  hasSlots(unit: CashguardUnit): boolean {
    return unit.cassetteSlots.some((slot) => !!slot);
  }

  getTwRegisters(report: InterventionReport): string[] {
    return report.twRegisters?.length
      ? report.twRegisters
      : ([report.twRegister1, report.twRegister2, report.twRegister3].filter(Boolean) as string[]);
  }
}
