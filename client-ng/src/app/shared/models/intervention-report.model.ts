export interface CashguardUnit {
  up?: string;
  ub?: string;
  k7Slots: [string, string, string, string];
  assignedCaisses: string[];
  hasPc: boolean;
}

export interface InterventionReport {
  _id: string;
  clientFile:
    | string
    | {
        _id: string;
        nom: string;
        prenom?: string;
        societe?: string;
        cp?: string;
        ville?: string;
      };
  twCaisse1?: string;
  twCaisse2?: string;
  twCaisse3?: string;
  twCaisses?: string[];
  twPc?: string;
  cashguardUnits: CashguardUnit[];
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type InterventionReportForm = Omit<
  InterventionReport,
  '_id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
>;
