import InterventionReportModel, {
  IInterventionReport,
} from '../../models/interventionReport.model';
import type { HydratedDocument } from 'mongoose';

export function listInterventionReports(filter: Record<string, unknown>) {
  return InterventionReportModel.find(filter)
    .sort({ createdAt: -1 })
    .populate('clientFile', 'lastName firstName company postalCode city')
    .lean();
}

export function findInterventionReportById(id: string) {
  return InterventionReportModel.findById(id)
    .populate('clientFile', 'lastName firstName company postalCode city')
    .lean();
}

export function findInterventionReportDocument(
  id: string,
): Promise<HydratedDocument<IInterventionReport> | null> {
  return InterventionReportModel.findById(id);
}

export function createInterventionReport(data: Partial<IInterventionReport>) {
  return InterventionReportModel.create(data);
}

export function deleteInterventionReportById(id: string) {
  return InterventionReportModel.findByIdAndDelete(id);
}
