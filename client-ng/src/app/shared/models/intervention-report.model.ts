export interface CashguardUnit {
  up?: string;
  ub?: string;
  cassetteSlots: [string, string, string, string];
  assignedRegisters: string[];
  hasPc: boolean;
}

export interface InterventionReport {
  _id: string;
  clientFile:
    | string
    | {
        _id: string;
        lastName: string;
        firstName?: string;
        company?: string;
        postalCode?: string;
        city?: string;
      };
  twRegister1?: string;
  twRegister2?: string;
  twRegister3?: string;
  twRegisters?: string[];
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
