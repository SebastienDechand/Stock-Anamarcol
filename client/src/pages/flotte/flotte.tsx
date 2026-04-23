import { useEffect, useState, useCallback, useContext, useRef } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../hooks/redux";
import {
  getAllVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  uploadVehicleDocument,
  deleteVehicleDocument,
} from "../../actions/vehicles.actions";
import type {
  Vehicle,
  VehicleForm,
  VehicleBrand,
  VehicleModel,
} from "../../types";
import { UidContext } from "../../components/AppContext";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  X,
  Loader2,
  FileUp,
  Truck,
  Car,
  AlertCircle,
  Eye,
  ChevronDown,
  FileText,
  Calendar,
  FileEdit,
} from "lucide-react";
import toast from "react-hot-toast";

const emptyForm: VehicleForm = {
  marque: "mercedes",
  modele: "citan",
  format: "utilitaire",
  immatriculation: "",
  dateRevision: "",
  dateCtInspection: "",
  dateCtExpiration: "",
  dateControlAntiPollutionInspection: "",
  dateControlAntiPollutionExpiration: "",
  assignedTo: "",
  notes: "",
};

// ─── Helpers ──────────────────────────────────────────
const getValidModels = (marque: VehicleBrand): VehicleModel[] => {
  if (marque === "mercedes") return ["citan", "vito"];
  return ["navara"];
};

const getValidFormats = (modele: VehicleModel): string[] => {
  if (modele === "navara") return ["pickup"];
  return ["utilitaire", "camion"];
};

const formatDate = (date: string | Date | undefined) => {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR");
};

const isDateExpiringSoon = (date: string | Date | undefined) => {
  if (!date) return false;
  const d = new Date(date);
  const today = new Date();
  const days = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return days <= 30 && days > 0;
};

const isDateExpired = (date: string | Date | undefined) => {
  if (!date) return false;
  return new Date(date).getTime() < new Date().getTime();
};

const addYears = (dateStr: string, years: number): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split("T")[0];
};

const DOC_TYPE_LABELS: Record<string, string> = {
  facture_revision: "Facture révision",
  ct: "Contrôle technique",
  anti_pollution: "Anti-pollution",
  autre: "Autre",
};

// ─── Model sections ──────────────────────────────────
const MODEL_SECTIONS: { key: string; label: string }[] = [
  { key: "citan", label: "Mercedes Citan" },
  { key: "vito", label: "Mercedes Vito" },
  { key: "navara", label: "Nissan Navara" },
];

// ─── Sub-components ───────────────────────────────────
const FormatBadge = ({ format }: { format: string }) => {
  if (format === "utilitaire")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <Truck size={11} /> Utilitaire
      </span>
    );
  if (format === "camion")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
        <Truck size={11} /> Camion
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
      <Car size={11} /> Pickup
    </span>
  );
};

const DateCell = ({ date }: { date: string | Date | undefined }) => (
  <div>
    <span className="text-gray-900">{formatDate(date)}</span>
    {isDateExpiringSoon(date) && (
      <div className="flex items-center gap-1 text-orange-600 text-xs mt-0.5">
        <AlertCircle size={12} /> À renouveler
      </div>
    )}
    {isDateExpired(date) && (
      <div className="flex items-center gap-1 text-red-600 text-xs mt-0.5">
        <AlertCircle size={12} /> Expirée
      </div>
    )}
  </div>
);

// Pour la révision : la date est celle où elle a été réalisée.
// On alerte si elle date de plus de 12 mois (révision annuelle).
const RevisionDateCell = ({ date }: { date: string | Date | undefined }) => {
  if (!date) return <span className="text-gray-900">-</span>;
  const due = new Date(date);
  due.setFullYear(due.getFullYear() + 1);
  const daysUntilDue = (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return (
    <div>
      <span className="text-gray-900">{formatDate(date)}</span>
      {daysUntilDue <= 0 && (
        <div className="flex items-center gap-1 text-orange-600 text-xs mt-0.5">
          <AlertCircle size={12} /> À renouveler
        </div>
      )}
      {daysUntilDue > 0 && daysUntilDue <= 30 && (
        <div className="flex items-center gap-1 text-orange-600 text-xs mt-0.5">
          <AlertCircle size={12} /> Bientôt due
        </div>
      )}
    </div>
  );
};

// Versions inline pour les cards mobiles (pas de div imbriqués dans span)
const dateInlineClass = (date: string | Date | undefined) => {
  if (!date) return "text-gray-400";
  if (isDateExpired(date)) return "text-red-600 font-medium";
  if (isDateExpiringSoon(date)) return "text-orange-600 font-medium";
  return "text-gray-700";
};

const revisionInlineClass = (date: string | Date | undefined) => {
  if (!date) return "text-gray-400";
  const due = new Date(date);
  due.setFullYear(due.getFullYear() + 1);
  const days = (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days <= 30 ? "text-orange-600 font-medium" : "text-gray-700";
};

// ─── Custom animated select ───────────────────────────
interface SelectOption {
  value: string;
  label: string;
}

const CustomSelect = ({
  name,
  value,
  onChange,
  options,
  className = "",
}: {
  name: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  options: SelectOption[];
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-left flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
      >
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected?.label ?? "—"}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`absolute z-50 w-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-200 ease-out origin-top ${
          open
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="p-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange({
                  target: { name, value: opt.value },
                } as unknown as React.ChangeEvent<HTMLSelectElement>);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-sm text-left rounded-lg transition-colors ${
                value === opt.value
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Text Input Component ─────────────────────────────
interface TextInputProps {
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  required?: boolean;
  uppercase?: boolean;
}

function TextInput({
  name,
  label,
  value,
  onChange,
  placeholder,
  icon,
  required,
  uppercase,
}: TextInputProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-3 text-blue-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full ${icon ? "pl-10" : "px-4"} pr-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-800 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 hover:border-gray-300 ${uppercase ? "uppercase" : ""}`}
        />
      </div>
    </div>
  );
}

// ─── Select Input Component ───────────────────────────
interface SelectInputProps {
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
  icon?: React.ReactNode;
  required?: boolean;
}

function SelectInput({
  name,
  label,
  value,
  onChange,
  options,
  icon,
  required,
}: SelectInputProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-3 text-blue-400 pointer-events-none z-10">
            {icon}
          </div>
        )}
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full ${icon ? "pl-10" : "px-4"} pr-10 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-800 appearance-none transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 hover:border-gray-300 cursor-pointer`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

// ─── Textarea Input Component ─────────────────────────
interface TextareaInputProps {
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
}

function TextareaInput({
  name,
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: TextareaInputProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-2">
        {label}
      </label>
      <div className="relative group">
        <FileEdit className="absolute left-3 top-3 w-5 h-5 text-blue-400 pointer-events-none" />
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-800 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 hover:border-gray-300 resize-none"
        />
      </div>
    </div>
  );
}

// ─── Date Input Component ────────────────────────────
interface DateInputProps {
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  optional?: boolean;
  hint?: string;
}

function DateInput({
  name,
  label,
  value,
  onChange,
  optional,
  hint,
}: DateInputProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-2">
        {label}
        {hint && <span className="text-gray-500 font-normal ml-1">{hint}</span>}
      </label>
      <div className="relative group">
        <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-blue-400 pointer-events-none" />
        <input
          type="date"
          name={name}
          value={value || ""}
          onChange={onChange}
          className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-800 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 hover:border-gray-300"
        />
      </div>
    </div>
  );
}

// ─── Vehicle Form Fields ──────────────────────────────
interface VehicleFormFieldsProps {
  form: VehicleForm;
  users: any[];
  onChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >;
}

function VehicleFormFields({ form, users, onChange }: VehicleFormFieldsProps) {
  const marqueOptions: SelectOption[] = [
    { value: "mercedes", label: "Mercedes" },
    { value: "nissan", label: "Nissan" },
  ];
  const modeleOptions: SelectOption[] = getValidModels(form.marque).map(
    (m) => ({
      value: m,
      label: m === "citan" ? "Citan" : m === "vito" ? "Vito" : "Navara",
    }),
  );
  const formatOptions: SelectOption[] = getValidFormats(form.modele).map(
    (f) => ({
      value: f,
      label:
        f === "utilitaire"
          ? "Utilitaire"
          : f === "pickup"
            ? "Pickup"
            : "Camion",
    }),
  );
  const assignedOptions: SelectOption[] = [
    { value: "", label: "Aucun" },
    ...(Array.isArray(users)
      ? users.map((u: any) => ({ value: u._id, label: u.pseudo }))
      : []),
  ];

  const inputCls =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-5">
      {/* Véhicule */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectInput
          name="marque"
          label="Marque"
          value={form.marque}
          onChange={onChange as any}
          options={marqueOptions}
          required
        />
        <SelectInput
          name="modele"
          label="Modèle"
          value={form.modele}
          onChange={onChange as any}
          options={modeleOptions}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectInput
          name="format"
          label="Format"
          value={form.format}
          onChange={onChange as any}
          options={formatOptions}
          required
        />
        <TextInput
          name="immatriculation"
          label="Immatriculation"
          value={form.immatriculation}
          onChange={onChange as any}
          placeholder="Ex: AB-123-CD"
          required
          uppercase
        />
      </div>

      {/* Révision + Responsable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DateInput
          name="dateRevision"
          label="Date Révision"
          value={form.dateRevision || ""}
          onChange={onChange as any}
        />
        <SelectInput
          name="assignedTo"
          label="Affecté à"
          value={form.assignedTo || ""}
          onChange={onChange as any}
          options={assignedOptions}
        />
      </div>

      {/* CT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-200">
        <DateInput
          name="dateCtInspection"
          label="Date CT réalisée"
          value={form.dateCtInspection || ""}
          onChange={onChange as any}
        />
        <DateInput
          name="dateCtExpiration"
          label="CT expire le"
          value={form.dateCtExpiration || ""}
          onChange={onChange as any}
          hint="(auto +2 ans)"
        />
      </div>

      {/* Anti-Pollution */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-200">
        <DateInput
          name="dateControlAntiPollutionInspection"
          label="Anti-Pollution réalisée"
          value={form.dateControlAntiPollutionInspection || ""}
          onChange={onChange as any}
        />
        <DateInput
          name="dateControlAntiPollutionExpiration"
          label="Anti-Pollution expire le"
          value={form.dateControlAntiPollutionExpiration || ""}
          onChange={onChange as any}
          hint="(auto +2 ans)"
        />
      </div>

      {/* Notes */}
      <div className="pt-3 border-t border-gray-200">
        <TextareaInput
          name="notes"
          label="Notes"
          value={form.notes || ""}
          onChange={onChange as any}
          placeholder="Notes ou commentaires..."
          rows={2}
        />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────
export default function FlottePage() {
  const dispatch = useAppDispatch();
  useContext(UidContext);

  const users = useSelector((state: any) => state.usersReducer || []);
  const vehiclesState = useSelector(
    (state: any) => state.vehiclesReducer || { vehicles: [], isLoading: false },
  );
  const vehicles: Vehicle[] = Array.isArray(vehiclesState?.vehicles)
    ? vehiclesState.vehicles
    : [];
  const isLoading: boolean = vehiclesState?.isLoading || false;

  const [search, setSearch] = useState("");
  const [filterMarque, setFilterMarque] = useState<VehicleBrand | "">("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleForm>(emptyForm);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadDocType, setUploadDocType] = useState("facture_revision");
  const [viewerDoc, setViewerDoc] = useState<{
    name: string;
    url: string;
    isImage: boolean;
  } | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    dispatch(getAllVehicles() as unknown as Parameters<typeof dispatch>[0]);
  }, [dispatch]);

  // Always reflect latest vehicle data from store in details modal
  const selectedVehicleData =
    vehicles.find((v) => v._id === selectedVehicle?._id) || selectedVehicle;

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      !search ||
      v.immatriculation.toLowerCase().includes(search.toLowerCase()) ||
      (v.assignedToName &&
        v.assignedToName.toLowerCase().includes(search.toLowerCase()));
    const matchesMarque = !filterMarque || v.marque === filterMarque;
    return matchesSearch && matchesMarque;
  });

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleFormChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { name, value } = e.target;

      if (name === "marque") {
        const newMarque = value as VehicleBrand;
        const validModels = getValidModels(newMarque);
        setForm((prev) => ({
          ...prev,
          marque: newMarque,
          modele: validModels[0],
          format: getValidFormats(validModels[0])[0] as any,
        }));
      } else if (name === "modele") {
        const newModele = value as VehicleModel;
        const validFormats = getValidFormats(newModele);
        setForm((prev) => ({
          ...prev,
          modele: newModele,
          format: validFormats[0] as any,
        }));
      } else if (name === "dateCtInspection") {
        setForm((prev) => ({
          ...prev,
          dateCtInspection: value,
          dateCtExpiration: addYears(value, 2),
        }));
      } else if (name === "dateControlAntiPollutionInspection") {
        setForm((prev) => ({
          ...prev,
          dateControlAntiPollutionInspection: value,
          dateControlAntiPollutionExpiration: addYears(value, 2),
        }));
      } else {
        setForm((prev) => ({ ...prev, [name]: value }));
      }
    },
    [],
  );

  const handleAddVehicle = async () => {
    if (!form.immatriculation.trim()) {
      toast.error("L'immatriculation est requise");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await dispatch(
      createVehicle(form) as unknown as Parameters<typeof dispatch>[0],
    );
    if (createVehicle.fulfilled.match(result)) {
      toast.success("Véhicule ajouté avec succès");
      setIsAddModalOpen(false);
      setForm(emptyForm);
    } else {
      toast.error(result.payload as string);
    }
  };

  const handleEditVehicle = async () => {
    if (!selectedVehicle?._id) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await dispatch(
      updateVehicle({
        id: selectedVehicle._id,
        data: form,
      }) as unknown as Parameters<typeof dispatch>[0],
    );
    if (updateVehicle.fulfilled.match(result)) {
      toast.success("Véhicule mis à jour");
      setIsEditModalOpen(false);
      setSelectedVehicle(null);
      setForm(emptyForm);
    } else {
      toast.error(result.payload as string);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await dispatch(
      deleteVehicle(id) as unknown as Parameters<typeof dispatch>[0],
    );
    if (deleteVehicle.fulfilled.match(result)) {
      toast.success("Véhicule supprimé");
      setDeleteConfirmId(null);
    } else {
      toast.error(result.payload as string);
    }
  };

  const openEditModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setForm({
      marque: vehicle.marque,
      modele: vehicle.modele,
      format: vehicle.format,
      immatriculation: vehicle.immatriculation,
      dateRevision: vehicle.dateRevision
        ? new Date(vehicle.dateRevision).toISOString().split("T")[0]
        : "",
      dateCtInspection: vehicle.dateCtInspection
        ? new Date(vehicle.dateCtInspection).toISOString().split("T")[0]
        : "",
      dateCtExpiration: vehicle.dateCtExpiration
        ? new Date(vehicle.dateCtExpiration).toISOString().split("T")[0]
        : "",
      dateControlAntiPollutionInspection:
        vehicle.dateControlAntiPollutionInspection
          ? new Date(vehicle.dateControlAntiPollutionInspection)
              .toISOString()
              .split("T")[0]
          : "",
      dateControlAntiPollutionExpiration:
        vehicle.dateControlAntiPollutionExpiration
          ? new Date(vehicle.dateControlAntiPollutionExpiration)
              .toISOString()
              .split("T")[0]
          : "",
      assignedTo:
        (typeof vehicle.assignedTo === "object" && vehicle.assignedTo !== null
          ? (vehicle.assignedTo as any)._id
          : vehicle.assignedTo) || "",
      notes: (vehicle as any).notes || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUploadDocument = async (
    vehicleId: string,
    file: File,
    docType: string,
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("docType", docType);
    formData.append("docName", file.name);
    setIsUploadingDoc(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await dispatch(
      uploadVehicleDocument({
        id: vehicleId,
        formData,
      }) as unknown as Parameters<typeof dispatch>[0],
    );
    setIsUploadingDoc(false);
    if (uploadVehicleDocument.fulfilled.match(result)) {
      toast.success("Document ajouté");
      // Redux store is updated by the reducer — no need to setSelectedVehicle
    } else {
      toast.error(result.payload as string);
    }
  };

  const handleDeleteDocument = async (vehicleId: string, docId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await dispatch(
      deleteVehicleDocument({ vehicleId, docId }) as unknown as Parameters<
        typeof dispatch
      >[0],
    );
    if (deleteVehicleDocument.fulfilled.match(result)) {
      toast.success("Document supprimé");
    } else {
      toast.error(result.payload as string);
    }
  };

  const openViewer = (doc: { name: string; filename: string }) => {
    const ext = doc.filename.split(".").pop()?.toLowerCase() || "";
    const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
    setViewerDoc({
      name: doc.name,
      url: `/uploads/vehicules/${doc.filename}`,
      isImage,
    });
  };

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Truck size={20} className="text-brand-600 shrink-0" />
            Flotte véhicules
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Gestion et suivi des véhicules de l'entreprise
          </p>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={20} /> Ajouter Véhicule
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par immatriculation ou membre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <CustomSelect
          name="filterMarque"
          value={filterMarque}
          onChange={(e) =>
            setFilterMarque((e.target.value as VehicleBrand) || "")
          }
          options={[
            { value: "", label: "Toutes les marques" },
            { value: "mercedes", label: "Mercedes" },
            { value: "nissan", label: "Nissan" },
          ]}
          className="sm:w-48"
        />
      </div>

      {/* Sections par modèle */}
      {isLoading && filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm flex flex-col items-center justify-center h-64 text-gray-500">
          <Truck size={48} className="mb-2 opacity-50" />
          <p>Aucun véhicule trouvé</p>
        </div>
      ) : (
        <>
          {/* ── Desktop : une seule table, sections en tbody ── */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[10%]" />
                  <col className="w-[14%]" />
                  <col className="w-[24%]" />
                  <col className="w-[12%]" />
                  <col className="w-[13%]" />
                  <col className="w-[16%]" />
                  <col className="w-[11%]" />
                </colgroup>
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Immatriculation
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Affecté à
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Révision
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      CT (expiration)
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Anti-Pollution (expiration)
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                {MODEL_SECTIONS.map((section) => {
                  const sv = filteredVehicles.filter(
                    (v) => v.modele === section.key,
                  );
                  if (sv.length === 0) return null;
                  const isCollapsed = collapsedSections.has(section.key);
                  return (
                    <tbody
                      key={section.key}
                      className="divide-y divide-gray-200"
                    >
                      <tr
                        className="bg-gray-50 hover:bg-gray-100 cursor-pointer select-none transition-colors"
                        onClick={() => toggleSection(section.key)}
                      >
                        <td colSpan={7} className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <ChevronDown
                              size={14}
                              className={`text-gray-500 shrink-0 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                            />
                            <span className="font-semibold text-gray-700 text-sm">
                              {section.label}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600 font-medium">
                              {sv.length}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {!isCollapsed &&
                        sv.map((vehicle) => (
                          <tr
                            key={vehicle._id}
                            className="hover:bg-gray-50 transition-colors cursor-pointer border-t border-gray-100"
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              setIsDetailsModalOpen(true);
                            }}
                          >
                            <td className="px-4 py-3">
                              <FormatBadge format={vehicle.format} />
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 truncate">
                              {vehicle.immatriculation}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 truncate">
                              {vehicle.assignedToName || "-"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <RevisionDateCell date={vehicle.dateRevision} />
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <DateCell date={vehicle.dateCtExpiration} />
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <DateCell
                                date={
                                  vehicle.dateControlAntiPollutionExpiration
                                }
                              />
                            </td>
                            <td
                              className="px-4 py-3 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openEditModal(vehicle)}
                                  className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                                  title="Éditer"
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedVehicle(vehicle);
                                    setIsDetailsModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                                  title="Détails"
                                >
                                  <Eye size={18} />
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteConfirmId(vehicle._id || "")
                                  }
                                  className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  );
                })}
              </table>
            </div>
          </div>

          {/* ── Mobile cards ── */}
          <div className="md:hidden flex flex-col gap-4">
            {MODEL_SECTIONS.map((section) => {
              const sv = filteredVehicles.filter(
                (v) => v.modele === section.key,
              );
              if (sv.length === 0) return null;
              const isCollapsed = collapsedSections.has(section.key);
              return (
                <div
                  key={section.key}
                  className="bg-white rounded-lg shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleSection(section.key)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors text-left select-none"
                  >
                    <ChevronDown
                      size={14}
                      className={`text-gray-500 shrink-0 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                    />
                    <span className="font-semibold text-gray-700 text-sm">
                      {section.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600 font-medium">
                      {sv.length}
                    </span>
                  </button>
                  {!isCollapsed && (
                    <div className="divide-y divide-gray-200">
                      {sv.map((vehicle) => (
                        <div
                          key={vehicle._id}
                          className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setIsDetailsModalOpen(true);
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <FormatBadge format={vehicle.format} />
                              <span className="font-semibold text-gray-900 truncate">
                                {vehicle.immatriculation}
                              </span>
                            </div>
                            <div
                              className="flex items-center gap-1 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => openEditModal(vehicle)}
                                className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                                title="Éditer"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedVehicle(vehicle);
                                  setIsDetailsModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                                title="Détails"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteConfirmId(vehicle._id || "")
                                }
                                className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          {vehicle.assignedToName && (
                            <p className="text-sm text-gray-500 mt-1">
                              {vehicle.assignedToName}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
                            <span className="text-gray-400">
                              Rév.{" "}
                              <span
                                className={revisionInlineClass(
                                  vehicle.dateRevision,
                                )}
                              >
                                {formatDate(vehicle.dateRevision)}
                              </span>
                            </span>
                            <span className="text-gray-400">
                              CT{" "}
                              <span
                                className={dateInlineClass(
                                  vehicle.dateCtExpiration,
                                )}
                              >
                                {formatDate(vehicle.dateCtExpiration)}
                              </span>
                            </span>
                            <span className="text-gray-400">
                              AP{" "}
                              <span
                                className={dateInlineClass(
                                  vehicle.dateControlAntiPollutionExpiration,
                                )}
                              >
                                {formatDate(
                                  vehicle.dateControlAntiPollutionExpiration,
                                )}
                              </span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ─── Add Modal ─── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 flex justify-between items-center p-6 border-b border-gray-200 bg-white rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-900">
                Ajouter un véhicule
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <VehicleFormFields
                form={form}
                users={users}
                onChange={handleFormChange}
              />
              <div className="flex gap-3 justify-end pt-6">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddVehicle}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    "Ajouter"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Modal ─── */}
      {isEditModalOpen && selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 flex justify-between items-center p-6 border-b border-gray-200 bg-white rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-900">
                Éditer le véhicule
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <VehicleFormFields
                form={form}
                users={users}
                onChange={handleFormChange}
              />
              {/* Documents */}
              {selectedVehicle && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">
                      Documents ({selectedVehicleData?.documents?.length || 0})
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <select
                          value={uploadDocType}
                          onChange={(e) => setUploadDocType(e.target.value)}
                          className="text-xs px-2 py-1 pr-6 border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="facture_revision">
                            Facture révision
                          </option>
                          <option value="ct">Contrôle technique</option>
                          <option value="anti_pollution">Anti-pollution</option>
                          <option value="autre">Autre</option>
                        </select>
                        <ChevronDown
                          size={10}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                      </div>
                      <label className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                        {isUploadingDoc ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <FileUp size={14} />
                        )}
                        Ajouter
                        <input
                          type="file"
                          className="hidden"
                          disabled={isUploadingDoc}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && selectedVehicle._id) {
                              handleUploadDocument(
                                selectedVehicle._id,
                                file,
                                uploadDocType,
                              );
                              e.target.value = "";
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {(selectedVehicleData?.documents?.length ?? 0) > 0 ? (
                    <ul className="space-y-1.5">
                      {(selectedVehicleData?.documents ?? []).map((doc) => (
                        <li
                          key={doc._id}
                          className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg"
                        >
                          <button
                            onClick={() => openViewer(doc)}
                            className="flex items-center gap-2 min-w-0 flex-1 text-left hover:text-blue-600 transition-colors"
                          >
                            <FileText
                              size={15}
                              className="text-gray-400 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {doc.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {DOC_TYPE_LABELS[doc.type] || doc.type} ·{" "}
                                {formatDate(doc.uploadedAt)}
                              </p>
                            </div>
                          </button>
                          <button
                            onClick={() =>
                              selectedVehicle._id &&
                              doc._id &&
                              handleDeleteDocument(selectedVehicle._id, doc._id)
                            }
                            className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors shrink-0"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      Aucun document
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-6">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleEditVehicle}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    "Mettre à jour"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirm Modal ─── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Supprimer ce véhicule ?
            </h3>
            <p className="text-gray-600 mb-6">
              Cette action ne peut pas être annulée.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteVehicle(deleteConfirmId)}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Supprimer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Details Modal ─── */}
      {isDetailsModalOpen && selectedVehicleData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 flex justify-between items-center p-6 border-b border-gray-200 bg-white rounded-t-xl">
              <div className="flex items-center gap-3">
                <FormatBadge format={selectedVehicleData.format} />
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedVehicleData.immatriculation}
                </h2>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Infos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                    Marque / Modèle
                  </p>
                  <p className="font-semibold text-gray-900">
                    {selectedVehicleData.marque === "mercedes"
                      ? "Mercedes"
                      : "Nissan"}{" "}
                    {selectedVehicleData.modele === "citan"
                      ? "Citan"
                      : selectedVehicleData.modele === "vito"
                        ? "Vito"
                        : "Navara"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                    Affecté à
                  </p>
                  <p className="font-semibold text-gray-900">
                    {selectedVehicleData.assignedToName || "-"}
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">
                  Maintenance
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      Révision
                    </p>
                    <RevisionDateCell date={selectedVehicleData.dateRevision} />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      Contrôle technique réalisé
                    </p>
                    <p className="text-sm text-gray-900">
                      {formatDate(selectedVehicleData.dateCtInspection)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Expire :</p>
                    <DateCell date={selectedVehicleData.dateCtExpiration} />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      Anti-Pollution réalisé
                    </p>
                    <p className="text-sm text-gray-900">
                      {formatDate(
                        selectedVehicleData.dateControlAntiPollutionInspection,
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Expire :</p>
                    <DateCell
                      date={
                        selectedVehicleData.dateControlAntiPollutionExpiration
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              {(selectedVehicleData as any).notes && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                    Notes
                  </p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">
                    {(selectedVehicleData as any).notes}
                  </p>
                </div>
              )}

              {/* Documents — read-only, clic pour visualiser */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">
                  Documents ({selectedVehicleData.documents?.length || 0})
                </p>
                {selectedVehicleData.documents?.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedVehicleData.documents.map((doc) => (
                      <li key={doc._id}>
                        <button
                          onClick={() => openViewer(doc)}
                          className="w-full flex items-center gap-2 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors text-left"
                        >
                          <FileText
                            size={16}
                            className="text-blue-500 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {DOC_TYPE_LABELS[doc.type] || doc.type} ·{" "}
                              {formatDate(doc.uploadedAt)}
                            </p>
                          </div>
                          <Eye size={14} className="text-gray-400 shrink-0" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    Aucun document - gérez-les depuis l'édition
                  </p>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    openEditModal(selectedVehicleData);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Éditer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Document Viewer Modal ─── */}
      {viewerDoc && (
        <div
          className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[60] p-4"
          onClick={() => setViewerDoc(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden"
            style={{ maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-xl shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={16} className="text-blue-500 shrink-0" />
                <span className="text-sm font-medium text-gray-900 truncate">
                  {viewerDoc.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <a
                  href={viewerDoc.url}
                  download={viewerDoc.name}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  Télécharger
                </a>
                <button
                  onClick={() => setViewerDoc(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-100 min-h-0">
              {viewerDoc.isImage ? (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img
                    src={viewerDoc.url}
                    alt={viewerDoc.name}
                    className="max-w-full max-h-full object-contain rounded"
                  />
                </div>
              ) : (
                <iframe
                  src={viewerDoc.url}
                  title={viewerDoc.name}
                  className="w-full h-full border-0"
                  style={{ minHeight: "70vh" }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
