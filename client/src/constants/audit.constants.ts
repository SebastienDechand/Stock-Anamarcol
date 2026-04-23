import { LogIn, Plus, Trash2, Pencil, Upload, ArrowRightLeft, Package, User, Users, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ActionInfo {
  label: string;
  icon: LucideIcon;
  color: string;
}

export interface EntityInfo {
  label: string;
  icon: LucideIcon;
}

export const ACTION_MAP: Record<string, ActionInfo> = {
  login:  { label: "Connexion",    icon: LogIn,          color: "bg-green-100 text-green-700" },
  create: { label: "Ajout",        icon: Plus,           color: "bg-blue-100 text-blue-700" },
  delete: { label: "Suppression",  icon: Trash2,         color: "bg-red-100 text-red-700" },
  update: { label: "Modification", icon: Pencil,         color: "bg-amber-100 text-amber-700" },
  move:   { label: "Déplacement",  icon: ArrowRightLeft, color: "bg-cyan-100 text-cyan-700" },
  upload: { label: "Upload",       icon: Upload,         color: "bg-purple-100 text-purple-700" },
};

export const ENTITY_MAP: Record<string, EntityInfo> = {
  user:    { label: "Membre",   icon: User },
  contact: { label: "Contact",  icon: Users },
  item:    { label: "Article",  icon: Package },
  vehicle: { label: "Véhicule", icon: Truck },
};

export const DEFAULT_ACTION: ActionInfo = {
  label: "Action",
  icon: Package,
  color: "bg-gray-100 text-gray-700",
};
