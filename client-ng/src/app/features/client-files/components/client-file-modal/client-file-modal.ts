import { Component, OnChanges, SimpleChanges, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, X, FileSpreadsheet } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import {
  ClientFile,
  ClientFileForm,
  Equipement,
} from '../../../../shared/models/client-file/client-file.model';
import { ToastService } from '../../../../core/toast/toast.service';
import { requiredTrimmedValidator } from '../../../../shared/utils/validators/validators.utils';

// #region BDC parsing

type BDCEntry =
  | { type: 'str'; key: keyof ClientFileForm }
  | { type: 'bool'; key: keyof ClientFileForm }
  | { type: 'equipNum'; key: keyof Equipement }
  | { type: 'equipBool'; key: keyof Equipement };

/* eslint-disable @typescript-eslint/naming-convention */
const BDC_MAP: Record<string, BDCEntry> = {
  societe: { type: 'str', key: 'company' },
  'raison social': { type: 'str', key: 'legalName' },
  'raison sociale': { type: 'str', key: 'legalName' },
  nom: { type: 'str', key: 'lastName' },
  prenom: { type: 'str', key: 'firstName' },
  'nom du magasin': { type: 'str', key: 'storeName' },
  'statuts juridique': { type: 'str', key: 'legalStatus' },
  'statut juridique': { type: 'str', key: 'legalStatus' },
  adresse: { type: 'str', key: 'address' },
  cp: { type: 'str', key: 'postalCode' },
  'code postal': { type: 'str', key: 'postalCode' },
  ville: { type: 'str', key: 'city' },
  tel: { type: 'str', key: 'phone' },
  telephone: { type: 'str', key: 'phone' },
  mobile: { type: 'str', key: 'mobile' },
  email: { type: 'str', key: 'email' },
  'e-mail': { type: 'str', key: 'email' },
  'n de siret': { type: 'str', key: 'siret' },
  siret: { type: 'str', key: 'siret' },
  'n tva intra': { type: 'str', key: 'vatNumber' },
  'tva intra': { type: 'str', key: 'vatNumber' },
  'tva intracommunautaire': { type: 'str', key: 'vatNumber' },
  'n de tva intra': { type: 'str', key: 'vatNumber' },
  'n de tva intracommunautaire': { type: 'str', key: 'vatNumber' },
  'code naf': { type: 'str', key: 'nafCode' },
  'jour(s) de fermeture': { type: 'str', key: 'closingDays' },
  'jours de fermeture': { type: 'str', key: 'closingDays' },
  'ouverture prevue': { type: 'str', key: 'plannedOpening' },
  'date installation souhaitee': { type: 'str', key: 'desiredInstallationDate' },
  "date d'installation souhaitee": { type: 'str', key: 'desiredInstallationDate' },
  'date formation souhaitee': { type: 'str', key: 'desiredTrainingDate' },
  'date de formation souhaitee': { type: 'str', key: 'desiredTrainingDate' },
  'visite de preinstallation': { type: 'bool', key: 'preInstallationVisit' },
  'visite de pre-installation': { type: 'bool', key: 'preInstallationVisit' },
  'saisir un fichier produit': { type: 'bool', key: 'productFileEntry' },
  'saisir un fichier de produit': { type: 'bool', key: 'productFileEntry' },
  'decoupe du plan - menuiserie': { type: 'bool', key: 'carpentryPlanCutout' },
  'decoupe du plan a effectuer - menuiserie': { type: 'bool', key: 'carpentryPlanCutout' },
  'decoupe du plan - marbrerie': { type: 'bool', key: 'stoneworkPlanCutout' },
  'decoupe du plan a effectuer - marbrerie': { type: 'bool', key: 'stoneworkPlanCutout' },
  remarques: { type: 'str', key: 'notes' },
  'remarques particulieres': { type: 'str', key: 'notes' },
  'nombre de caisses': { type: 'equipNum', key: 'registerCount' },
  caisses: { type: 'equipNum', key: 'registerCount' },
  'nombre de cashguard': { type: 'equipNum', key: 'cashguardCount' },
  cashguard: { type: 'equipNum', key: 'cashguardCount' },
  'nombre de fusion': { type: 'equipNum', key: 'fusionCount' },
  fusion: { type: 'equipNum', key: 'fusionCount' },
  'autres materiels': { type: 'equipNum', key: 'otherEquipmentCount' },
  'nombre de balances/caisses': { type: 'equipNum', key: 'scaleCount' },
  'nombre de balances': { type: 'equipNum', key: 'scaleCount' },
  'licences tactis': { type: 'equipNum', key: 'tactisLicenses' },
  'licence tactis': { type: 'equipNum', key: 'tactisLicenses' },
  'licences inno': { type: 'equipNum', key: 'innoLicenses' },
  'licence inno': { type: 'equipNum', key: 'innoLicenses' },
  'pc backoffice': { type: 'equipNum', key: 'backofficePcCount' },
  'pc de gestion': { type: 'equipNum', key: 'backofficePcCount' },
  'pc de centralisation': { type: 'equipNum', key: 'centralizationPcCount' },
  'pc centralisation': { type: 'equipNum', key: 'centralizationPcCount' },
  'borne allergene': { type: 'equipBool', key: 'allergenKiosk' },
  'borne de commande': { type: 'equipBool', key: 'orderKiosk' },
  'etiquettes electronique': { type: 'equipBool', key: 'electronicLabels' },
  'carte fidelite': { type: 'equipBool', key: 'loyaltyCard' },
};

function stripDiacritics(value: string): string {
  return value
    .normalize('NFD')
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code < 0x0300 || code > 0x036f;
    })
    .join('');
}

function normalizeKey(value: string): string {
  return stripDiacritics(value).replace(/\./g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

const BDC_MAP_NORM: Record<string, BDCEntry> = Object.fromEntries(
  Object.entries(BDC_MAP).map(([key, entry]) => [normalizeKey(key), entry]),
);

function toBool(value: string): boolean {
  const normalized = value.toLowerCase().trim();
  return (
    normalized === 'oui' ||
    normalized === 'true' ||
    normalized === '1' ||
    normalized === 'x' ||
    normalized === 'yes'
  );
}

function toNum(value: string): number {
  const normalized = value.toLowerCase().trim();
  if (normalized === 'x' || normalized === 'oui' || normalized === 'yes') return 1;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
}

type BDCPatch = Omit<Partial<ClientFileForm>, 'equipment'> & { equipment?: Partial<Equipement> };

function applyBDCEntries(entries: { label: string; value: string }[]): BDCPatch {
  const patch: BDCPatch = {};
  for (const { label, value } of entries) {
    const key = normalizeKey(label);
    const mapping = BDC_MAP_NORM[key];
    if (!mapping) continue;
    const trimmedValue = value.trim();
    if (mapping.type === 'str') {
      (patch as Record<string, unknown>)[mapping.key] = trimmedValue;
    } else if (mapping.type === 'bool') {
      (patch as Record<string, unknown>)[mapping.key] = toBool(trimmedValue);
    } else if (mapping.type === 'equipNum') {
      if (!patch.equipment) patch.equipment = {};
      (patch.equipment as unknown as Record<string, unknown>)[mapping.key] = toNum(trimmedValue);
    } else if (mapping.type === 'equipBool') {
      if (!patch.equipment) patch.equipment = {};
      (patch.equipment as unknown as Record<string, unknown>)[mapping.key] = toBool(trimmedValue);
    }
  }
  return patch;
}

async function parseXlsxBDC(file: File): Promise<BDCPatch> {
  const XLSX = await import('@e965/xlsx');
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    raw: false,
    defval: '',
  }) as unknown[][];

  const entries: { label: string; value: string }[] = [];
  for (const row of rows) {
    const labelColumnAB = String(row[0] ?? '')
      .replace(/\s*:?\s*$/, '')
      .trim();
    const valueColumnAB = String(row[1] ?? '')
      .trim()
      .replace(/^\$/, '')
      .replace(/^\.(?=\d)/, '');
    if (labelColumnAB) entries.push({ label: labelColumnAB, value: valueColumnAB });

    const labelColumnCD = String(row[2] ?? '')
      .replace(/\s*:?\s*$/, '')
      .trim();
    const valueColumnCD = String(row[3] ?? '')
      .trim()
      .replace(/^\$/, '')
      .replace(/^\.(?=\d)/, '');
    if (labelColumnCD) entries.push({ label: labelColumnCD, value: valueColumnCD });
  }

  return applyBDCEntries(entries.filter((e) => e.value !== ''));
}
// #endregion

// #region Empty form

const emptyEquipement: Equipement = {
  cashguardCount: 0,
  fusionCount: 0,
  registerCount: 0,
  otherEquipmentCount: 0,
  scaleCount: 0,
  tactisLicenses: 0,
  innoLicenses: 0,
  backofficePcCount: 0,
  centralizationPcCount: 0,
  allergenKiosk: false,
  orderKiosk: false,
  electronicLabels: false,
  loyaltyCard: false,
};

function emptyForm(): ClientFileForm {
  return {
    company: '',
    lastName: '',
    firstName: '',
    address: '',
    postalCode: '',
    city: '',
    phone: '',
    mobile: '',
    email: '',
    legalStatus: '',
    legalName: '',
    storeName: '',
    siret: '',
    vatNumber: '',
    nafCode: '',
    closingDays: '',
    preInstallationVisit: false,
    desiredInstallationDate: '',
    desiredTrainingDate: '',
    productFileEntry: false,
    carpentryPlanCutout: false,
    stoneworkPlanCutout: false,
    plannedOpening: '',
    equipment: { ...emptyEquipement },
    notes: '',
  };
}
// #endregion

// #region Component

@Component({
  selector: 'app-client-file-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './client-file-modal.html',
  styleUrl: './client-file-modal.scss',
})
export class ClientFileModal implements OnChanges {
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  file = input<ClientFile | null>(null);
  save = output<{ id?: string; data: ClientFileForm }>();
  closed = output<void>();

  readonly x = X;
  readonly fileSpreadsheet = FileSpreadsheet;

  lastNameControl = this.fb.nonNullable.control('', requiredTrimmedValidator);

  form: ClientFileForm = emptyForm();
  xlsxImporting = signal(false);
  isDragging = signal(false);

  readonly checkboxFields: { key: keyof ClientFileForm; label: string }[] = [
    { key: 'preInstallationVisit', label: 'CLIENT_FILES.VISIT_PREINSTALL' },
    { key: 'productFileEntry', label: 'CLIENT_FILES.PRODUCT_FILE' },
    { key: 'carpentryPlanCutout', label: 'CLIENT_FILES.CUT_JOINERY' },
    { key: 'stoneworkPlanCutout', label: 'CLIENT_FILES.CUT_MARBLE' },
  ];

  readonly equipNumFields: { key: keyof Equipement; label: string }[] = [
    { key: 'cashguardCount', label: 'CLIENT_FILES.NB_CASHGUARD' },
    { key: 'fusionCount', label: 'CLIENT_FILES.NB_FUSION' },
    { key: 'registerCount', label: 'CLIENT_FILES.NB_REGISTERS' },
    { key: 'otherEquipmentCount', label: 'CLIENT_FILES.NB_OTHER' },
    { key: 'scaleCount', label: 'CLIENT_FILES.NB_SCALES' },
    { key: 'tactisLicenses', label: 'CLIENT_FILES.LICENCES_TACTIS' },
    { key: 'innoLicenses', label: 'CLIENT_FILES.LICENCES_INNO' },
    { key: 'backofficePcCount', label: 'CLIENT_FILES.PC_BACKOFFICE' },
    { key: 'centralizationPcCount', label: 'CLIENT_FILES.PC_CENTRALIZATION' },
  ];

  readonly equipBoolFields: { key: keyof Equipement; label: string }[] = [
    { key: 'allergenKiosk', label: 'CLIENT_FILES.ALLERGEN_KIOSK' },
    { key: 'orderKiosk', label: 'CLIENT_FILES.ORDER_KIOSK' },
    { key: 'electronicLabels', label: 'CLIENT_FILES.ELEC_LABELS' },
    { key: 'loyaltyCard', label: 'CLIENT_FILES.LOYALTY_CARD' },
  ];

  get isEdit(): boolean {
    return !!this.file();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['file']) {
      const file = this.file();
      this.form = file
        ? {
            company: file.company ?? '',
            lastName: file.lastName ?? '',
            firstName: file.firstName ?? '',
            address: file.address ?? '',
            postalCode: file.postalCode ?? '',
            city: file.city ?? '',
            phone: file.phone ?? '',
            mobile: file.mobile ?? '',
            email: file.email ?? '',
            legalStatus: file.legalStatus ?? '',
            legalName: file.legalName ?? '',
            storeName: file.storeName ?? '',
            siret: file.siret ?? '',
            vatNumber: file.vatNumber ?? '',
            nafCode: file.nafCode ?? '',
            closingDays: file.closingDays ?? '',
            preInstallationVisit: file.preInstallationVisit,
            desiredInstallationDate: file.desiredInstallationDate ?? '',
            desiredTrainingDate: file.desiredTrainingDate ?? '',
            productFileEntry: file.productFileEntry,
            carpentryPlanCutout: file.carpentryPlanCutout,
            stoneworkPlanCutout: file.stoneworkPlanCutout,
            plannedOpening: file.plannedOpening ?? '',
            equipment: { ...emptyEquipement, ...file.equipment },
            notes: file.notes ?? '',
          }
        : emptyForm();
      this.lastNameControl.setValue(this.form.lastName);
    }
  }

  getStr(key: keyof ClientFileForm): string {
    return (this.form[key] as string | undefined) ?? '';
  }

  setStr(key: keyof ClientFileForm, value: string): void {
    (this.form as Record<string, unknown>)[key] = value;
  }

  getBool(key: keyof ClientFileForm): boolean {
    return !!(this.form[key] as boolean | undefined);
  }

  setBool(key: keyof ClientFileForm, value: boolean): void {
    (this.form as Record<string, unknown>)[key] = value;
  }

  getEquipNum(key: keyof Equipement): number {
    return (this.form.equipment[key] as number | undefined) ?? 0;
  }

  setEquipNum(key: keyof Equipement, raw: string): void {
    (this.form.equipment as unknown as Record<string, unknown>)[key] = parseInt(raw, 10) || 0;
  }

  getEquipBool(key: keyof Equipement): boolean {
    return !!(this.form.equipment[key] as boolean | undefined);
  }

  setEquipBool(key: keyof Equipement, value: boolean): void {
    (this.form.equipment as unknown as Record<string, unknown>)[key] = value;
  }

  async onXlsxChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    await this.importXlsx(file);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (!file) return;
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      await this.importXlsx(file);
    }
  }

  private async importXlsx(file: File): Promise<void> {
    this.xlsxImporting.set(true);
    try {
      const patch = await parseXlsxBDC(file);
      this.applyPatch(patch);
      const count =
        Object.keys(patch).filter((k) => k !== 'equipment').length +
        Object.keys(patch.equipment ?? {}).length;
      this.toast.success('TOAST.PURCHASE_ORDER_UPDATED', { count });
    } catch {
      this.toast.error('TOAST.PURCHASE_ORDER_ERROR');
    } finally {
      this.xlsxImporting.set(false);
    }
  }

  private applyPatch(patch: BDCPatch): void {
    const { equipment, ...rest } = patch;
    Object.assign(this.form, rest);
    if (equipment) {
      this.form.equipment = { ...this.form.equipment, ...equipment };
    }
    this.lastNameControl.setValue(this.form.lastName);
  }

  submit(): void {
    if (this.lastNameControl.invalid) {
      this.lastNameControl.markAsTouched();
      return;
    }
    this.save.emit({
      id: this.file()?._id,
      data: { ...this.form, lastName: this.lastNameControl.value },
    });
  }
}
// #endregion
