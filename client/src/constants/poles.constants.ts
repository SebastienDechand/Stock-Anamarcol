import { Headset, Warehouse, Wrench, Monitor, Crown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface PoleInfo {
  label: string;
  icon: LucideIcon;
  color: string;
}

export const POLES: PoleInfo[] = [
  { label: "Hotline",         icon: Headset,   color: "bg-red-600" },
  { label: "Monteur",         icon: Wrench,    color: "bg-gray-600" },
];

export const POLE_ENTREPOT: PoleInfo = {
  label: "Entrepôt",
  icon: Warehouse,
  color: "bg-amber-600",
};

export const POLE_DIRECTION: PoleInfo = {
  label: "Direction",
  icon: Crown,
  color: "bg-brand-700",
};

export const POLE_GESTION: PoleInfo = {
  label: "Gestion du site",
  icon: Monitor,
  color: "bg-blue-600",
};

export const ALL_POLE_LABELS = [
  "Direction",
  ...POLES.map((p) => p.label),
  "Entrepôt",
  "Gestion du site",
] as const;

export type PoleName = (typeof ALL_POLE_LABELS)[number];
