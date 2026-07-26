import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { LucideAngularModule, FileText, Trash2, Upload } from 'lucide-angular';
import {
  Vehicle,
  VehicleDocument,
  DocumentType,
} from '../../../../shared/models/vehicle/vehicle.model';
import { environment } from '../../../../../environments/environment';
import { ToastService } from '../../../../core/toast/toast.service';
import { LanguageService } from '../../../../core/services/language/language.service';
import { resolveLocale } from '../../../../shared/utils/date/date.utils';

const DOC_TYPE_LABEL_KEYS: Record<DocumentType, string> = {
  service_invoice: 'FLEET.DOC_TYPE_SERVICE_INVOICE',
  inspection: 'FLEET.DOC_TYPE_INSPECTION',
  anti_pollution: 'FLEET.DOC_TYPE_ANTI_POLLUTION',
  other: 'FLEET.DOC_TYPE_OTHER',
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
// Must match the multer fileFilter in server/routes/vehicle.routes.ts
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xlsx', 'xls', 'jpg', 'jpeg', 'png'];

@Component({
  selector: 'app-vehicle-document-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LucideAngularModule],
  templateUrl: './vehicle-document-list.html',
  styleUrl: './vehicle-document-list.scss',
})
export class VehicleDocumentList {
  private toast = inject(ToastService);
  private languageService = inject(LanguageService);

  vehicle = input.required<Vehicle>();
  isAdmin = input(false);
  uploadDocument = output<{ id: string; formData: FormData }>();
  deleteDocument = output<{ vehicleId: string; docId: string }>();

  readonly fileText = FileText;
  readonly trash2 = Trash2;
  readonly upload = Upload;

  docTypeOptions: { value: DocumentType; labelKey: string }[] = [
    { value: 'service_invoice', labelKey: DOC_TYPE_LABEL_KEYS.service_invoice },
    { value: 'inspection', labelKey: DOC_TYPE_LABEL_KEYS.inspection },
    { value: 'anti_pollution', labelKey: DOC_TYPE_LABEL_KEYS.anti_pollution },
    { value: 'other', labelKey: DOC_TYPE_LABEL_KEYS.other },
  ];

  selectedDocType: DocumentType = 'other';
  selectedDocName = '';
  selectedFile: File | null = null;

  getLabelKey(type: DocumentType): string {
    return DOC_TYPE_LABEL_KEYS[type] ?? type;
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(resolveLocale(this.languageService.current));
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file && !this.isFileValid(file)) {
      input.value = '';
      this.selectedFile = null;
      return;
    }
    this.selectedFile = file;
    if (this.selectedFile && !this.selectedDocName) {
      this.selectedDocName = this.selectedFile.name.replace(/\.[^/.]+$/, '');
    }
  }

  private isFileValid(file: File): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      this.toast.error('TOAST.VEHICLE_DOC_INVALID_TYPE');
      return false;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.toast.error('TOAST.VEHICLE_DOC_TOO_LARGE');
      return false;
    }
    return true;
  }

  submitUpload(): void {
    const vehicleId = this.vehicle()._id;
    if (!this.selectedFile || !this.selectedDocName.trim() || !vehicleId) return;
    const formData = new FormData();
    // Field names must match multer's `upload.single("file")` and the
    // controller's `req.body.docType` / `req.body.docName` (see
    // server/routes/vehicle.routes.ts and server/controllers/vehicle.controller.ts).
    formData.append('file', this.selectedFile);
    formData.append('docName', this.selectedDocName.trim());
    formData.append('docType', this.selectedDocType);
    this.uploadDocument.emit({ id: vehicleId, formData });
    this.selectedFile = null;
    this.selectedDocName = '';
    this.selectedDocType = 'other';
  }

  onDelete(doc: VehicleDocument): void {
    const vehicleId = this.vehicle()._id;
    if (!vehicleId || !doc._id) return;
    this.deleteDocument.emit({ vehicleId, docId: doc._id });
  }

  fileUrl(doc: VehicleDocument): string {
    return `${environment.apiUrl}uploads/vehicules/${doc.filename}`;
  }
}
