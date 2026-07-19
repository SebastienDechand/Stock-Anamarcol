import {
  Component,
  OnChanges,
  SimpleChanges,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, FileSpreadsheet } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import {
  ClientFile,
  ClientFileForm,
  Equipement,
} from '../../../../shared/models/client-file.model';
import { ToastService } from '../../../../core/toast/toast.service';

// ─── BDC parsing ─────────────────────────────────────────────────────────────

type BDCEntry =
  | { type: 'str'; key: keyof ClientFileForm }
  | { type: 'bool'; key: keyof ClientFileForm }
  | { type: 'equipNum'; key: keyof Equipement }
  | { type: 'equipBool'; key: keyof Equipement };

/* eslint-disable @typescript-eslint/naming-convention */
const BDC_MAP: Record<string, BDCEntry> = {
  societe: { type: 'str', key: 'societe' },
  'raison social': { type: 'str', key: 'raisonSociale' },
  'raison sociale': { type: 'str', key: 'raisonSociale' },
  nom: { type: 'str', key: 'nom' },
  prenom: { type: 'str', key: 'prenom' },
  'nom du magasin': { type: 'str', key: 'nomMagasin' },
  'statuts juridique': { type: 'str', key: 'statutJuridique' },
  'statut juridique': { type: 'str', key: 'statutJuridique' },
  adresse: { type: 'str', key: 'adresse' },
  cp: { type: 'str', key: 'cp' },
  'code postal': { type: 'str', key: 'cp' },
  ville: { type: 'str', key: 'ville' },
  tel: { type: 'str', key: 'tel' },
  telephone: { type: 'str', key: 'tel' },
  mobile: { type: 'str', key: 'mobile' },
  email: { type: 'str', key: 'email' },
  'e-mail': { type: 'str', key: 'email' },
  'n de siret': { type: 'str', key: 'siret' },
  siret: { type: 'str', key: 'siret' },
  'n tva intra': { type: 'str', key: 'tvaIntra' },
  'tva intra': { type: 'str', key: 'tvaIntra' },
  'tva intracommunautaire': { type: 'str', key: 'tvaIntra' },
  'n de tva intra': { type: 'str', key: 'tvaIntra' },
  'n de tva intracommunautaire': { type: 'str', key: 'tvaIntra' },
  'code naf': { type: 'str', key: 'codeNaf' },
  'jour(s) de fermeture': { type: 'str', key: 'joursFermeture' },
  'jours de fermeture': { type: 'str', key: 'joursFermeture' },
  'ouverture prevue': { type: 'str', key: 'ouverturePrevue' },
  'date installation souhaitee': { type: 'str', key: 'dateInstallationSouhaitee' },
  "date d'installation souhaitee": { type: 'str', key: 'dateInstallationSouhaitee' },
  'date formation souhaitee': { type: 'str', key: 'dateFormationSouhaitee' },
  'date de formation souhaitee': { type: 'str', key: 'dateFormationSouhaitee' },
  'visite de preinstallation': { type: 'bool', key: 'visitePreinstallation' },
  'visite de pre-installation': { type: 'bool', key: 'visitePreinstallation' },
  'saisir un fichier produit': { type: 'bool', key: 'saisirFichierProduit' },
  'saisir un fichier de produit': { type: 'bool', key: 'saisirFichierProduit' },
  'decoupe du plan - menuiserie': { type: 'bool', key: 'decoupePlanMenuiserie' },
  'decoupe du plan a effectuer - menuiserie': { type: 'bool', key: 'decoupePlanMenuiserie' },
  'decoupe du plan - marbrerie': { type: 'bool', key: 'decoupePlanMarbrerie' },
  'decoupe du plan a effectuer - marbrerie': { type: 'bool', key: 'decoupePlanMarbrerie' },
  remarques: { type: 'str', key: 'remarques' },
  'remarques particulieres': { type: 'str', key: 'remarques' },
  'nombre de caisses': { type: 'equipNum', key: 'nbCaisses' },
  caisses: { type: 'equipNum', key: 'nbCaisses' },
  'nombre de cashguard': { type: 'equipNum', key: 'nbCashguard' },
  cashguard: { type: 'equipNum', key: 'nbCashguard' },
  'nombre de fusion': { type: 'equipNum', key: 'nbFusion' },
  fusion: { type: 'equipNum', key: 'nbFusion' },
  'autres materiels': { type: 'equipNum', key: 'nbAutresMateriels' },
  'nombre de balances/caisses': { type: 'equipNum', key: 'nbBalancesCaisses' },
  'nombre de balances': { type: 'equipNum', key: 'nbBalancesCaisses' },
  'licences tactis': { type: 'equipNum', key: 'licencesTactis' },
  'licence tactis': { type: 'equipNum', key: 'licencesTactis' },
  'licences inno': { type: 'equipNum', key: 'licencesInno' },
  'licence inno': { type: 'equipNum', key: 'licencesInno' },
  'pc backoffice': { type: 'equipNum', key: 'pcBackoffice' },
  'pc de gestion': { type: 'equipNum', key: 'pcBackoffice' },
  'pc de centralisation': { type: 'equipNum', key: 'pcCentralisation' },
  'pc centralisation': { type: 'equipNum', key: 'pcCentralisation' },
  'borne allergene': { type: 'equipBool', key: 'borneAllergene' },
  'borne de commande': { type: 'equipBool', key: 'borneCommande' },
  'etiquettes electronique': { type: 'equipBool', key: 'etiquettesElectronique' },
  'carte fidelite': { type: 'equipBool', key: 'carteFidelite' },
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

type BDCPatch = Omit<Partial<ClientFileForm>, 'equipement'> & { equipement?: Partial<Equipement> };

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
      if (!patch.equipement) patch.equipement = {};
      (patch.equipement as unknown as Record<string, unknown>)[mapping.key] = toNum(trimmedValue);
    } else if (mapping.type === 'equipBool') {
      if (!patch.equipement) patch.equipement = {};
      (patch.equipement as unknown as Record<string, unknown>)[mapping.key] = toBool(trimmedValue);
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

// ─── Empty form ───────────────────────────────────────────────────────────────

const emptyEquipement: Equipement = {
  nbCashguard: 0,
  nbFusion: 0,
  nbCaisses: 0,
  nbAutresMateriels: 0,
  nbBalancesCaisses: 0,
  licencesTactis: 0,
  licencesInno: 0,
  pcBackoffice: 0,
  pcCentralisation: 0,
  borneAllergene: false,
  borneCommande: false,
  etiquettesElectronique: false,
  carteFidelite: false,
};

function emptyForm(): ClientFileForm {
  return {
    societe: '',
    nom: '',
    prenom: '',
    adresse: '',
    cp: '',
    ville: '',
    tel: '',
    mobile: '',
    email: '',
    statutJuridique: '',
    raisonSociale: '',
    nomMagasin: '',
    siret: '',
    tvaIntra: '',
    codeNaf: '',
    joursFermeture: '',
    visitePreinstallation: false,
    dateInstallationSouhaitee: '',
    dateFormationSouhaitee: '',
    saisirFichierProduit: false,
    decoupePlanMenuiserie: false,
    decoupePlanMarbrerie: false,
    ouverturePrevue: '',
    equipement: { ...emptyEquipement },
    remarques: '',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-client-file-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './client-file-modal.html',
  styleUrl: './client-file-modal.scss',
})
export class ClientFileModal implements OnChanges {
  private toast = inject(ToastService);

  file = input<ClientFile | null>(null);
  save = output<{ id?: string; data: ClientFileForm }>();
  closed = output<void>();

  readonly x = X;
  readonly fileSpreadsheet = FileSpreadsheet;

  form: ClientFileForm = emptyForm();
  xlsxImporting = signal(false);
  isDragging = signal(false);

  readonly checkboxFields: { key: keyof ClientFileForm; label: string }[] = [
    { key: 'visitePreinstallation', label: 'CLIENT_FILES.VISIT_PREINSTALL' },
    { key: 'saisirFichierProduit', label: 'CLIENT_FILES.PRODUCT_FILE' },
    { key: 'decoupePlanMenuiserie', label: 'CLIENT_FILES.CUT_JOINERY' },
    { key: 'decoupePlanMarbrerie', label: 'CLIENT_FILES.CUT_MARBLE' },
  ];

  readonly equipNumFields: { key: keyof Equipement; label: string }[] = [
    { key: 'nbCashguard', label: 'CLIENT_FILES.NB_CASHGUARD' },
    { key: 'nbFusion', label: 'CLIENT_FILES.NB_FUSION' },
    { key: 'nbCaisses', label: 'CLIENT_FILES.NB_CAISSES' },
    { key: 'nbAutresMateriels', label: 'CLIENT_FILES.NB_OTHER' },
    { key: 'nbBalancesCaisses', label: 'CLIENT_FILES.NB_SCALES' },
    { key: 'licencesTactis', label: 'CLIENT_FILES.LICENCES_TACTIS' },
    { key: 'licencesInno', label: 'CLIENT_FILES.LICENCES_INNO' },
    { key: 'pcBackoffice', label: 'CLIENT_FILES.PC_BACKOFFICE' },
    { key: 'pcCentralisation', label: 'CLIENT_FILES.PC_CENTRALISATION' },
  ];

  readonly equipBoolFields: { key: keyof Equipement; label: string }[] = [
    { key: 'borneAllergene', label: 'CLIENT_FILES.BORNE_ALLERGENE' },
    { key: 'borneCommande', label: 'CLIENT_FILES.BORNE_COMMANDE' },
    { key: 'etiquettesElectronique', label: 'CLIENT_FILES.ETIQUETTES' },
    { key: 'carteFidelite', label: 'CLIENT_FILES.CARTE_FIDELITE' },
  ];

  get isEdit(): boolean {
    return !!this.file();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['file']) {
      const file = this.file();
      this.form = file
        ? {
            societe: file.societe ?? '',
            nom: file.nom ?? '',
            prenom: file.prenom ?? '',
            adresse: file.adresse ?? '',
            cp: file.cp ?? '',
            ville: file.ville ?? '',
            tel: file.tel ?? '',
            mobile: file.mobile ?? '',
            email: file.email ?? '',
            statutJuridique: file.statutJuridique ?? '',
            raisonSociale: file.raisonSociale ?? '',
            nomMagasin: file.nomMagasin ?? '',
            siret: file.siret ?? '',
            tvaIntra: file.tvaIntra ?? '',
            codeNaf: file.codeNaf ?? '',
            joursFermeture: file.joursFermeture ?? '',
            visitePreinstallation: file.visitePreinstallation,
            dateInstallationSouhaitee: file.dateInstallationSouhaitee ?? '',
            dateFormationSouhaitee: file.dateFormationSouhaitee ?? '',
            saisirFichierProduit: file.saisirFichierProduit,
            decoupePlanMenuiserie: file.decoupePlanMenuiserie,
            decoupePlanMarbrerie: file.decoupePlanMarbrerie,
            ouverturePrevue: file.ouverturePrevue ?? '',
            equipement: { ...emptyEquipement, ...file.equipement },
            remarques: file.remarques ?? '',
          }
        : emptyForm();
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
    return (this.form.equipement[key] as number | undefined) ?? 0;
  }

  setEquipNum(key: keyof Equipement, raw: string): void {
    (this.form.equipement as unknown as Record<string, unknown>)[key] = parseInt(raw, 10) || 0;
  }

  getEquipBool(key: keyof Equipement): boolean {
    return !!(this.form.equipement[key] as boolean | undefined);
  }

  setEquipBool(key: keyof Equipement, value: boolean): void {
    (this.form.equipement as unknown as Record<string, unknown>)[key] = value;
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
        Object.keys(patch).filter((k) => k !== 'equipement').length +
        Object.keys(patch.equipement ?? {}).length;
      this.toast.success('TOAST.BDC_UPDATED', { count });
    } catch {
      this.toast.error('TOAST.BDC_ERROR');
    } finally {
      this.xlsxImporting.set(false);
    }
  }

  private applyPatch(patch: BDCPatch): void {
    const { equipement, ...rest } = patch;
    Object.assign(this.form, rest);
    if (equipement) {
      this.form.equipement = { ...this.form.equipement, ...equipement };
    }
  }

  submit(): void {
    if (!this.form.nom.trim()) return;
    this.save.emit({ id: this.file()?._id, data: { ...this.form } });
  }
}
