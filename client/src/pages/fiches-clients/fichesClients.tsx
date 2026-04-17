import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../hooks/redux";
import { UidContext } from "../../components/AppContext";
import AccessDenied from "../../components/AccessDenied/AccessDenied";
import {
  getAllClientFiles,
  createClientFile,
  updateClientFile,
  deleteClientFile,
  setSelectedClientFile,
} from "../../actions/clientFile.actions";
import Portal from "../../components/Portal";
import {
  Plus,
  X,
  Search,
  Building2,
  MapPin,
  Phone,
  Mail,
  FolderOpen,
  FileText,
  ClipboardList,
  Trash2,
  Pencil,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import type { ClientFile, ClientFilesState, Equipement } from "../../types";

// ─── BDC Import helpers ───────────────────────────────────────────────────────
type BDCEntry =
  | { type: "str"; key: string }
  | { type: "bool"; key: string }
  | { type: "equipNum"; key: keyof Equipement }
  | { type: "equipBool"; key: keyof Equipement };

const BDC_MAP: Record<string, BDCEntry> = {
  // identité
  societe: { type: "str", key: "societe" },
  société: { type: "str", key: "societe" },
  nom: { type: "str", key: "nom" },
  prenom: { type: "str", key: "prenom" },
  prénom: { type: "str", key: "prenom" },
  "raison social": { type: "str", key: "raisonSociale" },
  "raison sociale": { type: "str", key: "raisonSociale" },
  "nom du magasin": { type: "str", key: "nomMagasin" },
  "statuts juridique": { type: "str", key: "statutJuridique" },
  "statut juridique": { type: "str", key: "statutJuridique" },
  // coordonnées
  adresse: { type: "str", key: "adresse" },
  cp: { type: "str", key: "cp" },
  "code postal": { type: "str", key: "cp" },
  ville: { type: "str", key: "ville" },
  tel: { type: "str", key: "tel" },
  telephone: { type: "str", key: "tel" },
  téléphone: { type: "str", key: "tel" },
  mobile: { type: "str", key: "mobile" },
  email: { type: "str", key: "email" },
  "e-mail": { type: "str", key: "email" },
  "n° de siret": { type: "str", key: "siret" },
  siret: { type: "str", key: "siret" },
  "n° de tva intra": { type: "str", key: "tvaIntra" },
  "n° de tva intracommunautaire": { type: "str", key: "tvaIntra" },
  "n° de t.v.a intracommunautaire": { type: "str", key: "tvaIntra" },
  "n° tva intra": { type: "str", key: "tvaIntra" },
  "n° tva intracommunautaire": { type: "str", key: "tvaIntra" },
  "n° tva": { type: "str", key: "tvaIntra" },
  "tva intra": { type: "str", key: "tvaIntra" },
  "tva intracommunautaire": { type: "str", key: "tvaIntra" },
  "numero de tva intra": { type: "str", key: "tvaIntra" },
  "numero de tva intracommunautaire": { type: "str", key: "tvaIntra" },
  "numéro de tva intra": { type: "str", key: "tvaIntra" },
  "numero tva": { type: "str", key: "tvaIntra" },
  "no tva intra": { type: "str", key: "tvaIntra" },
  "code naf": { type: "str", key: "codeNaf" },
  "jour(s) de fermeture": { type: "str", key: "joursFermeture" },
  "jours de fermeture": { type: "str", key: "joursFermeture" },
  // planning
  "ouverture prevue": { type: "str", key: "ouverturePrevue" },
  "ouverture prévue": { type: "str", key: "ouverturePrevue" },
  "date installation souhaitee": {
    type: "str",
    key: "dateInstallationSouhaitee",
  },
  "date installation souhaitée": {
    type: "str",
    key: "dateInstallationSouhaitee",
  },
  "date installation souhaité": {
    type: "str",
    key: "dateInstallationSouhaitee",
  },
  "date d'installation souhaitée": {
    type: "str",
    key: "dateInstallationSouhaitee",
  },
  "date formation souhaitee": { type: "str", key: "dateFormationSouhaitee" },
  "date formation souhaitée": { type: "str", key: "dateFormationSouhaitee" },
  "date de formation souhaitée": { type: "str", key: "dateFormationSouhaitee" },
  // booleans (OUI / NON)
  "visite de preinstallation": { type: "bool", key: "visitePreinstallation" },
  "visite de préinstallation": { type: "bool", key: "visitePreinstallation" },
  "visite de pré-installation": { type: "bool", key: "visitePreinstallation" },
  "saisir un fichier produit": { type: "bool", key: "saisirFichierProduit" },
  "saisir un fichier de produit": { type: "bool", key: "saisirFichierProduit" },
  "decoupe du plan - menuiserie": {
    type: "bool",
    key: "decoupePlanMenuiserie",
  },
  "découpe du plan - menuiserie": {
    type: "bool",
    key: "decoupePlanMenuiserie",
  },
  "découpe du plan à effectuer - menuiserie": {
    type: "bool",
    key: "decoupePlanMenuiserie",
  },
  "decoupe du plan - marbrerie": { type: "bool", key: "decoupePlanMarbrerie" },
  "découpe du plan - marbrerie": { type: "bool", key: "decoupePlanMarbrerie" },
  "découpe du plan à effectuer - marbrerie": {
    type: "bool",
    key: "decoupePlanMarbrerie",
  },
  // equipement - numbers
  "nombre de caisses": { type: "equipNum", key: "nbCaisses" },
  "nombre de cashguard": { type: "equipNum", key: "nbCashguard" },
  "nb cashguard": { type: "equipNum", key: "nbCashguard" },
  cashguard: { type: "equipNum", key: "nbCashguard" },
  "nombre de fusion": { type: "equipNum", key: "nbFusion" },
  "nb fusion": { type: "equipNum", key: "nbFusion" },
  fusion: { type: "equipNum", key: "nbFusion" },
  caisses: { type: "equipNum", key: "nbCaisses" },
  "autres materiels": { type: "equipNum", key: "nbAutresMateriels" },
  "autres materiaux": { type: "equipNum", key: "nbAutresMateriels" },
  "autres matériels": { type: "equipNum", key: "nbAutresMateriels" },
  "nombre de balances/caisses": { type: "equipNum", key: "nbBalancesCaisses" },
  "nombre de balances": { type: "equipNum", key: "nbBalancesCaisses" },
  "nb balances/caisses": { type: "equipNum", key: "nbBalancesCaisses" },
  "licences tactis": { type: "equipNum", key: "licencesTactis" },
  "licence tactis": { type: "equipNum", key: "licencesTactis" },
  "licences inno": { type: "equipNum", key: "licencesInno" },
  "licence inno": { type: "equipNum", key: "licencesInno" },
  "pc backoffice": { type: "equipNum", key: "pcBackoffice" },
  "pc de gestion": { type: "equipNum", key: "pcBackoffice" },
  "pc gestion": { type: "equipNum", key: "pcBackoffice" },
  "pc de centralisation": { type: "equipNum", key: "pcCentralisation" },
  "pc centralisation": { type: "equipNum", key: "pcCentralisation" },
  // equipement - booleans
  "borne allergene": { type: "equipBool", key: "borneAllergene" },
  "borne allergène": { type: "equipBool", key: "borneAllergene" },
  "borne de commande": { type: "equipBool", key: "borneCommande" },
  "etiquettes electronique": {
    type: "equipBool",
    key: "etiquettesElectronique",
  },
  "étiquettes électroniques": {
    type: "equipBool",
    key: "etiquettesElectronique",
  },
  "carte fidelite": { type: "equipBool", key: "carteFidelite" },
  "carte fidélité": { type: "equipBool", key: "carteFidelite" },
  // misc
  remarques: { type: "str", key: "remarques" },
  "remarques particulières": { type: "str", key: "remarques" },
  "remarques particulieres": { type: "str", key: "remarques" },
};

type ClientFormSnapshot = ReturnType<typeof emptyForm>;
type BDCPatch = Omit<Partial<ClientFormSnapshot>, "equipement"> & {
  equipement?: Partial<Equipement>;
};

/** Lowercase + strip accents + strip dots + collapse spaces → robust key lookup */
function normalizeKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // accents
    .replace(/\./g, "") // T.V.A → TVA
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** BDC_MAP indexed by normalized key for accent-insensitive matching */
const BDC_MAP_NORM: Record<string, (typeof BDC_MAP)[keyof typeof BDC_MAP]> =
  Object.fromEntries(
    Object.entries(BDC_MAP).map(([k, v]) => [normalizeKey(k), v]),
  );

/** Resolve a raw value to boolean */
function toBool(v: string): boolean {
  const vl = v.toLowerCase().trim();
  return (
    vl === "oui" || vl === "true" || vl === "1" || vl === "x" || vl === "yes"
  );
}

/** Resolve a raw value to number — treats x/X/oui as 1 */
function toNum(v: string): number {
  const vl = v.toLowerCase().trim();
  if (vl === "x" || vl === "oui" || vl === "yes") return 1;
  const n = parseInt(v, 10);
  return isNaN(n) ? 0 : n;
}

function applyBDCEntries(
  entries: { label: string; value: string }[],
): BDCPatch {
  const patch: BDCPatch = {};
  for (const { label, value } of entries) {
    const key = normalizeKey(label);
    const mapping = BDC_MAP_NORM[key];
    if (!mapping) continue;
    const v = value.trim();
    if (mapping.type === "str") {
      (patch as Record<string, unknown>)[mapping.key] = v;
    } else if (mapping.type === "bool") {
      (patch as Record<string, unknown>)[mapping.key] = toBool(v);
    } else if (mapping.type === "equipNum") {
      if (!patch.equipement) patch.equipement = {};
      (patch.equipement as Record<string, unknown>)[mapping.key] = toNum(v);
    } else if (mapping.type === "equipBool") {
      if (!patch.equipement) patch.equipement = {};
      (patch.equipement as Record<string, unknown>)[mapping.key] = toBool(v);
    }
  }
  return patch;
}

function parsePastedBDC(text: string): BDCPatch {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const entries: { label: string; value: string }[] = [];
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    entries.push({
      label: line.substring(0, idx),
      value: line.substring(idx + 1),
    });
  }
  return applyBDCEntries(entries);
}

/** Strip Excel formatting artefacts: leading $, leading dot, trailing spaces */
function cleanValue(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .replace(/^\$/, "") // $94140 → 94140
    .replace(/^\.(?=\d)/, ""); // .0633698793 → 0633698793
}

async function parseXlsxBDC(file: File): Promise<{
  patch: BDCPatch;
  allEntries: { label: string; value: string }[];
}> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(buf), { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    raw: false,
    defval: "",
  }) as unknown[][];

  const allEntries: { label: string; value: string }[] = [];

  for (const row of rows) {
    // Columns A/B (index 0 & 1)
    const labelAB = String(row[0] ?? "")
      .replace(/\s*:?\s*$/, "")
      .trim();
    const valueAB = cleanValue(row[1]);
    if (labelAB) allEntries.push({ label: labelAB, value: valueAB });

    // Columns C/D (index 2 & 3) - equipment section
    const labelCD = String(row[2] ?? "")
      .replace(/\s*:?\s*$/, "")
      .trim();
    const valueCD = cleanValue(row[3]);
    if (labelCD) allEntries.push({ label: labelCD, value: valueCD });
  }

  const patch = applyBDCEntries(allEntries.filter((e) => e.value !== ""));
  return { patch, allEntries };
}

async function parsePdfBDC(file: File): Promise<BDCPatch> {
  const pdfjsLib = await import("pdfjs-dist");
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
  // Collect entries across all pages grouped by visual line (y-coordinate)
  const allEntries: { label: string; value: string }[] = [];

  type PdfTextItem = { str: string; transform: number[] };

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Group text items by rounded y-coordinate (tolerance ±3px)
    const lineMap = new Map<number, { str: string; x: number }[]>();

    for (const raw of content.items) {
      if (!("str" in raw)) continue;
      const item = raw as PdfTextItem;
      const text = item.str.trim();
      if (!text) continue;
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];

      // Find existing bucket within ±3px
      let bucket: number | undefined;
      for (const k of lineMap.keys()) {
        if (Math.abs(k - y) <= 3) {
          bucket = k;
          break;
        }
      }
      if (bucket === undefined) {
        lineMap.set(y, []);
        bucket = y;
      }
      lineMap.get(bucket)!.push({ str: text, x });
    }

    // Sort lines top→bottom (PDF y is bottom-up so descending y = top of page)
    const lines = [...lineMap.entries()]
      .sort(([a], [b]) => b - a)
      .map(([, items]) => items.sort((a, b) => a.x - b.x).map((i) => i.str));

    for (const lineItems of lines) {
      if (lineItems.length === 0) continue;

      // Pair items as (label, value).
      // A BDC key may span multiple consecutive PDF text items (e.g. "N°", "TVA",
      // "INTRA" are three separate items for the label "N° TVA INTRA"). We try to
      // concatenate up to 4 consecutive items to find the longest matching key,
      // then take the item immediately after as the value.
      // Standalone colon items (":" alone) between a key and its value are skipped.
      for (let j = 0; j < lineItems.length; ) {
        const item = lineItems[j].replace(/:+\s*$/, "").trim();
        if (!item) {
          j++;
          continue;
        }

        // Try matching 1–4 consecutive items as a BDC key (longest match first)
        let keyLen = 0;
        let rawLabel = "";
        for (
          let tryLen = Math.min(4, lineItems.length - j);
          tryLen >= 1;
          tryLen--
        ) {
          const candidate = lineItems
            .slice(j, j + tryLen)
            .map((s) => s.replace(/:+\s*$/, "").trim())
            .filter(Boolean)
            .join(" ");
          if (BDC_MAP_NORM[normalizeKey(candidate)]) {
            keyLen = tryLen;
            rawLabel = candidate;
            break;
          }
        }

        if (keyLen === 0) {
          // No key found — check for inline colon (e.g. "N° TVA INTRA : FR123…")
          const colonIdx = item.indexOf(":");
          if (colonIdx > 0) {
            allEntries.push({
              label: item.substring(0, colonIdx).trim(),
              value: item.substring(colonIdx + 1).trim(),
            });
          }
          j++;
          continue;
        }

        // Key found — skip standalone colon items, then take the next real item as value
        let valueIdx = j + keyLen;
        while (
          valueIdx < lineItems.length &&
          lineItems[valueIdx].replace(/[:\s]/g, "") === ""
        ) {
          valueIdx++;
        }
        const nextRaw =
          valueIdx < lineItems.length
            ? lineItems[valueIdx].replace(/:+\s*$/, "").trim()
            : null;

        if (nextRaw && !BDC_MAP_NORM[normalizeKey(nextRaw)]) {
          allEntries.push({ label: rawLabel, value: nextRaw });
          j = valueIdx + 1;
        } else {
          // No value after key — try inline colon on the first item
          const colonIdx = item.indexOf(":");
          if (colonIdx > 0) {
            allEntries.push({
              label: item.substring(0, colonIdx).trim(),
              value: item.substring(colonIdx + 1).trim(),
            });
          }
          j = valueIdx;
        }
      }
    }
  }

  // Fallback: if positional parsing found nothing, flag it
  if (allEntries.length === 0) {
    throw new Error(
      "Impossible d'extraire le texte du PDF (probablement un scan ou format non supporté)",
    );
  }

  return applyBDCEntries(allEntries);
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

const emptyForm = (): Omit<
  ClientFile,
  "_id" | "createdAt" | "updatedAt" | "createdBy"
> => ({
  societe: "",
  nom: "",
  prenom: "",
  adresse: "",
  cp: "",
  ville: "",
  tel: "",
  mobile: "",
  email: "",
  statutJuridique: "",
  raisonSociale: "",
  nomMagasin: "",
  siret: "",
  tvaIntra: "",
  codeNaf: "",
  joursFermeture: "",
  visitePreinstallation: false,
  dateInstallationSouhaitee: "",
  dateFormationSouhaitee: "",
  saisirFichierProduit: false,
  decoupePlanMenuiserie: false,
  decoupePlanMarbrerie: false,
  ouverturePrevue: "",
  equipement: { ...emptyEquipement },
  remarques: "",
});

// ─── Form Modal ───────────────────────────────────────────────────────────────
function ClientFileModal({
  onClose,
  existing,
}: {
  onClose: () => void;
  existing?: ClientFile;
}) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState(
    existing
      ? {
          societe: existing.societe ?? "",
          nom: existing.nom,
          prenom: existing.prenom ?? "",
          adresse: existing.adresse ?? "",
          cp: existing.cp ?? "",
          ville: existing.ville ?? "",
          tel: existing.tel ?? "",
          mobile: existing.mobile ?? "",
          email: existing.email ?? "",
          statutJuridique: existing.statutJuridique ?? "",
          raisonSociale: existing.raisonSociale ?? "",
          nomMagasin: existing.nomMagasin ?? "",
          siret: existing.siret ?? "",
          tvaIntra: existing.tvaIntra ?? "",
          codeNaf: existing.codeNaf ?? "",
          joursFermeture: existing.joursFermeture ?? "",
          visitePreinstallation: existing.visitePreinstallation,
          dateInstallationSouhaitee: existing.dateInstallationSouhaitee ?? "",
          dateFormationSouhaitee: existing.dateFormationSouhaitee ?? "",
          saisirFichierProduit: existing.saisirFichierProduit,
          decoupePlanMenuiserie: existing.decoupePlanMenuiserie,
          decoupePlanMarbrerie: existing.decoupePlanMarbrerie,
          ouverturePrevue: existing.ouverturePrevue ?? "",
          equipement: { ...emptyEquipement, ...existing.equipement },
          remarques: existing.remarques ?? "",
        }
      : emptyForm(),
  );

  const [loading, setLoading] = useState(false);
  const [xlsxImporting, setXlsxImporting] = useState(false);
  const [pdfImporting, setPdfImporting] = useState(false);

  const applyPatch = (patch: BDCPatch) => {
    setForm((f) => ({
      ...f,
      ...patch,
      equipement: patch.equipement
        ? { ...f.equipement, ...patch.equipement }
        : f.equipement,
    }));
  };

  const handleXlsx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setXlsxImporting(true);
    try {
      const { patch, allEntries } = await parseXlsxBDC(file);

      /* ── DEBUG: ouvre la console (F12) pour voir les labels bruts ── */
      const matched = allEntries.filter((en) => {
        const k = en.label.trim().toLowerCase().replace(/\s+/g, " ");
        return k in BDC_MAP;
      });
      const unmatched = allEntries.filter((en) => {
        const k = en.label.trim().toLowerCase().replace(/\s+/g, " ");
        return en.label && !(k in BDC_MAP);
      });
      applyPatch(patch);
      toast.success(`${matched.length} champ(s) mis à jour`);
    } catch {
      toast.error("Erreur lors de la lecture du fichier");
    } finally {
      setXlsxImporting(false);
      e.target.value = "";
    }
  };

  const handlePdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfImporting(true);
    try {
      const patch = await parsePdfBDC(file);
      applyPatch(patch);
      const count =
        Object.keys(patch).length + Object.keys(patch.equipement ?? {}).length;
      toast.success(`${count} champ(s) mis à jour depuis le PDF`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de la lecture du PDF";
      toast.error(msg);
    } finally {
      setPdfImporting(false);
      e.target.value = "";
    }
  };

  const set = (field: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  const setEquip = (field: keyof Equipement, value: number | boolean) =>
    setForm((f) => ({
      ...f,
      equipement: { ...f.equipement, [field]: value },
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    setLoading(true);
    try {
      if (existing) {
        await dispatch(
          updateClientFile(existing._id, form) as unknown as Parameters<
            typeof dispatch
          >[0],
        );
        toast.success("Fiche mise à jour");
      } else {
        await dispatch(
          createClientFile(form) as unknown as Parameters<typeof dispatch>[0],
        );
        toast.success("Fiche créée");
      }
      onClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const data = err.response.data as {
          message: string;
          duplicate?: { nom: string; societe?: string };
        };
        const who = [data.duplicate?.nom, data.duplicate?.societe]
          .filter(Boolean)
          .join(" — ");
        toast.error(`${data.message}${who ? ` (${who})` : ""}`, {
          duration: 5000,
        });
      } else {
        toast.error("Erreur lors de l'enregistrement");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white";
  const labelCls = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
            <h3 className="font-semibold text-gray-900">
              {existing ? "Modifier la fiche client" : "Nouvelle fiche client"}
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* ── BDC Import panel ─────────────────────────────────────── */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1.5 mb-2.5">
                <FileSpreadsheet size={14} />
                Importer depuis un fichier BDC
              </p>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-amber-400 hover:bg-white/60 transition-colors bg-white">
                  <FileSpreadsheet
                    size={16}
                    className="text-amber-500 shrink-0"
                  />
                  <span className="text-xs text-gray-500">
                    {xlsxImporting ? "Lecture XLSX…" : "Importer .xlsx"}
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    disabled={xlsxImporting || pdfImporting}
                    onChange={handleXlsx}
                  />
                </label>
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-amber-400 hover:bg-white/60 transition-colors bg-white">
                  <FileText size={16} className="text-red-400 shrink-0" />
                  <span className="text-xs text-gray-500">
                    {pdfImporting ? "Lecture PDF…" : "Importer .pdf"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    disabled={xlsxImporting || pdfImporting}
                    onChange={handlePdf}
                  />
                </label>
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                XLSX : libellés col. A — valeurs col. B.  PDF : texte digital
                uniquement (pas de scan).
              </p>
            </div>

            {/* Identité */}
            <div>
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-3">
                Identité du client
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Société</label>
                  <input
                    className={inputCls}
                    value={form.societe}
                    onChange={(e) => set("societe", e.target.value)}
                    placeholder="Société"
                  />
                </div>
                <div>
                  <label className={labelCls}>Statut juridique</label>
                  <input
                    className={inputCls}
                    value={form.statutJuridique}
                    onChange={(e) => set("statutJuridique", e.target.value)}
                    placeholder="SAS, SARL…"
                  />
                </div>
                <div>
                  <label className={labelCls}>Nom *</label>
                  <input
                    className={inputCls}
                    value={form.nom}
                    onChange={(e) => set("nom", e.target.value)}
                    required
                    placeholder="DUPONT"
                  />
                </div>
                <div>
                  <label className={labelCls}>Prénom</label>
                  <input
                    className={inputCls}
                    value={form.prenom}
                    onChange={(e) => set("prenom", e.target.value)}
                    placeholder="Jean"
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Raison sociale</label>
                  <input
                    className={inputCls}
                    value={form.raisonSociale}
                    onChange={(e) => set("raisonSociale", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Nom du magasin</label>
                  <input
                    className={inputCls}
                    value={form.nomMagasin}
                    onChange={(e) => set("nomMagasin", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Coordonnées */}
            <div>
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-3">
                Coordonnées
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Adresse</label>
                  <input
                    className={inputCls}
                    value={form.adresse}
                    onChange={(e) => set("adresse", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Code postal</label>
                  <input
                    className={inputCls}
                    value={form.cp}
                    onChange={(e) => set("cp", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Ville</label>
                  <input
                    className={inputCls}
                    value={form.ville}
                    onChange={(e) => set("ville", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Téléphone</label>
                  <input
                    className={inputCls}
                    value={form.tel}
                    onChange={(e) => set("tel", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Mobile</label>
                  <input
                    className={inputCls}
                    value={form.mobile}
                    onChange={(e) => set("mobile", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Email</label>
                  <input
                    className={inputCls}
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>N° SIRET</label>
                  <input
                    className={inputCls}
                    value={form.siret}
                    onChange={(e) => set("siret", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>N° TVA Intra</label>
                  <input
                    className={inputCls}
                    value={form.tvaIntra}
                    onChange={(e) => set("tvaIntra", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Code NAF</label>
                  <input
                    className={inputCls}
                    value={form.codeNaf}
                    onChange={(e) => set("codeNaf", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Jours de fermeture</label>
                  <input
                    className={inputCls}
                    value={form.joursFermeture}
                    onChange={(e) => set("joursFermeture", e.target.value)}
                    placeholder="Lundi, Dimanche…"
                  />
                </div>
              </div>
            </div>

            {/* Planning */}
            <div>
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-3">
                Planning
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    Date installation souhaitée
                  </label>
                  <input
                    className={inputCls}
                    value={form.dateInstallationSouhaitee}
                    onChange={(e) =>
                      set("dateInstallationSouhaitee", e.target.value)
                    }
                    placeholder="ex. LE 7/01/2026"
                  />
                </div>
                <div>
                  <label className={labelCls}>Date formation souhaitée</label>
                  <input
                    className={inputCls}
                    value={form.dateFormationSouhaitee}
                    onChange={(e) =>
                      set("dateFormationSouhaitee", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Ouverture prévue</label>
                  <input
                    className={inputCls}
                    value={form.ouverturePrevue}
                    onChange={(e) => set("ouverturePrevue", e.target.value)}
                    placeholder="ex. OUVERTURE PREVUE LE 08/01/2026"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-6 mt-4">
                {[
                  {
                    key: "visitePreinstallation",
                    label: "Visite de préinstallation",
                  },
                  {
                    key: "saisirFichierProduit",
                    label: "Saisir un fichier produit",
                  },
                  {
                    key: "decoupePlanMenuiserie",
                    label: "Découpe plan menuiserie",
                  },
                  {
                    key: "decoupePlanMarbrerie",
                    label: "Découpe plan marbrerie",
                  },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!!form[key as keyof typeof form]}
                      onChange={(e) => set(key, e.target.checked)}
                      className="w-4 h-4 rounded accent-brand-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Équipements */}
            <div>
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-3">
                Équipements commandés
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {(
                  [
                    { key: "nbCashguard", label: "Nombre de CashGuard" },
                    { key: "nbFusion", label: "Nombre de Fusion" },
                    { key: "nbCaisses", label: "Nombre de Caisses" },
                    { key: "nbAutresMateriels", label: "Autres matériels" },
                    {
                      key: "nbBalancesCaisses",
                      label: "Nb Balances / Caisses",
                    },
                    { key: "licencesTactis", label: "Licences TACTIS" },
                    { key: "licencesInno", label: "Licences INNO" },
                    { key: "pcBackoffice", label: "PC Backoffice" },
                    { key: "pcCentralisation", label: "PC Centralisation" },
                  ] as { key: keyof Equipement; label: string }[]
                ).map(({ key, label }) => (
                  <div key={key}>
                    <label className={labelCls}>{label}</label>
                    <input
                      type="number"
                      min={0}
                      className={inputCls}
                      value={form.equipement[key] as number}
                      onChange={(e) =>
                        setEquip(key, parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                ))}
                <div className="col-span-2 sm:col-span-3 flex flex-wrap gap-6 mt-2">
                  {(
                    [
                      { key: "borneAllergene", label: "Borne Allergène" },
                      { key: "borneCommande", label: "Borne de commande" },
                      {
                        key: "etiquettesElectronique",
                        label: "Étiquettes électroniques",
                      },
                      { key: "carteFidelite", label: "Carte fidélité" },
                    ] as { key: keyof Equipement; label: string }[]
                  ).map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={!!form.equipement[key]}
                        onChange={(e) => setEquip(key, e.target.checked)}
                        className="w-4 h-4 rounded accent-brand-600"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Remarques */}
            <div>
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-3">
                Remarques particulières
              </p>
              <textarea
                className={`${inputCls} min-h-[80px] resize-y`}
                value={form.remarques}
                onChange={(e) => set("remarques", e.target.value)}
                placeholder="Informations complémentaires…"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                {loading
                  ? "Enregistrement…"
                  : existing
                    ? "Mettre à jour"
                    : "Créer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}

// ─── Detail Modal (read-only) ─────────────────────────────────────────────────
function ClientDetailModal({
  file,
  onClose,
  onEdit,
}: {
  file: ClientFile;
  onClose: () => void;
  onEdit?: () => void;
}) {
  const sec =
    "text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-2 mt-4 first:mt-0";
  const row = (label: string, value?: string | number | null | boolean) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      value === false
    )
      return null;
    return (
      <div className="flex gap-2 text-sm">
        <span className="text-gray-400 w-40 shrink-0 text-xs">{label}</span>
        <span className="text-gray-800 font-medium text-xs break-all">
          {typeof value === "boolean" ? "Oui" : String(value)}
        </span>
      </div>
    );
  };

  const eq = file.equipement;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                {file.nom.toUpperCase()}
                {file.prenom ? ` ${file.prenom}` : ""}
              </h3>
              {file.societe && (
                <p className="text-xs text-brand-600 flex items-center gap-1 mt-0.5">
                  <Building2 size={11} />
                  {file.societe}
                  {file.statutJuridique ? ` - ${file.statutJuridique}` : ""}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Pencil size={12} />
                  Modifier
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="px-6 py-5 space-y-1.5">
            {/* Identité */}
            <p className={sec}>Identité</p>
            {row("Raison sociale", file.raisonSociale)}
            {row("Nom du magasin", file.nomMagasin)}
            {row("SIRET", file.siret)}
            {row("TVA Intra", file.tvaIntra)}
            {row("Code NAF", file.codeNaf)}

            {/* Adresse */}
            <p className={sec}>Coordonnées</p>
            {row("Adresse", file.adresse)}
            {(file.cp || file.ville) &&
              row(
                "CP / Ville",
                [file.cp, file.ville].filter(Boolean).join(" "),
              )}
            {row("Téléphone", file.tel)}
            {row("Mobile", file.mobile)}
            {row("Email", file.email)}
            {row("Jours de fermeture", file.joursFermeture)}

            {/* Planning */}
            <p className={sec}>Planning</p>
            {row("Installation souhaitée", file.dateInstallationSouhaitee)}
            {row("Formation souhaitée", file.dateFormationSouhaitee)}
            {row("Ouverture prévue", file.ouverturePrevue)}
            {row(
              "Visite préinstallation",
              file.visitePreinstallation || undefined,
            )}
            {row(
              "Saisir fichier produit",
              file.saisirFichierProduit || undefined,
            )}
            {row(
              "Découpe plan menuiserie",
              file.decoupePlanMenuiserie || undefined,
            )}
            {row(
              "Découpe plan marbrerie",
              file.decoupePlanMarbrerie || undefined,
            )}

            {/* Équipements */}
            <p className={sec}>Équipements commandés</p>
            {row("CashGuard", eq.nbCashguard || undefined)}
            {row("Fusion", eq.nbFusion || undefined)}
            {row("Caisses", eq.nbCaisses || undefined)}
            {row("Balances / Caisses", eq.nbBalancesCaisses || undefined)}
            {row("Licences TACTIS", eq.licencesTactis || undefined)}
            {row("Licences INNO", eq.licencesInno || undefined)}
            {row("PC Backoffice", eq.pcBackoffice || undefined)}
            {row("Autres matériels", eq.nbAutresMateriels || undefined)}
            {row("Borne Allergène", eq.borneAllergene || undefined)}
            {row("Borne de commande", eq.borneCommande || undefined)}
            {row(
              "Étiquettes électroniques",
              eq.etiquettesElectronique || undefined,
            )}
            {row("Carte fidélité", eq.carteFidelite || undefined)}

            {/* Remarques */}
            {file.remarques && (
              <>
                <p className={sec}>Remarques</p>
                <p className="text-xs text-gray-700 whitespace-pre-wrap">
                  {file.remarques}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function FichesClients() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const auth = useContext(UidContext);
  const isMonteur = !!auth?.isMonteur;
  const isAdmin = !!auth?.isAdmin;

  const clientFiles = useSelector(
    (state: { clientFilesReducer: ClientFilesState }) =>
      state.clientFilesReducer.clientFiles,
  );

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ClientFile | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  useEffect(() => {
    dispatch(getAllClientFiles() as unknown as Parameters<typeof dispatch>[0]);
  }, [dispatch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  if (!isMonteur) {
    return (
      <AccessDenied
        title="Accès monteur requis"
        message="Cette page est réservée aux monteurs."
      />
    );
  }

  const filtered = clientFiles
    .filter((f) => {
      const q = search.toLowerCase();
      return (
        f.nom.toLowerCase().includes(q) ||
        (f.prenom ?? "").toLowerCase().includes(q) ||
        (f.societe ?? "").toLowerCase().includes(q) ||
        (f.ville ?? "").toLowerCase().includes(q) ||
        (f.cp ?? "").includes(q)
      );
    })
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }));

  const totalPageCount = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const openCreate = () => {
    setEditTarget(undefined);
    setModalOpen(true);
  };

  const openEdit = (file: ClientFile) => {
    dispatch(setSelectedClientFile(file));
    setEditTarget(file);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(
        deleteClientFile(id) as unknown as Parameters<typeof dispatch>[0],
      );
      toast.success("Fiche supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList size={22} className="text-brand-600" />
            Fiches Clients
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {clientFiles.length} fiche{clientFiles.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isMonteur && (
          <button
            onClick={openCreate}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            <Plus size={16} />
            Nouvelle fiche
          </button>
        )}
      </div>

      {/* Search + mobile add button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Rechercher par nom, société, ville…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
        {isMonteur && (
          <button
            onClick={openCreate}
            className="sm:hidden shrink-0 flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            <Plus size={16} />
            Nouvelle fiche
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList size={40} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Aucune fiche client</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map((file) => (
            <div
              key={file._id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3"
            >
              {/* Title */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                    {file.nom.toUpperCase()}
                    {file.prenom ? ` ${file.prenom}` : ""}
                  </h3>
                  {file.societe && (
                    <p className="text-xs text-brand-600 mt-0.5 flex items-center gap-1">
                      <Building2 size={11} />
                      {file.societe}
                    </p>
                  )}
                </div>
                {file.nomMagasin && (
                  <span className="shrink-0 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {file.nomMagasin}
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="space-y-1">
                {(file.adresse || file.cp || file.ville) && (
                  <p className="text-xs text-gray-500 flex items-start gap-1.5">
                    <MapPin
                      size={12}
                      className="text-gray-400 shrink-0 mt-0.5"
                    />
                    <span>
                      {file.adresse && (
                        <span className="block">{file.adresse}</span>
                      )}
                      {(file.cp || file.ville) && (
                        <span className="block">
                          {[file.cp, file.ville].filter(Boolean).join(" ")}
                        </span>
                      )}
                    </span>
                  </p>
                )}
                {(file.tel || file.mobile) && (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Phone size={12} className="text-gray-400 shrink-0" />
                    {file.mobile ? file.mobile : file.tel}
                  </p>
                )}
                {file.email && (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Mail size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate">
                      {file.email ? file.email : "Email non renseigné"}
                    </span>
                  </p>
                )}
              </div>

              {/* Equipment badges */}
              <div className="flex flex-wrap gap-1.5">
                {file.equipement.nbCaisses > 0 && (
                  <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                    {file.equipement.nbCaisses} Caisse
                    {file.equipement.nbCaisses > 1 ? "s" : ""}
                  </span>
                )}
                {file.equipement.nbBalancesCaisses > 0 && (
                  <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                    {file.equipement.nbBalancesCaisses} Caisse
                    {file.equipement.nbBalancesCaisses > 1 ? "s" : ""} (Bal.)
                  </span>
                )}
                {file.equipement.nbCashguard > 0 && (
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                    {file.equipement.nbCashguard} CashGuard
                  </span>
                )}
                {file.equipement.nbFusion > 0 && (
                  <span className="text-[10px] bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full">
                    {file.equipement.nbFusion} Fusion
                  </span>
                )}
                {file.equipement.licencesTactis > 0 && (
                  <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                    {file.equipement.licencesTactis} TACTIS
                  </span>
                )}
                {file.equipement.pcBackoffice > 0 && (
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {file.equipement.pcBackoffice} PC
                  </span>
                )}
                {file.visitePreinstallation && (
                  <span className="text-[10px] bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">
                    Préinstallation
                  </span>
                )}
              </div>

              {/* Date souhaitée */}
              {file.dateInstallationSouhaitee && (
                <p className="text-xs text-gray-400">
                  Installation : {file.dateInstallationSouhaitee}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-gray-50">
                <button
                  onClick={() => navigate(`/fiches-clients/${file._id}`)}
                  className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
                >
                  <FolderOpen size={13} />
                  Ouvrir le dossier
                </button>
                {isMonteur && (
                  <button
                    onClick={() => openEdit(file)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-600 transition-colors ml-auto"
                  >
                    <Pencil size={13} />
                    Modifier
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => setDeleteConfirm(file._id)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 py-4 flex-wrap">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPageCount }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 ||
                p === totalPageCount ||
                Math.abs(p - currentPage) <= 1,
            )
            .reduce<(number | "...")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "..." ? (
                <span key={`e${i}`} className="px-1 text-gray-400 text-sm">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p as number)}
                  className={`min-w-[2rem] h-8 px-2 rounded-lg text-sm font-medium border transition-colors ${
                    currentPage === p
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
          <button
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPageCount, p + 1))
            }
            disabled={currentPage === totalPageCount}
            className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Create / edit modal */}
      {modalOpen && (
        <ClientFileModal
          onClose={() => {
            setModalOpen(false);
            setEditTarget(undefined);
          }}
          existing={editTarget}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">
                Supprimer la fiche ?
              </h3>
              <p className="text-sm text-gray-500">
                Cette action est irréversible.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
